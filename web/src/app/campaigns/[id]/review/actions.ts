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
