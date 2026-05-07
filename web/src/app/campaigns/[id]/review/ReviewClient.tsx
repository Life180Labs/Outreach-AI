"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  generateDraftAction, 
  saveDraftAction, 
  getLeadsAction, 
  approveLeadAction, 
  regenerateDraftAction, 
  sendTestAction 
} from "./actions";
import { ArrowRight, Loader2, Sparkles, Check, Send, RefreshCcw, Save, X } from "lucide-react";
import Link from "next/link";

export function ReviewClient({ campaign, initialLeads }: { campaign: any, initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id);
  const [loading, setLoading] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [modal, setModal] = useState<{ type: 'regenerate' | 'test', feedback?: string, testEmail?: string } | null>(null);
  const router = useRouter();

  const draftedLeadsCount = leads.filter(l => l.emailSubject).length;
  const needReviewCount = leads.length - draftedLeadsCount;

  // Polling for background generation
  useEffect(() => {
    if (needReviewCount === 0) return;

    const interval = setInterval(async () => {
      const updatedLeads = await getLeadsAction(campaign.id);
      setLeads(updatedLeads);
      const stillNeedsReview = updatedLeads.filter((l: any) => !l.emailSubject).length;
      if (stillNeedsReview === 0) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [needReviewCount, campaign.id]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading("save");
    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    await saveDraftAction(selectedLead.id, subject, body, campaign.id);
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, emailSubject: subject, emailBody: body } : l));
    setLoading(null);
  };

  const handleApprove = async () => {
    if (!selectedLead) return;
    setLoading("approve");
    await approveLeadAction(selectedLead.id, campaign.id);
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, isApproved: true } : l));
    setLoading(null);
  };

  const handleRegenerate = async (feedback: string) => {
    if (!selectedLead || !feedback) return;
    setModal(null);
    setLoading("regenerate");
    try {
      const updated = await regenerateDraftAction(selectedLead.id, campaign.id, feedback);
      setLeads(leads.map(l => l.id === updated.id ? updated : l));
    } catch (e: any) {
      alert("Failed to regenerate: " + e.message);
    }
    setLoading(null);
  };

  const handleSendTest = async (testEmail: string) => {
    if (!selectedLead || !testEmail) return;
    setModal(null);
    setLoading("test");
    try {
      await sendTestAction(selectedLead.id, testEmail);
      alert("Test email sent!");
    } catch (e: any) {
      alert("Failed to send test: " + e.message);
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-4 sm:px-6 mb-4 shrink-0">
        <div className="bg-[#eef8ed] border border-[#b2ddab] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
            <p className="text-[#2b6528] text-xs sm:text-sm font-medium">
              {draftedLeadsCount} emails generated. {needReviewCount} need review.
            </p>
            {needReviewCount > 0 && (
              <div className="flex items-center gap-1.5 ml-2 bg-white px-2 py-0.5 rounded-full border border-[#b2ddab]">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">AI is working</span>
              </div>
            )}
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden text-[#2b6528] text-xs font-bold bg-white px-3 py-1 rounded border border-[#b2ddab]">
            {showSidebar ? 'Hide List' : 'Show Lead List'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-4 sm:px-6 gap-4">
        <div className={`${showSidebar ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:relative lg:flex lg:w-72 flex-col border border-brand-border rounded-2xl bg-brand-surface shrink-0 overflow-hidden`}>
          <div className="p-3 border-b border-brand-border flex items-center justify-between">
            <p className="text-brand-muted text-[10px] font-semibold uppercase tracking-wider">{leads.length} leads</p>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden text-zinc-500">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leads.map(lead => (
              <button 
                key={lead.id}
                onClick={() => { setSelectedLeadId(lead.id); setShowSidebar(false); }}
                className={`w-full text-left p-4 border-b border-brand-border flex items-start gap-3 transition-colors ${selectedLeadId === lead.id ? 'bg-white border-l-4 border-l-black shadow-sm' : 'hover:bg-zinc-50 border-l-4 border-l-transparent'}`}
              >
                <div className="mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${lead.isApproved ? 'bg-black' : lead.emailSubject ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-brand-muted truncate">{lead.companyName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-brand-border rounded-2xl bg-white p-4 sm:p-8 relative min-w-0">
          {selectedLead ? (
            <div className="max-w-2xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black shrink-0">
                    {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-black truncate">{selectedLead.firstName} {selectedLead.lastName}</h2>
                    <p className="text-brand-muted text-sm truncate">{selectedLead.jobTitle} · {selectedLead.companyName}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200">AI</span>
                  {selectedLead.isApproved ? (
                    <span className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold border border-black flex items-center gap-1">
                      <Check className="w-3 h-3" /> Approved
                    </span>
                  ) : selectedLead.emailSubject ? (
                    <span className="bg-[#eef8ed] text-[#2b6528] px-2 py-1 rounded text-[10px] font-bold border border-[#b2ddab]">Ready</span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-bold border border-amber-200">Processing...</span>
                  )}
                </div>
              </div>

              {selectedLead.emailSubject ? (
                <form key={`${selectedLead.id}-${selectedLead.emailSubject}`} onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Subject line</label>
                    <input type="text" name="subject" defaultValue={selectedLead.emailSubject} className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-black font-medium focus:outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Email body</label>
                    <textarea name="body" defaultValue={selectedLead.emailBody} rows={8} className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-black text-sm leading-relaxed focus:outline-none resize-none" />
                  </div>

                  {selectedLead.aiRationale && (
                    <div className="bg-[#f2edfa] border border-[#d6c4f0] rounded-xl p-4 flex gap-2">
                      <div className="text-[#5b32a8] font-medium text-sm w-full">
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          AI Rationale
                        </div>
                        <span className="text-[#6d41c4] italic block mt-1 opacity-90 text-xs">{selectedLead.aiRationale}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                    <button type="submit" disabled={loading === 'save'} className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-xs flex items-center gap-2">
                      {loading === 'save' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Edits
                    </button>
                    <button type="button" onClick={() => setModal({ type: 'regenerate' })} disabled={!!loading} className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-xs flex items-center gap-2">
                      {loading === 'regenerate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />} Regenerate
                    </button>
                    <button type="button" onClick={() => setModal({ type: 'test' })} disabled={!!loading} className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-xs flex items-center gap-2">
                      {loading === 'test' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send test
                    </button>
                    <div className="flex-1 text-right">
                      <button 
                        type="button" 
                        onClick={handleApprove}
                        disabled={!!loading || selectedLead.isApproved}
                        className={`px-6 py-2 rounded-lg font-bold transition-colors shadow-sm text-xs flex items-center gap-2 ml-auto ${selectedLead.isApproved ? 'bg-zinc-100 text-zinc-400' : 'bg-black text-white hover:bg-zinc-800'}`}
                      >
                        {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} {selectedLead.isApproved ? 'Approved' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-brand-border rounded-2xl bg-brand-surface p-6 text-center">
                  <p className="text-brand-muted mb-4 text-sm font-medium">AI is drafting this email...</p>
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-brand-muted text-sm font-medium">Select a lead from the list to review.</div>
          )}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-auto lg:relative h-auto min-h-[64px] bg-white border-t border-brand-border flex flex-col sm:flex-row items-center justify-center gap-4 py-4 sm:py-0 px-4 z-20">
        <Link href={`/campaigns/${campaign.id}/launch`} className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-2 text-sm shadow-sm">
          Launch Campaign <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-brand-muted text-xs font-medium">{leads.filter(l => l.isApproved).length} approved · {leads.length - leads.filter(l => l.isApproved).length} pending</span>
      </div>

      {/* Modal Backdrop */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-brand-border animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  {modal.type === 'regenerate' ? 'Regenerate with AI' : 'Send Test Email'}
                </h3>
                <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-black transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {modal.type === 'regenerate' ? (
                  <>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      Tell the AI how to improve this draft. You can ask for tone changes, different length, or to focus on specific points.
                    </p>
                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border">
                      <p className="text-[10px] font-bold text-brand-muted uppercase mb-1.5">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {['Make it shorter', 'Be more professional', 'More aggressive CTA', 'Add more empathy'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => handleRegenerate(s)}
                            className="bg-white border border-brand-border hover:border-black text-[10px] font-medium px-2 py-1 rounded transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea 
                      autoFocus
                      placeholder="e.g. Focus more on the automation aspect..."
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black min-h-[100px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleRegenerate(e.currentTarget.value);
                        }
                      }}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-sm text-brand-muted">
                      Where should we send this test email?
                    </p>
                    <input 
                      type="email"
                      autoFocus
                      placeholder="your-email@example.com"
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendTest(e.currentTarget.value);
                        }
                      }}
                    />
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setModal(null)}
                  className="flex-1 bg-white border border-brand-border hover:bg-zinc-50 text-black py-2.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={(e) => {
                    const parent = e.currentTarget.parentElement?.previousElementSibling;
                    const input = parent?.querySelector('textarea, input') as HTMLTextAreaElement | HTMLInputElement;
                    if (modal.type === 'regenerate') handleRegenerate(input.value);
                    else handleSendTest(input.value);
                  }}
                  className="flex-1 bg-black hover:bg-zinc-800 text-white py-2.5 rounded-xl font-bold transition-colors text-sm"
                >
                  {modal.type === 'regenerate' ? 'Generate' : 'Send Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
