"use client";

import { useState } from "react";
import { startCampaignAction } from "./actions";
import { Check, Loader2, Rocket, Clock, ShieldAlert, Send, Users, Activity } from "lucide-react";
import { StopSequencesButton } from "../../../StopSequencesButton";
import Link from "next/link";

export function LaunchClient({ campaign, settings, totalLeads, readyLeads }: any) {
  const [loading, setLoading] = useState(false);

  const canLaunch = readyLeads > 0 && (settings?.gmailEmailAddress || settings?.smtpHost);
  const pendingLeads = totalLeads - readyLeads;

  const handleLaunch = async () => {
    setLoading(true);
    await startCampaignAction(campaign.id);
    window.location.href = `/campaigns/${campaign.id}/sending`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Campaign</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-[10px] font-bold text-black uppercase tracking-widest">Launch Control</span>
        </div>
        <h1 className="text-2xl font-semibold text-black tracking-tight">{campaign.name || 'Ready to Launch'}</h1>
        <p className="text-zinc-400 text-sm">Final review before starting automated outreach</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Summary (7/12) */}
        <div className="flex-1 lg:w-[58.33%] space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-black">Campaign Summary</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Final review of your sequence configuration</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SummaryItem icon={Rocket} label="Campaign" value={campaign.name || "Untitled"} />
              <SummaryItem icon={Users} label="Total Leads" value={totalLeads} />
              <SummaryItem icon={Send} label="Sender Address" value={settings?.gmailEmailAddress || settings?.smtpUser || "Not connected"} />
              <SummaryItem icon={Activity} label="Send Rate" value={`${settings?.maxEmailsPerHour || 30}/hr`} />
              <SummaryItem icon={Clock} label="Est. Completion" value={`~${Math.max(1, Math.ceil(totalLeads / (settings?.maxEmailsPerHour || 30)))} hours`} />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-black">Sequence Timeline</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Automatic follow-up progression</p>
            </div>
            
            <div className="space-y-6 pl-2">
              <TimelineStep label="Day 0" title="Initial Outreach" description="Personalized email will be sent immediately." status="active" />
              <TimelineStep label={`Day ${campaign.followup1Delay || 3}`} title="Follow-up #1" description="Sent only if no reply is detected." status="pending" />
              <TimelineStep label={`Day ${campaign.followup2Delay || 7}`} title="Follow-up #2" description="Final touchpoint for non-responsive leads." status="pending" />
            </div>
          </div>
        </div>

        {/* Right Column: Checklist & Action (5/12) */}
        <div className="flex-1 lg:w-[41.66%] space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-black">Pre-send Checklist</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Safety checks before starting</p>
            </div>
            
            <ul className="space-y-4">
              <CheckItem label="Sender account connected" checked={!!(settings?.gmailEmailAddress || settings?.smtpHost)} />
              <CheckItem label={`${totalLeads} leads validated`} checked={totalLeads > 0} />
              <CheckItem label={`${readyLeads} drafts approved`} checked={readyLeads > 0} />
              <CheckItem label="Rate limits configured" checked={!!settings?.maxEmailsPerHour} />
            </ul>

            {pendingLeads > 0 && (
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">{pendingLeads} leads</span> are still pending review and will <span className="font-semibold">not</span> be sent until approved.
                </p>
              </div>
            )}

            <button 
              onClick={handleLaunch} 
              disabled={loading || !canLaunch}
              className="w-full bg-black hover:bg-zinc-800 text-white px-5 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
              Launch Campaign
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-red-100 bg-red-50/60 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">Emergency Kill Switch</span>
            </div>
            <p className="text-xs text-red-900/60 leading-relaxed">
              Stop all active outreach cycles immediately if you detect logic errors or drift.
            </p>
            <StopSequencesButton variant="button" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3 h-3 text-zinc-400" />
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tight">{label}</span>
      </div>
      <p className="text-sm font-semibold text-black truncate">{value}</p>
    </div>
  );
}

function TimelineStep({ label, title, description, status }: { label: string; title: string; description: string; status: 'active' | 'pending' }) {
  return (
    <div className="relative pl-6 border-l border-zinc-100 last:border-0 pb-6 last:pb-0">
      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${status === 'active' ? 'bg-black ring-4 ring-zinc-50' : 'bg-zinc-200'}`} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className="text-zinc-200">·</span>
        <h4 className="text-sm font-semibold text-black">{title}</h4>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-300'}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-zinc-700' : 'text-zinc-400'}`}>{label}</span>
    </li>
  );
}
