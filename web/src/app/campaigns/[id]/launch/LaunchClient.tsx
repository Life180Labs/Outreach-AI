"use client";

import { useState } from "react";
import { startCampaignAction } from "./actions";

export function LaunchClient({ campaign, settings, totalLeads, readyLeads }: any) {
  const [loading, setLoading] = useState(false);
  const [launched, setLaunched] = useState(false);

  const canLaunch = readyLeads > 0 && settings?.gmailEmailAddress;
  const pendingLeads = totalLeads - readyLeads;

  const handleLaunch = async () => {
    setLoading(true);
    await startCampaignAction(campaign.id);
    setLaunched(true);
    setLoading(false);
    window.location.href = `/campaigns/${campaign.id}/sending`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left Column */}
      <div className="space-y-6">
        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Campaign summary</h3>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <span className="text-brand-muted font-medium">Campaign</span>
                <span className="text-black font-semibold text-right">{campaign.name || 'Untitled'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <span className="text-brand-muted font-medium">Total leads</span>
                <span className="text-black font-semibold text-right">{totalLeads}</span>
              </div>
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <span className="text-brand-muted font-medium">From</span>
                <span className="text-black font-semibold text-right">{settings?.gmailEmailAddress || 'Not connected'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <span className="text-brand-muted font-medium">Send rate</span>
                <span className="text-black font-semibold text-right">{settings?.maxEmailsPerHour || 30} / hour (spam-safe)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-muted font-medium">Est. completion</span>
                <span className="text-black font-semibold text-right">~{Math.max(1, Math.ceil(totalLeads / (settings?.maxEmailsPerHour || 30)))} hours</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Follow-up sequence</h3>
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
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <div>
          <h3 className="text-black font-semibold text-sm mb-3">Pre-send checklist</h3>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-black font-medium">Gmail account connected</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-black font-medium">{totalLeads} leads validated</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-black font-medium">{readyLeads} emails approved after review</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-black font-medium">Rate limit set (spam-safe)</span>
            </li>
            {pendingLeads > 0 && (
              <li className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="text-amber-600 font-medium">{pendingLeads} leads pending manual review</span>
              </li>
            )}
          </ul>

          <button 
            onClick={handleLaunch} 
            disabled={loading || !canLaunch}
            className="w-full bg-black hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white px-4 py-4 rounded-xl font-bold transition-colors shadow-sm text-base mb-6"
          >
            {loading ? 'Launching...' : 'Launch campaign'}
          </button>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
              <p className="text-red-900 text-sm font-medium">Kill switch — stop all sequences at any time if something goes wrong.</p>
            </div>
            <button className="bg-white hover:bg-red-50 border border-red-200 text-red-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 shadow-sm">
              Stop all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
