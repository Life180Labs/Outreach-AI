import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { generateEmailDraft } from "@/lib/ai";
import { createTransporter, getSenderAddress } from "@/lib/mail";
import type { Settings } from "@/types";
import { ImapFlow } from "imapflow";

export const ping = inngest.createFunction(
  { id: "ping", triggers: [{ event: "test/ping" }] },
  async ({ event, step }) => {
    return { message: "pong" };
  }
);

export const generateDraftsBatch = inngest.createFunction(
  { id: "generate-drafts-batch", triggers: [{ event: "campaign/generate.drafts" }] },
  async ({ event, step }: { event: { data: { campaignId: string } }; step: any }) => {
    const { campaignId } = event.data;

    const campaign = await step.run("fetch-campaign", async () => {
      return await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: true },
      });
    });

    if (!campaign) return { error: "Campaign not found" };

    // Fetch settings ONCE for the entire batch instead of per-lead
    const settings = await step.run("fetch-settings", async () => {
      return await prisma.settings.findUnique({ where: { id: "global" } });
    });

    const leadsToProcess = campaign.leads.filter((l: any) => !l.emailSubject);

    for (const lead of leadsToProcess) {
      // Deterministic step ID — safe for Inngest retries/idempotency
      await step.run(`gen-draft-${lead.id}`, async () => {
        try {
          const currentLead = await prisma.lead.findUnique({ where: { id: lead.id } });
          if (!currentLead) return;

          // Pass cached settings to avoid N+1 DB queries
          const draft = await generateEmailDraft(currentLead, campaign, "", settings as Settings | null);
          await prisma.lead.update({
            where: { id: currentLead.id },
            data: {
              emailSubject: draft.subject,
              emailBody: draft.body,
              aiRationale: draft.rationale,
            },
          });
        } catch (e) {
          console.error(`[generateDraftsBatch] Failed for ${lead.email}:`, e);
        }
      });
    }

    return { success: true, processed: leadsToProcess.length };
  }
);

export const sendEmailSequence = inngest.createFunction(
  { id: "send-email-sequence", triggers: [{ event: "campaign/send.sequence" }] },
  async ({ event, step }: { event: { data: { campaignId: string } }; step: any }) => {
    const { campaignId } = event.data;

    const { campaign, settings } = await step.run("fetch-data", async () => {
      const c = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: { where: { sent: false, isApproved: true } } },
      });
      const s = await prisma.settings.findUnique({ where: { id: "global" } });
      return { campaign: c, settings: s };
    });

    if (!campaign || !settings || (!settings.smtpHost && !settings.gmailEmailAddress)) {
      return { error: "Missing campaign or sending configuration" };
    }

    for (const lead of campaign.leads) {
      // Deterministic step ID
      await step.run(`send-email-${lead.id}`, async () => {
        const transporter = createTransporter(settings as Settings);
        const from = getSenderAddress(settings as Settings);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const trackingUrl = `${appUrl}/api/track/open/${lead.id}`;

        const { formatEmailHTML } = await import("@/lib/email-signature");
        const htmlBody = formatEmailHTML(lead.emailBody!) +
          `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" />`;


        await transporter.sendMail({
          from,
          to: lead.email,
          subject: lead.emailSubject!,
          html: htmlBody,
          text: lead.emailBody!,
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { sent: true },
        });
      });
    }

    return { success: true };
  }
);

export const scheduleFollowUps = inngest.createFunction(
  { id: "schedule-follow-ups", triggers: [{ event: "campaign/schedule.followup" }] },
  async ({ event, step }: { event: { data: { leadId: string } }; step: any }) => {
    const { leadId } = event.data;
    await step.sleep("wait-3-days", "3d");

    const replied = await step.run("check-reply", async () => {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      return lead?.replied || false;
    });

    if (replied) return { status: "replied" };

    await step.run("send-followup", async () => {
      console.log(`[scheduleFollowUps] Sending follow-up for lead ${leadId}`);
    });

    return { status: "completed" };
  }
);

export const checkInboxForReplies = inngest.createFunction(
  { id: "check-inbox-replies", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const settings = await step.run("fetch-settings", async () => {
      return await prisma.settings.findUnique({ where: { id: "global" } });
    });

    if (!settings || (!settings.smtpHost && !settings.gmailEmailAddress)) {
      return { error: "No settings" };
    }

    const client = new ImapFlow({
      host: settings.smtpHost?.replace("smtp.", "imap.") || "imap.gmail.com",
      port: 993,
      secure: true,
      auth: {
        user: settings.smtpUser || settings.gmailEmailAddress!,
        pass: settings.smtpPass!,
      },
      logger: false,
    });

    try {
      await client.connect();
    } catch (connectError) {
      console.error("[checkInboxForReplies] IMAP connect failed:", connectError);
      return { error: "IMAP connection failed" };
    }

    const lock = await client.getMailboxLock("INBOX");

    const results: string[] = [];
    try {
      const activeLeads = await prisma.lead.findMany({
        where: {
          sent: true,
          OR: [
            { replied: false },
            { replied: true, messages: { none: { role: "LEAD" } } },
          ],
        },
        select: { email: true, id: true },
      });

      for (const lead of activeLeads) {
        const messageUids = await client.search({ from: lead.email });
        if (Array.isArray(messageUids) && messageUids.length > 0) {
          const lastUid = messageUids[messageUids.length - 1];
          const msg = await client.fetchOne(lastUid, { source: true, envelope: true });
          if (msg && msg.source) {
            const content =
              msg.source.toString().split("\r\n\r\n")[1] ||
              "Reply received (Content could not be parsed)";

            // Deterministic step ID
            await step.run(`mark-replied-${lead.id}`, async () => {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  replied: true,
                  status: "Hot",
                  messages: {
                    create: {
                      role: "LEAD",
                      content:
                        content.length > 500
                          ? content.substring(0, 500) + "..."
                          : content,
                    },
                  },
                },
              });
            });
          }
          results.push(lead.email);
        }
      }
    } finally {
      lock.release();
      await client.logout().catch(() => {});
    }

    return { checked: results.length, replies: results };
  }
);
