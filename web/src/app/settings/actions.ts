"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });
  return settings;
}

export async function saveSettings(formData: FormData) {
  const data = {
    gmailEmailAddress: formData.get("gmailEmailAddress") as string,
    gmailRefreshToken: formData.get("gmailRefreshToken") as string,
    geminiApiKey: formData.get("geminiApiKey") as string,
    maxEmailsPerHour: parseInt(formData.get("maxEmailsPerHour") as string) || 50,
  };

  await prisma.settings.upsert({
    where: { id: "global" },
    update: data,
    create: {
      id: "global",
      ...data
    }
  });

  revalidatePath("/settings");
}
