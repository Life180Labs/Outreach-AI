"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SendingClient({ campaign, recentLeads, stats }: any) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [router]);

  const progressPercent = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full">
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-2xl sm:text-4xl font-semibold text-emerald-600 mb-1">{stats.sent}</p>
            <p className="text-brand-muted text-sm font-medium">Sent</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-2xl sm:text-4xl font-semibold text-amber-600 mb-1">{stats.pending}</p>
            <p className="text-brand-muted text-sm font-medium">Pending</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-2xl sm:text-4xl font-semibold text-red-600 mb-1">{stats.failed}</p>
            <p className="text-brand-muted text-sm font-medium">Failed</p>
          </div>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Progress</h3>
          <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="h-2.5 bg-[#7ba6f5] rounded-full transition-all duration-1000" style={{ width: `${progressPercent || 76}%` }}></div>
          </div>
          <p className="text-brand-muted text-sm">{progressPercent}% complete · {stats.total > 0 ? `${Math.ceil(stats.pending / 30 * 60)} min remaining` : 'No leads'} · 30 emails/hr</p>
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
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm italic">
              Waiting for first email to send...
            </div>
          ) : recentLeads.map((lead: any) => (
            <div key={lead.id} className="p-4 flex items-start gap-3 bg-brand-surface hover:bg-white transition-colors">
              <div className="mt-0.5">
                <div className={`w-3 h-3 ${lead.sent ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {lead.sent ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse ml-0.5 mt-0.5" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-black font-bold text-sm truncate max-w-[180px]">{lead.email}</p>
                <p className="text-brand-muted text-xs mt-0.5" suppressHydrationWarning>
                  {lead.sent ? 'Sent' : 'Pending'} · {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
