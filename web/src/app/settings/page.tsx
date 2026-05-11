export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ 
    where: { id: "global" },
    include: { accounts: { orderBy: { createdAt: 'desc' } } }
  });

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure your sending accounts and AI models</p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
