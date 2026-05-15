// src/lib/mail.ts

import nodemailer, {
  Transporter,
} from "nodemailer";

import prisma from "@/lib/prisma";

import { EncryptionService } from "@/core/security/encryption";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;

  campaignId?: string;

  smtpAccountId?: string;

  fromName?: string;
}

interface SmtpAccount {
  id: string;
  name: string;

  host: string;
  port: number;

  username: string;

  encryptedPass: string;

  encryptionType: string;

  fromEmail: string;

  fromName: string | null;
}

/**
 * Reusable transporter cache
 * Prevents reconnecting SMTP repeatedly.
 */
const transporterCache =
  new Map<
    string,
    Transporter
  >();

/**
 * Main email sender
 */
export async function sendEmail({
  to,
  subject,
  html,
  campaignId,
  smtpAccountId,
  fromName,
}: SendEmailParams) {

  let accountIdToUse =
    smtpAccountId;

  let senderDisplayName =
    fromName;

  /**
   * Resolve SMTP from campaign
   */
  if (
    !accountIdToUse &&
    campaignId
  ) {

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id: campaignId,
        },

        select: {
          smtpAccountId: true,
          senderName: true,
        },
      });

    if (
      !campaign?.smtpAccountId
    ) {
      throw new Error(
        `Campaign ${campaignId} has no SMTP account configured`
      );
    }

    accountIdToUse =
      campaign.smtpAccountId;

    senderDisplayName =
      senderDisplayName ||
      campaign.senderName ||
      "The Life180 Team";
  }

  /**
   * No SMTP available
   */
  if (!accountIdToUse) {
    throw new Error(
      "No SMTP account configured"
    );
  }

  /**
   * Fetch SMTP account
   */
  const smtpAccount =
    await prisma.smtpAccount.findUnique({
      where: {
        id: accountIdToUse,
      },

      select: {
        id: true,
        name: true,

        host: true,
        port: true,

        username: true,

        encryptedPass: true,

        encryptionType: true,

        fromEmail: true,
        fromName: true,
      },
    });

  if (!smtpAccount) {
    throw new Error(
      "SMTP account not found"
    );
  }

  /**
   * Get reusable transporter
   */
  const transporter =
    getOrCreateTransporter(
      smtpAccount
    );

  /**
   * Build sender address
   */
  const fromAddress =
    getSenderAddress(
      smtpAccount,
      senderDisplayName
    );

  /**
   * Send email
   */
  try {

    const info =
      await transporter.sendMail({
        from: fromAddress,

        to,

        subject,

        html,
      });

    return {
      success: true,

      messageId:
        info.messageId,
    };

  } catch (error) {

    console.error(
      `[SMTP ERROR] Failed to send email to ${to}`,
      error
    );

    if (
      error instanceof Error
    ) {
      throw new Error(
        `SMTP send failed: ${error.message}`
      );
    }

    throw new Error(
      "SMTP send failed"
    );
  }
}

/**
 * Returns cached transporter
 * or creates a new one.
 */
export function getOrCreateTransporter(
  account: SmtpAccount
): Transporter {

  /**
   * Reuse transporter
   */
  if (
    transporterCache.has(
      account.id
    )
  ) {
    return transporterCache.get(
      account.id
    )!;
  }

  /**
   * Decrypt password
   */
  let decryptedPassword =
    "";

  try {

    decryptedPassword =
      EncryptionService.decrypt(
        account.encryptedPass
      );

  } catch {

    throw new Error(
      `Failed to decrypt SMTP password for ${account.name}`
    );
  }

  /**
   * Create transporter
   */
  const transporter =
    nodemailer.createTransport({
      host: account.host,

      port: account.port,

      secure:
        account.encryptionType ===
        "SSL" ||
        account.port === 465,

      auth: {
        user: account.username,

        pass: decryptedPassword,
      },
    });

  /**
   * Cache transporter
   */
  transporterCache.set(
    account.id,
    transporter
  );

  return transporter;
}

/**
 * Verify SMTP connection
 * Used during setup.
 */
export async function verifyTransporter(
  account: SmtpAccount
) {

  const transporter =
    getOrCreateTransporter(
      account
    );

  try {

    await transporter.verify();

    return true;

  } catch (error) {

    console.error(
      `[SMTP VERIFY ERROR] ${account.name}`,
      error
    );

    return false;
  }
}

/**
 * Build formatted sender address
 */
export function getSenderAddress(
  account: Pick<
    SmtpAccount,
    "fromEmail" | "fromName"
  >,

  customSenderName?: string
) {

  const senderName =
    customSenderName ||
    account.fromName ||
    "The Life180 Team";

  return `"${senderName}" <${account.fromEmail}>`;
}