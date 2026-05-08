import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import prisma from "./prisma";

export type MailSettings = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFromEmail: string | null;
  gmailEmailAddress: string | null;
  gmailAppPassword?: string | null;
  gmailRefreshToken?: string | null;
};

/**
 * Creates a nodemailer transporter from the global settings.
 * Centralizes SMTP configuration so it's consistent across:
 * - Lead reply sending (leads/[id]/actions.ts)
 * - Campaign batch sending (inngest/functions.ts)
 * - Test email sending (campaigns/[id]/review/actions.ts)
 */
export function createTransporter(settings: MailSettings): Transporter {
  const host = settings.smtpHost || "smtp.gmail.com";
  const port = settings.smtpPort || (settings.smtpHost ? 587 : 465);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: settings.smtpUser || settings.gmailEmailAddress || "",
      pass: settings.smtpPass || settings.gmailRefreshToken || "",
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: { rejectUnauthorized: false },
  });
}

/**
 * Returns the "from" address to use for outbound emails.
 */
export function getSenderAddress(settings: MailSettings): string {
  return (
    settings.smtpFromEmail ||
    settings.smtpUser ||
    settings.gmailEmailAddress ||
    "outreach@life180.com"
  );
}

/**
 * Fetches global settings and returns a ready-to-use transporter.
 * Throws a descriptive error if settings are missing.
 */
export async function getTransporterFromSettings(): Promise<{
  transporter: Transporter;
  from: string;
  settings: MailSettings;
}> {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  if (!settings) {
    throw new Error("Email settings not configured. Go to Settings to configure SMTP.");
  }

  if (!settings.smtpHost && !settings.gmailEmailAddress) {
    throw new Error("No SMTP host or Gmail address configured. Go to Settings.");
  }

  const transporter = createTransporter(settings);
  const from = getSenderAddress(settings);

  return { transporter, from, settings };
}
