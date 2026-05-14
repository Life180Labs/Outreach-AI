import prisma from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import { SmtpService } from "@/services/smtp.service";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  // Fetch or create default settings for the user
  let settings = await prisma.settings.findUnique({ 
    where: { userId }
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { userId }
    });
  }

  // Use the service to get formatted accounts (with parsed JSON config)
  const accounts = await SmtpService.getAccountsForUser(userId);

  return (
    <div className="w-full space-y-6">
      <SettingsClient settings={settings} accounts={accounts} />
    </div>
  );
}


