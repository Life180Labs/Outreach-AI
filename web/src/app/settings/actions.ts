"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

export async function saveSettings(formData: FormData) {
  const data = {
    maxEmailsPerHour: parseInt(formData.get("maxEmailsPerHour") as string) || 30,
    aiProvider: formData.get("aiProvider") as string,
    geminiApiKey: formData.get("geminiApiKey") as string,
    groqApiKey: formData.get("groqApiKey") as string,
    openaiApiKey: formData.get("openaiApiKey") as string,
    claudeApiKey: formData.get("claudeApiKey") as string,
    
    // SMTP
    smtpHost: formData.get("smtpHost") as string,
    smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : null,
    smtpUser: formData.get("smtpUser") as string,
    smtpPass: formData.get("smtpPass") as string,
    
    // Gmail
    gmailEmailAddress: formData.get("gmailEmailAddress") as string,
    gmailRefreshToken: formData.get("gmailRefreshToken") as string,
  };

  await prisma.settings.upsert({
    where: { id: "global" },
    update: data,
    create: {
      id: "global",
      ...data
    }
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function testSmtpConnection(formData: FormData) {
  const host = formData.get("smtpHost") as string;
  const port = parseInt(formData.get("smtpPort") as string) || 587;
  const user = formData.get("smtpUser") as string;
  const pass = formData.get("smtpPass") as string;

  if (!host || !user || !pass) {
    return { success: false, error: "Missing SMTP configuration fields" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    console.error("SMTP Connection Test Failed:", error);
    return { success: false, error: error.message };
  }
}
