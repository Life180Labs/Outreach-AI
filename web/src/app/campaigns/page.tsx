import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Plus, PlayCircle, CheckCircle2, FileText } from "lucide-react";

export default async function CampaignsListPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { leads: true } },
      leads: { select: { sent: true, status: true } },
    },
  });

  const active = campaigns.filter((c) => c.status === "active");
  const completed = campaigns.filter((c) => c.status === "completed" || c.status === "paused");
  const drafts = campaigns.filter((c) => c.status === "draft");

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Campaigns</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track your outreach performance</p>
        </div>
        <Link
          href="/campaigns/new/upload"
          className="bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Active */}
      <Section icon={PlayCircle} title="Active" count={active.length} color="emerald">
        {active.length === 0 ? (
          <EmptyState text="No active sequences running" />
        ) : (
          active.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </Section>

      {/* Completed & Paused */}
      <Section icon={CheckCircle2} title="Completed & Paused" count={completed.length} color="zinc">
        {completed.length === 0 ? (
          <EmptyState text="Nothing here yet" />
        ) : (
          completed.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </Section>

      {/* Drafts */}
      <Section icon={FileText} title="Drafts" count={drafts.length} color="amber">
        {drafts.length === 0 ? (
          <EmptyState text="No pending drafts" />
        ) : (
          drafts.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  color,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const badgeColors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    zinc: "bg-zinc-50 text-zinc-600 border-zinc-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-black">{title}</h2>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeColors[color] || badgeColors.zinc}`}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full py-10 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center">
      <p className="text-sm text-zinc-400">{text}</p>
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: Record<string, unknown> & { leads: Array<{ sent: boolean; status: string }>; _count: { leads: number }; id: string; name: string | null; status: string } }) {
  const sentCount = c.leads.filter((l) => l.sent).length;
  const hotCount = c.leads.filter((l) => l.status === "hot" || l.status === "Hot").length;
  const progress = c._count.leads > 0 ? Math.round((sentCount / c._count.leads) * 100) : 0;

  return (
    <Link
      href={c.status === "draft" ? `/campaigns/${c.id}/setup` : `/campaigns/${c.id}`}
      className="group p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-black truncate group-hover:text-zinc-700">
            {c.name || "Untitled Campaign"}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {c._count.leads} leads · {c.status}
          </p>
        </div>
        <div
          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
            c.status === "active" ? "bg-emerald-500" : c.status === "draft" ? "bg-amber-400" : "bg-zinc-300"
          }`}
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
          <span>Progress</span>
          <span className="font-medium text-zinc-600">{progress}%</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${c.status === "completed" ? "bg-emerald-500" : "bg-black"}`}
            style={{ width: `${c.status === "completed" ? 100 : progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span><span className="font-semibold text-black">{sentCount}</span> Sent</span>
          <span><span className="font-semibold text-emerald-600">{hotCount}</span> Hot</span>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />
      </div>
    </Link>
  );
}
