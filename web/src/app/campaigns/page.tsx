import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Inbox, CheckCircle2, PlayCircle, FileText } from "lucide-react";

export default async function CampaignsListPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { leads: true } },
      leads: { select: { sent: true, status: true } }
    }
  });

  const active = campaigns.filter(c => c.status === 'active');
  const completed = campaigns.filter(c => c.status === 'completed' || c.status === 'paused');
  const drafts = campaigns.filter(c => c.status === 'draft');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Campaigns</h1>
          <p className="text-brand-muted text-sm">Manage and track your outreach performance</p>
        </div>
        <Link href="/campaigns/new/upload" className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm text-sm flex items-center gap-2">
          New Campaign
        </Link>
      </div>

      {/* Active Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <PlayCircle className="w-5 h-5" />
          <h2 className="text-lg font-bold">Active Sequences</h2>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs border border-emerald-100">{active.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.length === 0 ? (
            <div className="col-span-full py-8 border-2 border-dashed border-zinc-100 rounded-2xl flex flex-col items-center justify-center text-brand-muted">
              <p className="text-sm">No active sequences running right now.</p>
            </div>
          ) : active.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      </section>

      {/* Completed/Paused Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <CheckCircle2 className="w-5 h-5" />
          <h2 className="text-lg font-bold">Completed & Paused</h2>
          <span className="bg-zinc-50 text-zinc-600 px-2 py-0.5 rounded-full text-xs border border-zinc-200">{completed.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.length === 0 ? (
            <div className="col-span-full py-8 border border-zinc-100 rounded-2xl flex flex-col items-center justify-center text-brand-muted opacity-60">
              <p className="text-sm italic">Nothing here yet.</p>
            </div>
          ) : completed.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      </section>

      {/* Drafts Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-bold">Drafts</h2>
          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs border border-amber-100">{drafts.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.length === 0 ? (
            <div className="col-span-full py-8 border border-zinc-100 rounded-2xl flex flex-col items-center justify-center text-brand-muted opacity-60">
              <p className="text-sm italic">No pending drafts.</p>
            </div>
          ) : drafts.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      </section>
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: any }) {
  const sentCount = c.leads.filter((l: any) => l.sent).length;
  const hotCount = c.leads.filter((l: any) => l.status === 'hot').length;
  const progress = c._count.leads > 0 ? (sentCount / c._count.leads) * 100 : 0;

  return (
    <div className="p-5 rounded-2xl border border-brand-border bg-brand-surface hover:bg-white transition-all shadow-sm hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-black text-lg group-hover:text-brand-primary transition-colors">{c.name || 'Untitled Campaign'}</h3>
          <p className="text-brand-muted text-xs font-medium uppercase tracking-wider">{c._count.leads} leads · {c.status}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : c.status === 'draft' ? 'bg-amber-400' : 'bg-zinc-300'}`}></div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-brand-muted uppercase">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ${c.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-primary'}`}
            style={{ width: `${c.status === 'completed' ? 100 : progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 mt-4 border-t border-zinc-50">
        <div className="flex items-center gap-4 text-xs font-bold text-zinc-600">
          <div>
            <span className="text-black">{sentCount}</span> Sent
          </div>
          <div>
            <span className="text-emerald-600">{hotCount}</span> Hot
          </div>
        </div>
        <Link
          href={c.status === 'draft' ? `/campaigns/${c.id}/setup` : `/campaigns/${c.id}`}
          className="text-black hover:bg-zinc-100 p-2 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
