import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { generateEmailDraft } from "@/lib/ai";
import nodemailer from "nodemailer";

export const generateDraftsBatch = inngest.createFunction(
  { id: "generate-drafts-batch", event: "campaign/generate.drafts" } as any,
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
      await step.run(`generate-draft-${lead.id}`, async () => {
        try {
          const draft = await generateEmailDraft(lead, campaign);
          await prisma.lead.update({
            where: { id: lead.id },
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
  { 
    id: "send-email-sequence",
    event: "campaign/send.sequence",
    concurrency: {
      limit: 1, // Prevent parallel processing of the same campaign queue to strictly obey maxEmailsPerHour
      key: "event.data.campaignId"
    }
  } as any,
  async ({ event, step }: any) => {
    const { campaignId } = event.data;
    
    const { campaign, settings } = await step.run("fetch-data", async () => {
      const c = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: { where: { sent: false, emailSubject: { not: null } } } }
      });
      const s = await prisma.settings.findUnique({ where: { id: "global" } });
      return { campaign: c, settings: s };
    });

    if (!campaign || !settings || !settings.smtpHost) {
      return { error: "Missing campaign or SMTP settings" };
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      }
    });

    // Calculate delay per email based on maxEmailsPerHour
    const maxEmailsPerHour = settings.maxEmailsPerHour || 50;
    const msPerEmail = Math.floor((3600 * 1000) / maxEmailsPerHour);

    for (const lead of campaign.leads) {
      await step.run(`send-email-${lead.id}`, async () => {
        try {
          // Construct email with tracking pixel
          const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/track/open?leadId=${lead.id}`;
          const htmlBody = `${lead.emailBody}<br><br><img src="${pixelUrl}" width="1" height="1" />`;
          
          await transporter.sendMail({
            from: settings.smtpUser, // or a configurable sender email
            to: lead.email,
            subject: lead.emailSubject!,
            html: htmlBody,
          });

          await prisma.lead.update({
            where: { id: lead.id },
            data: { sent: true, status: "warm" } // Mark sent
          });

          // Trigger follow-up scheduler
          await inngest.send({
            name: "campaign/schedule.followup",
            data: { leadId: lead.id, campaignId: campaign.id }
          } as any);

        } catch (e) {
          console.error(`Failed to send to ${lead.email}`, e);
        }
      });

      // Throttle
      await step.sleep("throttle-send", msPerEmail);
    }

    return { success: true };
  }
);

export const scheduleFollowUps = inngest.createFunction(
  { id: "schedule-follow-ups", event: "campaign/schedule.followup" } as any,
  async ({ event, step }: any) => {
    const { leadId, campaignId } = event.data;

    // Wait 3 days for Follow-up #1
    await step.sleep("wait-3-days", "3d");

    const check1 = await step.run("check-reply-1", async () => {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      return lead?.replied || false;
    });

    if (check1) return { status: "replied, stopped sequence" };

    // Here we would dispatch Follow-up #1
    await step.run("send-followup-1", async () => {
      console.log(`Sending Follow-up 1 to Lead ${leadId}`);
    });

    // Wait 4 more days for Follow-up #2 (Day 7 total)
    await step.sleep("wait-4-days", "4d");

    const check2 = await step.run("check-reply-2", async () => {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      return lead?.replied || false;
    });

    if (check2) return { status: "replied, stopped sequence" };

    // Here we would dispatch Follow-up #2
    await step.run("send-followup-2", async () => {
      console.log(`Sending Follow-up 2 to Lead ${leadId}`);
    });

    return { status: "completed" };
  }
);
