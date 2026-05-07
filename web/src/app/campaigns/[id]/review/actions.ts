"use server";

import { generateEmailDraft } from "@/lib/ai";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateDraftAction(leadId: string, campaignId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  
  if (!lead || !campaign) throw new Error("Not found");

  const draft = await generateEmailDraft(lead, campaign);
  
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      emailSubject: draft.subject,
      emailBody: draft.body,
      aiRationale: draft.rationale,
      status: "warm",
    }
  });

  revalidatePath(`/campaigns/${campaignId}/review`);
  return updatedLead;
}

export async function saveDraftAction(leadId: string, subject: string, body: string, campaignId: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { emailSubject: subject, emailBody: body }
  });
  revalidatePath(`/campaigns/${campaignId}/review`);
}

export async function getLeadsAction(campaignId: string) {
  return await prisma.lead.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function approveLeadAction(leadId: string, campaignId: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { isApproved: true }
  });
  revalidatePath(`/campaigns/${campaignId}/review`);
}

export async function regenerateDraftAction(leadId: string, campaignId: string, userFeedback: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  
  if (!lead || !campaign) throw new Error("Not found");

  const { generateEmailDraft } = await import("@/lib/ai");
  const draft = await generateEmailDraft(lead, campaign, userFeedback);
  
  return await prisma.lead.update({
    where: { id: leadId },
    data: {
      emailSubject: draft.subject,
      emailBody: draft.body,
      aiRationale: draft.rationale,
      isApproved: false, // Reset approval on regenerate
    }
  });
}

export async function sendTestAction(leadId: string, testEmail: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  
  if (!lead || !settings) throw new Error("Missing data");

  const nodemailer = await import("nodemailer");
  
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || "smtp.gmail.com",
    port: settings.smtpPort || 587,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser || settings.gmailEmailAddress || "",
      pass: settings.smtpPass || "",
    },
  });

  await transporter.sendMail({
    from: (settings.smtpFromEmail || settings.smtpUser || settings.gmailEmailAddress || "outreach@life180.com") as string,
    to: testEmail,
    subject: `[TEST] ${lead.emailSubject}`,
    text: lead.emailBody!,
    html: `<div style="font-family:sans-serif">${lead.emailBody?.replace(/\n/g, '<br>')}</div>`
  });

  return { success: true };
}
