"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCampaignFromUpload(formData: FormData) {
  const rawData = formData.get("leadsData");
  if (!rawData) throw new Error("No data provided");
  
  const leads = JSON.parse(rawData as string);
  
  // Auto-detect business type and location from leads
  const sectors = [...new Set(leads.map((l: any) => l.sector).filter(Boolean))].slice(0, 3);
  const cities = [...new Set(leads.map((l: any) => l.city).filter(Boolean))].slice(0, 2);
  const countries = [...new Set(leads.map((l: any) => l.country).filter(Boolean))].slice(0, 2);
  
  const businessType = sectors.join(" / ") || "Unknown";
  const locationContext = [...cities, ...countries].join(", ") || "Global";

  const campaign = await prisma.campaign.create({
    data: {
      name: formData.get("campaignName") as string || "New Campaign",
      status: "draft",
      businessType,
      locationContext,
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
      businessType: formData.get("businessType") as string,
      locationContext: formData.get("locationContext") as string,
      followup1Delay: parseInt(formData.get("followup1Delay") as string || "3"),
      followup2Delay: parseInt(formData.get("followup2Delay") as string || "7"),
    }
  });
  
  // Trigger bulk generation in background
  const { inngest } = await import("@/inngest/client");
  await inngest.send({
    name: "campaign/generate.drafts",
    data: { campaignId: id }
  });

  redirect(`/campaigns/${id}/review`);
}

export async function toggleCampaignStatus(id: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return;

  const newStatus = campaign.status === "active" ? "paused" : "active";
  
  await prisma.campaign.update({
    where: { id },
    data: { status: newStatus }
  });

  return newStatus;
}

export async function stopAllCampaigns() {
  await prisma.campaign.updateMany({
    where: { status: "active" },
    data: { status: "paused" }
  });
}
