"use client";

import { useState } from "react";
import { generateDraftAction, saveDraftAction } from "./actions";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function ReviewClient({ campaign, initialLeads }: { campaign: any, initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id);
  const [loading, setLoading] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const draftedLeadsCount = leads.filter(l => l.emailSubject).length;
  const needReviewCount = leads.length - draftedLeadsCount;

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      const updated = await generateDraftAction(selectedLead.id, campaign.id);
      setLeads(leads.map(l => l.id === updated.id ? updated : l));
    } catch (e) {
      console.error(e);
      alert("Failed to generate draft. Check if Gemini API key is configured.");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    await saveDraftAction(selectedLead.id, subject, body, campaign.id);
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, emailSubject: subject, emailBody: body } : l));
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-6 mb-4 shrink-0">
        <div className="bg-[#eef8ed] border border-[#b2ddab] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
            <p className="text-[#2b6528] text-sm font-medium">{draftedLeadsCount} emails generated. {needReviewCount} flagged for review (empty drafts). Approve all or check individually.</p>
          </div>
          <button className="text-[#2b6528] text-sm font-medium flex items-center hover:underline">
            See all <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-6">
        <div className="w-72 flex flex-col border border-brand-border rounded-l-2xl bg-brand-surface shrink-0">
          <div className="p-3 border-b border-brand-border">
            <p className="text-brand-muted text-xs font-semibold uppercase tracking-wider">{leads.length} leads · {needReviewCount} need review</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map(lead => (
              <button 
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full text-left p-4 border-b border-brand-border flex items-start gap-3 transition-colors ${selectedLeadId === lead.id ? 'bg-white border-l-4 border-l-black shadow-sm' : 'hover:bg-zinc-50 border-l-4 border-l-transparent'}`}
              >
                <div className="mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${lead.emailSubject ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-brand-muted truncate">{lead.companyName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-l-0 border-brand-border rounded-r-2xl bg-white p-8 relative">
          {selectedLead ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black">
                    {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black">{selectedLead.firstName} {selectedLead.lastName}</h2>
                    <p className="text-brand-muted text-sm">{selectedLead.jobTitle} · {selectedLead.companyName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">AI</span>
                  {selectedLead.emailSubject ? (
                    <span className="bg-[#eef8ed] text-[#2b6528] px-2 py-1 rounded text-xs font-bold border border-[#b2ddab]">Ready</span>
                  ) : (
                     <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">Needs Review</span>
                  )}
                </div>
              </div>

              {selectedLead.emailSubject ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Subject line</label>
                    <input 
                      type="text" 
                      name="subject" 
                      defaultValue={selectedLead.emailSubject}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-black font-medium focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Email body</label>
                    <textarea 
                      name="body" 
                      defaultValue={selectedLead.emailBody}
                      rows={6}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-black text-sm leading-relaxed focus:outline-none resize-none" 
                    />
                  </div>

                  {selectedLead.aiRationale && (
                    <div className="bg-[#f2edfa] border border-[#d6c4f0] rounded-xl p-4 flex gap-2">
                      <div className="text-[#5b32a8] font-medium text-sm w-full">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Why this email?
                        </div>
                        <span className="text-[#6d41c4] italic block mt-1 opacity-90">{selectedLead.aiRationale}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                      Edit
                    </button>
                    <button type="button" onClick={handleGenerate} className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                      Regenerate
                    </button>
                    <button type="button" className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                      Send test to me
                    </button>
                    <div className="flex-1 text-right">
                      <button type="button" className="bg-black hover:bg-zinc-800 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                        Approve
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-brand-border rounded-xl bg-brand-surface">
                  <p className="text-brand-muted mb-4">No draft generated yet.</p>
                  <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm shadow-sm"
                  >
                    {loading ? 'Generating...' : 'Generate AI Draft'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-brand-muted">
              Select a lead to review.
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-brand-border flex items-center justify-center gap-4">
        <Link href={`/campaigns/${campaign.id}/launch`} className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold transition-colors inline-flex items-center gap-1 text-sm shadow-sm">
          Approve all & proceed <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-brand-muted text-sm">{draftedLeadsCount} approved · {needReviewCount} pending review</span>
      </div>
    </div>
  );
}
