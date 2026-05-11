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
        include: { leads: true, strategy: true },
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

    // Create a single transporter pool for the entire campaign to reuse connections
    const transporter = createTransporter(settings as Settings);
    const from = getSenderAddress(settings as Settings);

    // Verify connection once before starting the loop to catch auth/host errors early
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("[SMTP Verify Failed]", verifyError);
      return { error: "SMTP connection failed. Check your settings." };
    }

    for (const lead of campaign.leads) {
      // Deterministic step ID
      await step.run(`send-email-${lead.id}`, async () => {
        // Re-fetch lead status
        const currentLead = await prisma.lead.findUnique({
          where: { id: lead.id },
          select: { sent: true }
        });

        if (currentLead?.sent) return { skipped: true, reason: "Already sent" };

        // Mark as 'Processing' in UI by updating timestamp
        await prisma.lead.update({
          where: { id: lead.id },
          data: { updatedAt: new Date() }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const trackingUrl = `${appUrl}/api/track/open/${lead.id}`;

        const { formatEmailHTML } = await import("@/lib/email-signature");
        const htmlBody = formatEmailHTML(lead.emailBody!, campaign.senderName || undefined) +
          `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" />`;

        try {
          // Send mail relying on the transporter's own timeouts
          const info = await transporter.sendMail({
            from,
            to: lead.email,
            subject: lead.emailSubject!,
            html: htmlBody,
            text: lead.emailBody!,
          });

          await prisma.lead.update({
            where: { id: lead.id },
            data: { 
              sent: true,
              messages: {
                create: {
                  role: "USER",
                  content: lead.emailBody!,
                  messageId: info.messageId,
                }
              }
            },
          });
        } catch (mailError: any) {
          console.error(`[sendMail Error] Lead: ${lead.email}`, mailError);
          // If we hit a timeout, throw to retry. Idempotency check above prevents duplicates.
          throw mailError;
        }
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
        select: { email: true, id: true, emailSubject: true, messages: true },
      });

      for (const lead of activeLeads) {
        const messageUids = await client.search({ from: lead.email });
        if (Array.isArray(messageUids) && messageUids.length > 0) {
          const lastUid = messageUids[messageUids.length - 1];
          const msg = await client.fetchOne(lastUid, { source: true, envelope: true });
          
          if (msg && msg.source && msg.envelope) {
            // Verify this email is related to our campaign thread
            const cleanSubject = lead.emailSubject ? lead.emailSubject.replace(/^(re:\s*|fwd:\s*)+/i, '').trim().toLowerCase() : "";
            const incomingSubject = msg.envelope?.subject ? msg.envelope.subject.toLowerCase() : "";
            const isRelatedBySubject = cleanSubject && incomingSubject.includes(cleanSubject);
            const isInReplyToUs = msg.envelope?.inReplyTo && lead.messages.some(m => m.messageId === msg.envelope?.inReplyTo);

            if (!isRelatedBySubject && !isInReplyToUs) {
               continue; // Skip unrelated emails
            }

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
