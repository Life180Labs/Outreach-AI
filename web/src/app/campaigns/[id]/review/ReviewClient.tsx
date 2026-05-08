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
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Check, 
  Send, 
  RefreshCcw, 
  Save, 
  X,
  ChevronRight,
  Zap,
  Mail,
  User,
  ExternalLink
} from "lucide-react";
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
    <div className="flex flex-col h-[calc(100vh-120px)] relative gap-6">
      {/* 1. Dynamic Status Header */}
      <div className="px-1 shrink-0">
        <div className="bg-white border border-zinc-200 rounded-[28px] p-2 pr-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-zinc-200/20">
          <div className="flex items-center gap-2 pl-4">
            <div className={`w-2.5 h-2.5 rounded-full ${needReviewCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]`}></div>
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">
              {draftedLeadsCount} Drafted <span className="text-zinc-300 mx-1">·</span> {needReviewCount} Processing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden text-black text-[10px] font-black uppercase tracking-widest bg-zinc-100 px-4 py-2 rounded-xl transition-all">
              {showSidebar ? 'Hide Queue' : 'Open Queue'}
            </button>
            <div className="h-4 w-[1px] bg-zinc-200 hidden sm:block" />
            <Link href={`/campaigns/${campaign.id}/launch`} className="bg-black text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2">
              Launch Sequence <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Review Workspace */}
      <div className="flex flex-1 overflow-hidden gap-8 px-1">
        {/* Left: Lead Queue Sidebar */}
        <div className={`${showSidebar ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:relative lg:flex lg:w-80 flex-col bg-white border border-zinc-200 rounded-[32px] shrink-0 overflow-hidden shadow-sm`}>
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <p className="text-black text-[11px] font-black uppercase tracking-widest">{leads.length} Review Queue</p>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 bg-white rounded-xl border border-zinc-200">
               <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {leads.map(lead => (
              <button 
                key={lead.id}
                onClick={() => { setSelectedLeadId(lead.id); setShowSidebar(false); }}
                className={`w-full text-left p-5 border-b border-zinc-50 flex items-start gap-4 transition-all group ${selectedLeadId === lead.id ? 'bg-zinc-50 ring-2 ring-inset ring-black/5' : 'hover:bg-zinc-50/50'}`}
              >
                <div className="mt-1 relative">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${lead.isApproved ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.3)]' : lead.emailSubject ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  {selectedLeadId === lead.id && <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-black rounded-r-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black transition-colors ${selectedLeadId === lead.id ? 'text-black' : 'text-zinc-600 group-hover:text-black'}`}>{lead.firstName} {lead.lastName}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-1 truncate">{lead.companyName}</p>
                </div>
                {lead.isApproved && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Focused Draft Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-zinc-200 rounded-[32px] shadow-sm overflow-hidden relative">
          {selectedLead ? (
            <div className="flex flex-col h-full">
              {/* Draft Header */}
              <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center font-black text-black text-lg shadow-sm">
                      {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-black tracking-tight">{selectedLead.firstName} {selectedLead.lastName}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          selectedLead.isApproved ? 'bg-black text-white border-black' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {selectedLead.isApproved ? 'Approved' : 'Awaiting Review'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-bold mt-1.5">{selectedLead.jobTitle} <span className="text-zinc-300 mx-2">·</span> {selectedLead.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setModal({ type: 'test' })} 
                      disabled={!!loading} 
                      className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
                      title="Send Test Email"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setModal({ type: 'regenerate' })} 
                      disabled={!!loading} 
                      className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
                      title="Regenerate Draft"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-6 bg-zinc-200 mx-1" />
                    <button 
                      onClick={handleApprove}
                      disabled={!!loading || selectedLead.isApproved}
                      className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                        selectedLead.isApproved 
                          ? 'bg-zinc-100 text-zinc-400 border border-zinc-100' 
                          : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'
                      }`}
                    >
                      {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve Draft'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Draft Editor Surface */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {selectedLead.emailSubject ? (
                  <form key={`${selectedLead.id}-${selectedLead.emailSubject}`} onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                       {/* Editor Columns */}
                       <div className="md:col-span-8 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Subject Strategy</label>
                            <div className="relative group">
                               <input type="text" name="subject" defaultValue={selectedLead.emailSubject} className="w-full bg-zinc-50 border border-zinc-100 group-hover:border-zinc-300 focus:border-black focus:bg-white transition-all rounded-[20px] px-6 py-4 text-black font-black text-sm outline-none shadow-inner" />
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <EditIcon className="w-4 h-4 text-zinc-300" />
                               </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Body Content</label>
                            <textarea name="body" defaultValue={selectedLead.emailBody} rows={12} className="w-full bg-zinc-50 border border-zinc-100 focus:border-black focus:bg-white transition-all rounded-[28px] px-8 py-6 text-zinc-700 text-sm font-medium leading-relaxed outline-none shadow-inner resize-none" />
                          </div>
                          
                          <div className="flex items-center justify-between pt-4">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase italic">* Auto-saved to cloud draft store</p>
                            <button type="submit" disabled={loading === 'save'} className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-black hover:text-white text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                              {loading === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Update Draft
                            </button>
                          </div>
                       </div>

                       {/* Sidebar Context */}
                       <div className="md:col-span-4 space-y-6">
                          {selectedLead.aiRationale && (
                            <div className="bg-[#fcfaff] border border-[#f3ebff] rounded-[28px] p-6 shadow-sm">
                              <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-[#6d41c4] uppercase tracking-widest">
                                <Zap className="w-4 h-4 fill-[#6d41c4]" />
                                Intelligence Logic
                              </div>
                              <p className="text-[#6d41c4]/80 text-[11px] font-medium leading-relaxed italic border-l-2 border-[#d6c4f0] pl-4 py-1">
                                {selectedLead.aiRationale}
                              </p>
                            </div>
                          )}
                          
                          <div className="bg-zinc-50 border border-zinc-100 rounded-[28px] p-6">
                             <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                <User className="w-4 h-4" />
                                Lead Persona
                             </div>
                             <div className="space-y-4">
                                <div className="p-3 bg-white rounded-2xl border border-zinc-200/50">
                                   <p className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter mb-1">Status</p>
                                   <p className="text-xs font-black text-black">Warm (Opened)</p>
                                </div>
                                <div className="p-3 bg-white rounded-2xl border border-zinc-200/50">
                                   <p className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter mb-1">Recent Activity</p>
                                   <p className="text-xs font-black text-black">Opened Outreach 2h ago</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-[28px] flex items-center justify-center border border-zinc-100 shadow-sm">
                      <Loader2 className="w-8 h-8 animate-spin text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black uppercase tracking-widest">AI Drafting in Progress</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-2">Please hold while we synthesize your strategy...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40">
              <Sparkles className="w-12 h-12 text-zinc-200" />
              <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">Select a lead to begin review</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Global Modals */}
      {modal && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-black tracking-tight">
                    {modal.type === 'regenerate' ? 'Redirect Intelligence' : 'Send Test Execution'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Provide final instructions before processing</p>
                </div>
                <button onClick={() => setModal(null)} className="p-2 bg-zinc-50 text-zinc-400 hover:text-black rounded-full border border-zinc-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {modal.type === 'regenerate' ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Suggested Adjustments</p>
                      <div className="flex flex-wrap gap-2">
                        {['Make it shorter', 'Be more professional', 'More aggressive CTA', 'Increase empathy'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => handleRegenerate(s)}
                            className="bg-white border border-emerald-200 hover:border-black text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Custom Feedback</label>
                       <textarea 
                          autoFocus
                          placeholder="e.g. Focus more on our recent case study..."
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-[20px] px-6 py-4 text-sm font-medium text-black focus:border-black focus:bg-white outline-none min-h-[120px] transition-all"
                       />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Destination Email</label>
                    <input 
                      type="email"
                      autoFocus
                      placeholder="e.g. founder@company.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-medium text-black focus:border-black focus:bg-white outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setModal(null)}
                  className="flex-1 px-6 py-4 bg-white text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-200 hover:border-black transition-all"
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
                  className="flex-1 px-6 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-95"
                >
                  {modal.type === 'regenerate' ? 'Regenerate Now' : 'Send Test Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}
