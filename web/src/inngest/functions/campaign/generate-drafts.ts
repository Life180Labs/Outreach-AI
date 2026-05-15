// src/inngest/functions/campaign/generate-drafts.ts
// Batch AI draft generation for campaign leads
// Features: concurrency control, retries, parallel processing

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { generateEmailDraft } from "@/modules/ai/ai.service";
import { logger } from "@/lib/logger";
import type { Settings, Lead, CampaignWithStrategy } from "@/types";

export const generateDraftsBatch = inngest.createFunction(
  {
    id: "generate-drafts-batch",
    retries: 3,
    concurrency: {
      limit: 3,
    },
    triggers: [{ event: "campaign/generate.drafts" }],
  },
  async ({ event, step }: { event: { data: { campaignId: string } }; step: any }) => {
    const { campaignId } = event.data as { campaignId: string };

    // Step 1: Fetch campaign with leads and strategy
    const campaign = await step.run("fetch-campaign", async () => {
      return prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: true, strategy: true },
      });
    });

    if (!campaign) {
      logger.error("Campaign not found for draft generation", "GenerateDrafts", { campaignId });
      return { error: "Campaign not found" };
    }

    // Step 2: Fetch user settings (cached for all leads)
    const settings = await step.run("fetch-settings", async () => {
      return prisma.settings.findUnique({
        where: { userId: campaign.userId },
      });
    });

    if (!settings) {
      logger.error("Settings not found for draft generation", "GenerateDrafts", { userId: campaign.userId });
      return { error: "AI settings not configured" };
    }

    // Step 3: Filter leads needing drafts
    const leadsToProcess = campaign.leads.filter(
      (l: Lead) => !l.emailSubject
    );

    if (leadsToProcess.length === 0) {
      return { success: true, processed: 0, message: "No leads need drafts" };
    }

    // Step 4: Process leads in batches
    const BATCH_SIZE = 5;
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < leadsToProcess.length; i += BATCH_SIZE) {
      const batch = leadsToProcess.slice(i, i + BATCH_SIZE);

      const results = await step.run(`gen-batch-${i}`, async () => {
        const batchResults = await Promise.allSettled(
          batch.map(async (lead: Lead) => {
            const currentLead = await prisma.lead.findUnique({
              where: { id: lead.id },
              select: { id: true, emailSubject: true },
            });

            // Skip if already generated (idempotency)
            if (!currentLead || currentLead.emailSubject) return "skipped";

            const draft = await generateEmailDraft(
              lead,
              campaign as CampaignWithStrategy,
              "",
              settings as Settings
            );

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                emailSubject: draft.subject,
                emailBody: draft.body,
                aiRationale: draft.rationale,
              },
            });

            return "success";
          })
        );

        return batchResults.map((r) => ({
          status: r.status,
          value: r.status === "fulfilled" ? r.value : null,
          error: r.status === "rejected" ? String(r.reason) : null,
        }));
      });

      for (const result of results) {
        if (result.status === "fulfilled" && result.value === "success") {
          processed++;
        } else if (result.status === "rejected") {
          failed++;
          logger.error("Draft generation failed for lead", "GenerateDrafts", {
            error: result.error,
          });
        }
      }
    }

    logger.info("Draft generation complete", "GenerateDrafts", {
      campaignId,
      processed,
      failed,
      total: leadsToProcess.length,
    });

    return { success: true, processed, failed, total: leadsToProcess.length };
  }
);
