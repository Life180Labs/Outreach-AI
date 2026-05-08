"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getLeadsAction, 
  saveDraftAction, 
  approveLeadAction, 
  regenerateDraftAction, 
  sendTestAction 
} from "./actions";
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Check, 
  Send, 
  RefreshCcw, 
  Save, 
  X,
  Mail,
  User,
  Zap,
  ChevronLeft,
  ChevronRight,
  Inbox
} from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/types";

export function ReviewClient({ campaign, initialLeads }: { campaign: any, initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id);
  const [loading, setLoading] = useState<string | null>(null);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
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

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading("save");
    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const result = await saveDraftAction(selectedLead.id, subject, body, campaign.id);
    if (result.success) {
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, emailSubject: subject, emailBody: body } : l));
      showStatus('success', 'Draft saved');
    } else {
      showStatus('error', result.error || 'Failed to save');
    }
    setLoading(null);
  };

  const handleApprove = async () => {
    if (!selectedLead) return;
    setLoading("approve");
    const result = await approveLeadAction(selectedLead.id, campaign.id);
    if (result.success) {
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, isApproved: true } : l));
      showStatus('success', 'Lead approved');
      
      // Auto-select next lead
      const currentIndex = leads.findIndex(l => l.id === selectedLeadId);
      if (currentIndex < leads.length - 1) {
        setSelectedLeadId(leads[currentIndex + 1].id);
      }
    } else {
      showStatus('error', result.error || 'Failed to approve');
    }
    setLoading(null);
  };

  const handleRegenerate = async () => {
    if (!selectedLead || !regenFeedback.trim()) return;
    setLoading("regenerate");
    const result = await regenerateDraftAction(selectedLead.id, campaign.id, regenFeedback);
    if (result.success) {
      setLeads(leads.map(l => l.id === result.data.id ? result.data : l));
      setRegenFeedback("");
      setShowRegenInput(false);
      showStatus('success', 'Draft regenerated');
    } else {
      showStatus('error', result.error || 'Failed to regenerate');
    }
    setLoading(null);
  };

  const handleSendTest = async () => {
    if (!selectedLead || !testEmail.trim()) return;
    setLoading("test");
    const result = await sendTestAction(selectedLead.id, testEmail);
    if (result.success) {
      showStatus('success', 'Test email sent');
      setShowTestInput(false);
      setTestEmail("");
    } else {
      showStatus('error', result.error || 'Failed to send test');
    }
    setLoading(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast */}
      {statusMessage && (
        <div className={`fixed top-24 right-8 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`} role="alert">
          {statusMessage.text}
        </div>
      )}

    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Campaign</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-[10px] font-bold text-black uppercase tracking-widest">Review Workspace</span>
          </div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">{campaign.name || 'Review Drafts'}</h1>
          <p className="text-zinc-400 text-sm">{leads.length} leads in sequence</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/campaigns/${campaign.id}/launch`} 
            className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm"
          >
            Continue to Launch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[740px]">
        
        {/* Left: Queue (4/12) */}
        <div className="flex-1 lg:w-[33.33%] flex flex-col h-[700px] rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Sequence Queue</h2>
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              {draftedLeadsCount}/{leads.length} Drafted
            </span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {leads.map((lead, idx) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full text-left p-4 border-b border-zinc-50 flex items-center gap-4 transition-colors ${
                  selectedLeadId === lead.id ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'
                }`}
              >
                <div className="text-[10px] font-medium text-zinc-300 w-4">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${selectedLeadId === lead.id ? 'text-black' : 'text-zinc-600'}`}>
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{lead.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.isApproved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : lead.emailSubject ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-200" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Workspace (8/12) */}
        <div className="flex-1 lg:w-[66.66%] flex flex-col h-[700px] rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          {selectedLead ? (
            <>
              {/* Workspace Header */}
              <div className="px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-500">
                    {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-black">{selectedLead.firstName} {selectedLead.lastName}</h3>
                    <p className="text-xs text-zinc-400">{selectedLead.jobTitle} at {selectedLead.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowTestInput(!showTestInput)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
                    title="Send test email"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Test</span>
                  </button>
                  <button 
                    onClick={() => setShowRegenInput(!showRegenInput)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
                    title="Regenerate draft"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span className="text-xs font-medium">Regenerate</span>
                  </button>
                  <div className="w-px h-4 bg-zinc-100 mx-1" />
                  <button
                    onClick={handleApprove}
                    disabled={loading === 'approve' || selectedLead.isApproved}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                      selectedLead.isApproved 
                        ? 'bg-zinc-100 text-zinc-400 cursor-default' 
                        : 'bg-black text-white hover:bg-zinc-800'
                    }`}
                  >
                    {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {selectedLead.isApproved ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>

              {/* Inline Inputs */}
              {(showRegenInput || showTestInput) && (
                <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                  {showRegenInput ? (
                    <>
                      <input 
                        type="text"
                        value={regenFeedback}
                        onChange={(e) => setRegenFeedback(e.target.value)}
                        placeholder="Feedback for AI (e.g. 'Make it shorter')"
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                      />
                      <button onClick={handleRegenerate} disabled={loading === 'regenerate'} className="px-3 py-1.5 bg-black text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50">
                        Regenerate
                      </button>
                    </>
                  ) : (
                    <>
                      <input 
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Send test email to..."
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                      />
                      <button onClick={handleSendTest} disabled={loading === 'test'} className="px-3 py-1.5 bg-black text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50">
                        Send Test
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowRegenInput(false); setShowTestInput(false); }} className="text-zinc-400 hover:text-black p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Editor Surface */}
              <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
                {!selectedLead.emailSubject ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium">AI Drafting in progress...</p>
                  </div>
                ) : (
                  <form key={selectedLead.id} onSubmit={handleSave} className="h-full flex flex-col gap-6">
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block">Subject</label>
                        <input 
                          type="text" 
                          name="subject" 
                          defaultValue={selectedLead.emailSubject || ''} 
                          className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-sm text-black font-medium focus:outline-none focus:border-zinc-400 transition-colors"
                        />
                      </div>
                      <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block">Message</label>
                        <textarea 
                          name="body" 
                          defaultValue={selectedLead.emailBody || ''} 
                          className="flex-1 w-full bg-white border border-zinc-200 rounded-xl px-4 py-4 text-sm text-zinc-700 leading-relaxed focus:outline-none focus:border-zinc-400 transition-colors resize-none"
                          style={{ minHeight: '350px' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 shrink-0">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <p className="text-[10px] font-medium uppercase tracking-tight truncate max-w-[400px]">
                          {selectedLead.aiRationale || 'Drafted by Outreach AI'}
                        </p>
                      </div>
                      <button 
                        type="submit" 
                        disabled={loading === 'save'} 
                        className="px-5 py-2.5 bg-zinc-100 hover:bg-black hover:text-white text-zinc-600 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                      >
                        {loading === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Select a lead to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
