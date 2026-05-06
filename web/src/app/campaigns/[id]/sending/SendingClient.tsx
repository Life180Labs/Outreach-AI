"use client";

import Link from "next/link";

export function SendingClient({ campaign, recentLeads, stats }: any) {
  const progressPercent = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full">
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-4xl font-semibold text-emerald-600 mb-1">{stats.sent || 64}</p>
            <p className="text-brand-muted text-sm font-medium">Sent</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-4xl font-semibold text-amber-600 mb-1">{stats.pending || 18}</p>
            <p className="text-brand-muted text-sm font-medium">Pending</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-4xl font-semibold text-red-600 mb-1">{stats.failed || 2}</p>
            <p className="text-brand-muted text-sm font-medium">Failed</p>
          </div>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Progress</h3>
          <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="h-2.5 bg-[#7ba6f5] rounded-full transition-all duration-1000" style={{ width: `${progressPercent || 76}%` }}></div>
          </div>
          <p className="text-brand-muted text-sm">{progressPercent || 76}% complete · ~8 min remaining · 30 emails/hr</p>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Follow-up queue</h3>
          <div className="space-y-4 pl-1">
            <div className="relative pl-6 pb-4 border-l-2 border-brand-border">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <h4 className="text-black font-bold text-sm">Day 0 — Initial email</h4>
              <p className="text-brand-muted text-sm mt-0.5">Sending now</p>
            </div>
            <div className="relative pl-6 pb-4 border-l-2 border-brand-border">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h4 className="text-black font-bold text-sm">Day 3 — Follow-up #1</h4>
              <p className="text-brand-muted text-sm mt-0.5">Queued · if no reply</p>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h4 className="text-black font-bold text-sm">Day 7 — Follow-up #2</h4>
              <p className="text-brand-muted text-sm mt-0.5">Queued · if no reply</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm">
            Pause campaign
          </button>
          <button className="bg-white hover:bg-red-50 border border-red-200 text-red-900 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm">
            Stop all sequences
          </button>
        </div>
        
        <div className="text-center">
          <Link href={`/campaigns/${campaign.id}`} className="text-brand-muted text-sm hover:text-black hover:underline mt-4 inline-block font-semibold">
             View dashboard overview &rarr;
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-black font-semibold text-sm mb-3">Live send feed</h3>
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden h-[500px] overflow-y-auto divide-y divide-brand-border">
          <div className="p-4 flex items-start gap-3 bg-brand-surface">
            <div className="mt-0.5">
              <div className="w-3 h-3 text-emerald-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div>
              <p className="text-black font-bold text-sm">rania@novaspark.ai</p>
              <p className="text-brand-muted text-xs mt-0.5">Sent · 2s ago</p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3 bg-brand-surface">
            <div className="mt-0.5">
              <div className="w-3 h-3 text-emerald-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div>
              <p className="text-black font-bold text-sm">james@cognify.io</p>
              <p className="text-brand-muted text-xs mt-0.5">Sent · 5s ago</p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3 bg-brand-surface">
            <div className="mt-0.5 text-orange-400 font-bold text-xs mt-1">!</div>
            <div>
              <p className="text-black font-bold text-sm">khalid@visioncore.ae</p>
              <p className="text-brand-muted text-xs mt-0.5">Retry · invalid domain</p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3 bg-brand-surface">
            <div className="mt-0.5">
              <div className="w-3 h-3 text-emerald-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div>
              <p className="text-black font-bold text-sm">sara@heliosml.com</p>
              <p className="text-brand-muted text-xs mt-0.5">Sent · 9s ago</p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3 bg-brand-surface">
            <div className="mt-0.5">
              <div className="w-3 h-3 text-emerald-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div>
              <p className="text-black font-bold text-sm">meera@inferiq.com</p>
              <p className="text-brand-muted text-xs mt-0.5">Sent · 14s ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
