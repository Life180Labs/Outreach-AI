"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCampaignFromUpload(formData: FormData) {
  const rawData = formData.get("leadsData");
  if (!rawData) throw new Error("No data provided");
  
  const leads = JSON.parse(rawData as string);
  
  const campaign = await prisma.campaign.create({
    data: {
      name: formData.get("campaignName") as string || "New Campaign",
      status: "draft",
    }
  });

  // Create leads
  for (const lead of leads) {
    if (!lead.email) continue;
    await prisma.lead.create({
      data: {
        campaignId: campaign.id,
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email,
        companyName: lead.companyName || "",
        jobTitle: lead.jobTitle || "",
        city: lead.city || null,
        country: lead.country || null,
        notes: lead.notes || null,
        sector: lead.sector || lead.type || null,
        linkedinUrl: lead.linkedinUrl || lead.linkedin || null,
      }
    });
  }

  redirect(`/campaigns/${campaign.id}/setup`);
}

export async function updateCampaignSetup(formData: FormData) {
  const id = formData.get("campaignId") as string;
  await prisma.campaign.update({
    where: { id },
    data: {
      name: formData.get("campaignName") as string,
      tone: formData.get("tone") as string,
      cta: formData.get("cta") as string,
      context: formData.get("context") as string,
    }
  });

  redirect(`/campaigns/${id}/review`);
}
