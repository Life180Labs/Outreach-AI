"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function saveSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id as string;

  const data: any = {};
  
  if (formData.has("aiProvider")) data.aiProvider = formData.get("aiProvider") as string;
  if (formData.has("geminiApiKey")) data.geminiApiKey = formData.get("geminiApiKey") as string;
  if (formData.has("groqApiKey")) data.groqApiKey = formData.get("groqApiKey") as string;
  if (formData.has("openaiApiKey")) data.openaiApiKey = formData.get("openaiApiKey") as string;
  if (formData.has("claudeApiKey")) data.claudeApiKey = formData.get("claudeApiKey") as string;
  if (formData.has("gmailEmailAddress")) data.gmailEmailAddress = formData.get("gmailEmailAddress") as string;
  if (formData.has("gmailRefreshToken")) data.gmailRefreshToken = formData.get("gmailRefreshToken") as string;
  
  if (formData.has("maxEmailsPerHour")) {
    data.maxEmailsPerHour = parseInt(formData.get("maxEmailsPerHour") as string) || 30;
  }
  
  if (formData.has("followupDelayOptions")) {
    data.followupDelayOptions = formData.get("followupDelayOptions") as string;
  }

  try {
    await prisma.settings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });


    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addAccount(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id as string;

  const type = formData.get("type") as string;
  const name = formData.get("name") as string;
  const provider = formData.get("provider") as string;
  const config = formData.get("config") as string; // JSON string

  try {
    const account = await prisma.integrationAccount.create({
      data: {
        userId,
        type,
        name,
        provider,
        config,
        isActive: true,
      }
    });
    revalidatePath("/settings");
    return { success: true, account };
  } catch (error: any) {
    console.error("[addAccount] Failed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.integrationAccount.delete({ 
      where: { id, userId: session.user.id as string } 
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

