"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult, Lead } from "@/types";

export async function stopAllSequencesAction(): Promise<ActionResult<{ count: number }>> {
  try {
    // 1. Pause all active campaigns
    const campaignResult = await prisma.campaign.updateMany({
      where: { status: "active" },
      data: { status: "paused" },
    });

    // 2. Pause all leads that haven't finished their cycle
    await prisma.lead.updateMany({
      where: { sent: false, isApproved: true },
      data: { isPaused: true },
    });

    revalidatePath("/");
    return { success: true, data: { count: campaignResult.count } };
  } catch (error) {
    console.error("[stopAllSequences]", error);
    return { success: false, error: "Failed to stop sequences" };
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  try {
    await prisma.lead.delete({ where: { id } });
    revalidatePath("/leads");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteLead]", error);
    return { success: false, error: "Failed to delete lead" };
  }
}

export async function bulkDeleteLeadsAction(ids: string[]): Promise<ActionResult> {
  try {
    await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/leads");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[bulkDeleteLeads]", error);
    return { success: false, error: "Failed to delete leads" };
  }
}

export async function updateLeadAction(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult<Lead>> {
  try {
    const updated = await prisma.lead.update({
      where: { id },
      data,
    });
    revalidatePath("/leads");
    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateLead]", error);
    return { success: false, error: "Failed to update lead" };
  }
}

export async function bulkUpdateLeadsAction(
  ids: string[],
  data: Record<string, unknown>
): Promise<ActionResult<Lead[]>> {
  try {
    await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data,
    });

    const updated = await prisma.lead.findMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/leads");
    return { success: true, data: updated };
  } catch (error) {
    console.error("[bulkUpdateLeads]", error);
    return { success: false, error: "Failed to update leads" };
  }
}

export async function syncCampaignInboxAction(
  campaignId: string
): Promise<ActionResult<{ synced: number }>> {
  try {
    const leads = await prisma.lead.findMany({
      where: { campaignId, sent: true },
    });

    const { syncLeadInboxAction } = await import("./leads/[id]/actions");

    let synced = 0;
    for (const lead of leads) {
      try {
        const result = await syncLeadInboxAction(lead.id);
        if (result.success && result.data.newMessages > 0) synced++;
      } catch (e) {
        console.error(`[syncCampaignInbox] Failed for ${lead.email}`, e);
      }
    }

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data: { synced } };
  } catch (error) {
    console.error("[syncCampaignInbox]", error);
    return { success: false, error: "Failed to sync campaign inbox" };
  }
}
