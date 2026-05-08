"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Clock, 
  Send, 
  AlertCircle, 
  Activity, 
  ArrowRight, 
  Pause, 
  Play,
  MailCheck,
  MailQuestion,
  MailX
} from "lucide-react";
import { StopSequencesButton } from "../../../StopSequencesButton";

export function SendingClient({ campaign, recentLeads, stats }: any) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); 
    return () => clearInterval(interval);
  }, [router]);

  const progressPercent = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Campaign</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-[10px] font-bold text-black uppercase tracking-widest">Real-time Monitor</span>
          </div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">{campaign.name || 'Monitoring Outreach'}</h1>
          <p className="text-zinc-400 text-sm">Tracking live sequence progression and responses</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Stats & Timeline (7/12) */}
        <div className="flex-1 lg:w-[58.33%] space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Sent" value={stats.sent} icon={MailCheck} color="text-emerald-600" bg="bg-emerald-50/50" border="border-emerald-100" />
            <StatCard label="Pending" value={stats.pending} icon={MailQuestion} color="text-amber-600" bg="bg-amber-50/50" border="border-amber-100" />
            <StatCard label="Failed" value={stats.failed} icon={MailX} color="text-red-600" bg="bg-red-50/50" border="border-red-100" />
          </div>

          {/* Progress */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">Overall Progress</h3>
              <span className="text-sm font-semibold text-black tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-black rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                <span>30 emails/hr</span>
              </div>
              <span>{stats.total > 0 ? `${Math.ceil(stats.pending / 30 * 60)} min remaining` : 'No leads'}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-black">Sequence Lifecycle</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Automated outreach progression</p>
            </div>
            <div className="space-y-6 pl-2">
              <TimelineStep label="Day 0" title="Initial Outreach" description="Currently being dispatched to approved leads." status="active" />
              <TimelineStep label={`Day ${campaign.followup1Delay || 3}`} title="Follow-up #1" description="Queued for leads who haven't replied." status="pending" />
              <TimelineStep label={`Day ${campaign.followup2Delay || 7}`} title="Follow-up #2" description="Final touchpoint in the automated cycle." status="pending" />
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 rounded-2xl border border-red-100 bg-red-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-red-900">Emergency Controls</p>
                <p className="text-[11px] text-red-800/60 mt-0.5">Stop all active outreach cycles immediately.</p>
              </div>
            </div>
            <StopSequencesButton variant="button" />
          </div>
        </div>

        {/* Right Column: Live Feed (5/12) */}
        <div className="flex-1 lg:w-[41.66%] flex flex-col h-[700px] rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Live Feed</h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Real-time
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {recentLeads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-3 text-center p-8">
                <Clock className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Waiting for activity...</p>
              </div>
            ) : (
              recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-4 border-b border-zinc-50 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    lead.sent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {lead.sent ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black truncate">{lead.email}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5" suppressHydrationWarning>
                      {lead.sent ? 'Dispatched' : 'Processing'} · {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Link href={`/leads/${lead.id}`} className="p-1.5 text-zinc-300 hover:text-black transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 text-center">
            <Link href={`/campaigns/${campaign.id}`} className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors flex items-center justify-center gap-1.5">
              View Campaign Insights
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-5 rounded-2xl border ${border} ${bg}`}>
      <Icon className={`w-4 h-4 ${color} mb-3`} />
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function TimelineStep({ label, title, description, status }: any) {
  return (
    <div className="relative pl-6 border-l border-zinc-100 last:border-0 pb-6 last:pb-0">
      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
        status === 'active' ? 'bg-black ring-4 ring-zinc-50' : 'bg-zinc-200'
      }`} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className="text-zinc-200">·</span>
        <h4 className="text-sm font-semibold text-black">{title}</h4>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}
