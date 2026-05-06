import nodemailer from 'nodemailer';
import prisma from './prisma';

export async function sendEmail(to: string, subject: string, body: string) {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  
  if (!settings?.gmailEmailAddress || !settings?.gmailRefreshToken) {
    throw new Error("Gmail configuration missing in settings");
  }

  // Uses Gmail App Passwords for simplicity
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: settings.gmailEmailAddress,
      pass: settings.gmailRefreshToken,
    },
  });

  const mailOptions = {
    from: settings.gmailEmailAddress,
    to,
    subject,
    text: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}
