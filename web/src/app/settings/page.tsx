import prisma from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 min-h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-black tracking-tight">Configuration</h1>
        <p className="text-brand-muted text-sm">Configure your sending accounts and AI models.</p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
