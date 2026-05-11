import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, OctagonX, BarChart3, Users, Send, Flame } from "lucide-react";
import prisma from "@/lib/prisma";
import { StopSequencesButton } from "./StopSequencesButton";
import { CampaignsClient } from "./campaigns/CampaignsClient";

export default async function DashboardPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      _count: { select: { leads: true, errors: true } },
      leads: { select: { sent: true, status: true, replied: true } },
    },
  });

  const totalLeads = campaigns.reduce((acc, c) => acc + c._count.leads, 0);
  const totalSent = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.sent).length, 0);
  const totalHot = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.status === "Hot" || l.status === "hot").length, 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.replied).length, 0);
  const lastCampaign = campaigns[0];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-black tracking-tight">Dashboard</h1>
        <p className="text-blue-600 text-sm mt-1">Overview of your outreach performance</p>
      </div>

      {/* Bento Grid — Row 1: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads} icon={Users} />
        <StatCard label="Emails Sent" value={totalSent} icon={Send} />
        <StatCard label="Replies" value={totalReplied} icon={BarChart3} accent="text-blue-600" />
        <StatCard label="Hot Leads" value={totalHot} icon={Flame} accent="text-emerald-600" />
      </div>

      {/* Bento Grid — Row 2: Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* New Campaign */}
        <Link
          href="/campaigns/new/upload"
          className="group flex flex-col justify-between p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all h-44"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 group-hover:bg-black transition-colors flex items-center justify-center">
            <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-black">New Campaign</p>
            <p className="text-xs text-blue-600/70 mt-0.5">Upload leads, configure AI, and launch</p>
          </div>
        </Link>

        {/* Resume Campaign */}
        <Link
          href={lastCampaign ? `/campaigns/${lastCampaign.id}/setup` : "/campaigns/new/upload"}
          className="group flex flex-col justify-between p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all h-44"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 group-hover:bg-black transition-colors flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-black">Resume Campaign</p>
            <p className="text-xs text-blue-600/70 mt-0.5 truncate">
              {lastCampaign?.name || "No recent campaigns"}
            </p>
          </div>
        </Link>

        {/* Kill Switch */}
        <StopSequencesButton />
      </div>

      {/* Bento Grid — Row 3: Recent Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-black">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-xs text-zinc-400 hover:text-black transition-colors">
            View all →
          </Link>
        </div>
        <div>
          {campaigns.length === 0 ? (
            <div className="col-span-full py-16 border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 gap-2">
              <BarChart3 className="w-6 h-6 opacity-30" />
              <p className="text-sm">No campaigns yet</p>
            </div>
          ) : (
            <CampaignsClient campaigns={campaigns} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  const isGreen = accent?.includes("emerald");
  const isBlue = accent?.includes("blue");
  
  return (
    <div className={`p-5 rounded-2xl border-2 transition-all ${
      isGreen ? "bg-emerald-50/50 border-emerald-100" : 
      isBlue ? "bg-blue-50/50 border-blue-100" : 
      "bg-zinc-50/50 border-zinc-100"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${accent || "text-zinc-400"}`} />
      </div>
      <p className={`text-3xl font-bold tabular-nums ${accent || "text-black"}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
