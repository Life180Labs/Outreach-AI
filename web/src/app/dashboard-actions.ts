"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function stopAllSequencesAction() {
  await prisma.campaign.updateMany({
    where: { status: "active" },
    data: { status: "paused" }
  });
  revalidatePath("/");
  return { success: true };
}

export async function deleteLeadAction(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
}

export async function bulkDeleteLeadsAction(ids: string[]) {
  await prisma.lead.deleteMany({
    where: { id: { in: ids } }
  });
  revalidatePath("/leads");
}

export async function updateLeadAction(id: string, data: any) {
  const updated = await prisma.lead.update({
    where: { id },
    data: data
  });
  revalidatePath("/leads");
  return updated;
}

export async function bulkUpdateLeadsAction(ids: string[], data: any) {
  await prisma.lead.updateMany({
    where: { id: { in: ids } },
    data: data
  });
  
  const updated = await prisma.lead.findMany({
    where: { id: { in: ids } }
  });
  
  revalidatePath("/leads");
  return updated;
}

export async function syncCampaignInboxAction(campaignId: string) {
  const leads = await prisma.lead.findMany({
    where: { campaignId, sent: true }
  });
  
  // Dynamic import to avoid circular dependency if any
  const { syncLeadInboxAction } = await import("./leads/[id]/actions");
  
  for (const lead of leads) {
    try {
      await syncLeadInboxAction(lead.id);
    } catch (e) {
      console.error(`Sync failed for ${lead.email}`, e);
    }
  }
  
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}
