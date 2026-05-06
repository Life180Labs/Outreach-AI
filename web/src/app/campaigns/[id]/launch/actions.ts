"use server";

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/gmail";

export async function startCampaignAction(campaignId: string) {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "active" }
  });

  // Async process (in production use a job queue)
  processCampaignEmails(campaignId);
}

async function processCampaignEmails(campaignId: string) {
  const leads = await prisma.lead.findMany({
    where: {
      campaignId,
      emailSubject: { not: null },
      emailBody: { not: null },
      sent: false
    }
  });

  for (const lead of leads) {
    if (!lead.emailSubject || !lead.emailBody) continue;

    const result = await sendEmail(lead.email, lead.emailSubject, lead.emailBody);
    
    if (result.success) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { sent: true }
      });
    }
    
    // Simple throttle
    await new Promise(res => setTimeout(res, 2000));
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "completed" }
  });
}
