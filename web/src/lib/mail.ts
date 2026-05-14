// web/src/lib/mail.ts
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { EncryptionUtils } from "@/utils/encryption";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  campaignId?: string;    // Used to automatically find the right SMTP config
  smtpAccountId?: string; // Can be passed directly if known
  fromName?: string;      // Usually the campaign senderName
}

export async function sendEmail({
  to,
  subject,
  html,
  campaignId,
  smtpAccountId,
  fromName
}: SendEmailParams) {

  let accountIdToUse = smtpAccountId;
  let senderDisplayName = fromName;

  // 1. If an explicit SMTP ID wasn't provided, look it up via the Campaign
  if (!accountIdToUse && campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { smtpAccountId: true, senderName: true }
    });

    if (!campaign?.smtpAccountId) {
      throw new Error(`Campaign ${campaignId} has no sending email configured. Please update it in Campaign Setup.`);
    }

    accountIdToUse = campaign.smtpAccountId;
    senderDisplayName = senderDisplayName || campaign.senderName || "The Life180 Team";
  }

  if (!accountIdToUse) {
    throw new Error("Cannot send email: No SMTP Account ID provided.");
  }

  // 2. Fetch the secure SMTP configuration from the database
  const smtpAccount = await prisma.integrationAccount.findUnique({
    where: { id: accountIdToUse }
  });

  if (!smtpAccount || smtpAccount.type !== "SMTP") {
    throw new Error("Invalid or missing SMTP configuration. Please check your settings.");
  }

  // 3. Parse the config and securely DECRYPT the password in memory
  const config = JSON.parse(smtpAccount.config);
  let decryptedPassword;

  try {
    decryptedPassword = EncryptionUtils.decrypt(config.pass);
  } catch (err) {
    console.error("Failed to decrypt SMTP password for account:", smtpAccount.id);
    throw new Error("Failed to authenticate with SMTP server. Your credentials may be corrupted.");
  }

  // 4. Instantiate Nodemailer dynamically using the decrypted credentials
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465, // true for 465, false for 587/25
    auth: {
      user: config.user,
      pass: decryptedPassword,
    },
  });

  // 5. Build the "From" address formatted nicely: "Sender Name" <email@domain.com>
  const fromAddress = `"${senderDisplayName || smtpAccount.name}" <${config.user}>`;

  // 6. Dispatch the email
  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[SMTP Dispatch Error] to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Creates a Nodemailer transporter from an IntegrationAccount.
 * Used for batch processing and connection reuse in background jobs.
 */
export function createTransporter(account: any) {
  const config = typeof account.config === "string" ? JSON.parse(account.config) : account.config;
  let decryptedPassword = "";

  try {
    decryptedPassword = EncryptionUtils.decrypt(config.pass);
  } catch (err) {
    throw new Error(`Failed to decrypt password for account ${account.name}`);
  }

  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: {
      user: config.user,
      pass: decryptedPassword,
    },
  });
}

/**
 * Returns the formatted sender address for an IntegrationAccount.
 */
export function getSenderAddress(account: any, customSenderName?: string) {
  const config = typeof account.config === "string" ? JSON.parse(account.config) : account.config;
  const name = customSenderName || account.name || "The Life180 Team";
  return `"${name}" <${config.user}>`;
}