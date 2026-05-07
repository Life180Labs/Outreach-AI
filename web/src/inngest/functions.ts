import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { generateEmailDraft } from "@/lib/ai";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export const ping = inngest.createFunction(
  { id: "ping", triggers: [{ event: "test/ping" }] },
  async ({ event, step }) => {
    return { message: "pong" };
  }
);

export const generateDraftsBatch = inngest.createFunction(
  { id: "generate-drafts-batch", triggers: [{ event: "campaign/generate.drafts" }] },
  async ({ event, step }: any) => {
    const { campaignId } = event.data;

    const campaign = await step.run("fetch-campaign", async () => {
      return await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: true },
      });
    });

    if (!campaign) return { error: "Campaign not found" };

    const leadsToProcess = campaign.leads.filter((l: any) => !l.emailSubject);

    for (const lead of leadsToProcess) {
      // Use unique step ID for every lead to avoid memoization issues
      await step.run(`gen-${lead.id}-${Date.now()}`, async () => {
        try {
          // Re-fetch lead to ensure we have fresh data
          const currentLead = await prisma.lead.findUnique({ where: { id: lead.id } });
          if (!currentLead) return;

          const draft = await generateEmailDraft(currentLead, campaign);
          await prisma.lead.update({
            where: { id: currentLead.id },
            data: {
              emailSubject: draft.subject,
              emailBody: draft.body,
              aiRationale: draft.rationale,
            }
          });
        } catch (e) {
          console.error(`Failed to generate draft for ${lead.email}`, e);
        }
      });
    }

    return { success: true, processed: leadsToProcess.length };
  }
);

export const sendEmailSequence = inngest.createFunction(
  { id: "send-email-sequence", triggers: [{ event: "campaign/send.sequence" }] },
  async ({ event, step }: any) => {
    const { campaignId } = event.data;
    console.log(`[sendEmailSequence] Processing campaign ${campaignId}`);

    const { campaign, settings } = await step.run("fetch-data", async () => {
      const c = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: { where: { sent: false, isApproved: true } } }
      });
      const s = await prisma.settings.findUnique({ where: { id: "global" } });
      return { campaign: c, settings: s };
    });

    if (!campaign || !settings || (!settings.smtpHost && !settings.gmailEmailAddress)) {
      return { error: "Missing campaign or sending configuration" };
    }

    for (const lead of campaign.leads) {
      await step.run(`send-email-${lead.id}`, async () => {
        const port = settings.smtpPort || (settings.smtpHost ? 587 : 465);
        const isSecure = settings.smtpSecure !== null ? settings.smtpSecure : (port === 465);

        const transporter = nodemailer.createTransport({
          host: settings.smtpHost || "smtp.gmail.com",
          port: port,
          secure: isSecure,
          auth: {
            user: settings.smtpUser || settings.gmailEmailAddress,
            pass: settings.smtpPass || settings.gmailAppPassword,
          },
          connectionTimeout: 10000,
          tls: { rejectUnauthorized: false }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const trackingUrl = `${appUrl}/api/track/open/${lead.id}`;
        
        const htmlBody = `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            ${lead.emailBody!.replace(/\n/g, '<br>')}
          </div>
          <img src="${trackingUrl}" width="1" height="1" style="display:none !important;" />
        `;

        await transporter.sendMail({
          from: settings.smtpFromEmail || settings.smtpUser || settings.gmailEmailAddress,
          to: lead.email,
          subject: lead.emailSubject!,
          html: htmlBody,
          text: lead.emailBody!,
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { sent: true }
        });
      });
    }

    return { success: true };
  }
);

export const scheduleFollowUps = inngest.createFunction(
  { id: "schedule-follow-ups", triggers: [{ event: "campaign/schedule.followup" }] },
  async ({ event, step }: any) => {
    const { leadId } = event.data;
    await step.sleep("wait-3-days", "3d");

    const replied = await step.run("check-reply", async () => {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      return lead?.replied || false;
    });

    if (replied) return { status: "replied" };

    await step.run("send-followup", async () => {
      console.log(`Sending Follow-up for Lead ${leadId}`);
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

    if (!settings || (!settings.smtpHost && !settings.gmailEmailAddress)) return { error: "No settings" };

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

    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    
    const results = [];
    try {
      const activeLeads = await prisma.lead.findMany({
        where: { 
          sent: true, 
          OR: [
            { replied: false },
            { replied: true, messages: { none: { role: 'LEAD' } } }
          ]
        },
        select: { email: true, id: true }
      });

      for (const lead of activeLeads) {
        const messageUids = await client.search({ from: lead.email });
        if (Array.isArray(messageUids) && messageUids.length > 0) {
          // Fetch the latest message content
          const lastUid = messageUids[messageUids.length - 1];
          const msg = await client.fetchOne(lastUid, { source: true, envelope: true });
          if (msg && msg.source) {
            const content = msg.source.toString().split('\r\n\r\n')[1] || "Reply received (Content could not be parsed)";

            await step.run(`mark-replied-${lead.id}`, async () => {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { 
                  replied: true, 
                  status: "Hot",
                  messages: {
                    create: {
                      role: 'LEAD',
                      content: content.length > 500 ? content.substring(0, 500) + "..." : content
                    }
                  }
                }
              });
            });
          }
          results.push(lead.email);
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    return { checked: results.length, replies: results };
  }
);
