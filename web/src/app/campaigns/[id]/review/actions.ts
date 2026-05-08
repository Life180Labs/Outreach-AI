"use server";

import { generateEmailDraft } from "@/lib/ai";
import { getTransporterFromSettings } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult, Lead } from "@/types";

export async function generateDraftAction(
  leadId: string,
  campaignId: string
): Promise<ActionResult<Lead>> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!lead || !campaign) return { success: false, error: "Lead or campaign not found" };

    const draft = await generateEmailDraft(lead, campaign);

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        emailSubject: draft.subject,
        emailBody: draft.body,
        aiRationale: draft.rationale,
        status: "Warm",
      },
    });

    revalidatePath(`/campaigns/${campaignId}/review`);
    return { success: true, data: updatedLead };
  } catch (error) {
    console.error("[generateDraft]", error);
    return { success: false, error: "Failed to generate draft" };
  }
}

export async function saveDraftAction(
  leadId: string,
  subject: string,
  body: string,
  campaignId: string
): Promise<ActionResult> {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { emailSubject: subject, emailBody: body },
    });
    revalidatePath(`/campaigns/${campaignId}/review`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[saveDraft]", error);
    return { success: false, error: "Failed to save draft" };
  }
}

export async function getLeadsAction(campaignId: string): Promise<Lead[]> {
  return await prisma.lead.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveLeadAction(
  leadId: string,
  campaignId: string
): Promise<ActionResult> {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { isApproved: true },
    });
    revalidatePath(`/campaigns/${campaignId}/review`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[approveLead]", error);
    return { success: false, error: "Failed to approve lead" };
  }
}

export async function regenerateDraftAction(
  leadId: string,
  campaignId: string,
  userFeedback: string
): Promise<ActionResult<Lead>> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!lead || !campaign) return { success: false, error: "Lead or campaign not found" };

    const draft = await generateEmailDraft(lead, campaign, userFeedback);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        emailSubject: draft.subject,
        emailBody: draft.body,
        aiRationale: draft.rationale,
        isApproved: false, // Reset approval on regenerate
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("[regenerateDraft]", error);
    return { success: false, error: "Failed to regenerate draft" };
  }
}

export async function sendTestAction(
  leadId: string,
  testEmail: string
): Promise<ActionResult> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) return { success: false, error: "Lead not found" };

    const { transporter, from } = await getTransporterFromSettings();

    await transporter.sendMail({
      from,
      to: testEmail,
      subject: `[TEST] ${lead.emailSubject}`,
      text: lead.emailBody!,
      html: `<div style="font-family:sans-serif">${lead.emailBody?.replace(
        /\n/g,
        "<br>"
      )}</div>`,
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[sendTest]", error);
    const msg = error instanceof Error ? error.message : "Failed to send test email";
    return { success: false, error: msg };
  }
}
