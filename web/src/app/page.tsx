import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, OctagonX, BarChart3, Users, Send, Flame } from "lucide-react";
import prisma from "@/lib/prisma";
import { StopSequencesButton } from "./StopSequencesButton";

export default async function DashboardPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      _count: { select: { leads: true } },
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
        <p className="text-zinc-400 text-sm mt-1">Overview of your outreach performance</p>
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
            <p className="text-xs text-zinc-400 mt-0.5">Upload leads, configure AI, and launch</p>
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
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-full py-16 border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 gap-2">
              <BarChart3 className="w-6 h-6 opacity-30" />
              <p className="text-sm">No campaigns yet</p>
            </div>
          ) : (
            campaigns.map((c) => {
              const sentCount = c.leads.filter((l) => l.sent).length;
              const hotCount = c.leads.filter((l) => l.status === "Hot" || l.status === "hot").length;
              const progress = c._count.leads > 0 ? Math.round((sentCount / c._count.leads) * 100) : 0;

              return (
                <Link
                  key={c.id}
                  href={c.status === "draft" ? `/campaigns/${c.id}/setup` : `/campaigns/${c.id}`}
                  className="group p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-black truncate">{c.name || "Untitled"}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{c._count.leads} leads · {c.status}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${c.status === "active" ? "bg-emerald-500" : c.status === "draft" ? "bg-amber-400" : "bg-zinc-300"}`} />
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${c.status === "completed" ? "bg-emerald-500" : "bg-black"}`}
                        style={{ width: `${c.status === "completed" ? 100 : progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span><span className="font-semibold text-black">{sentCount}</span> sent</span>
                    <span><span className="font-semibold text-emerald-600">{hotCount}</span> hot</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-zinc-300 group-hover:text-black transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-4 h-4 ${accent || "text-zinc-400"}`} />
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${accent || "text-black"}`}>{value}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}
