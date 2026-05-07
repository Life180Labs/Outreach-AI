"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  Clock, 
  MoreVertical,
  Pause,
  Play,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { updateLeadStatusAction, sendReplyAction, generateAIReplyAction, syncLeadInboxAction } from "./actions";

export function LeadDetailClient({ lead: initialLead }: { lead: any }) {
  const [lead, setLead] = useState(initialLead);
  const [replyMode, setReplyMode] = useState<'ai' | 'manual'>('ai');
  const [replyText, setReplyText] = useState("");
  const [aiRationale, setAiRationale] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const threadScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadScrollRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
    }
  }, [lead.messages]);

  useEffect(() => {
    if (lead.replied && lead.messages.length > 0 && !replyText) {
      handleGenerateAI();
    }
  }, []);

  const handleGenerateAI = async () => {
    setGenerating(true);
    setReplyMode('ai');
    try {
      const { draft, rationale } = await generateAIReplyAction(lead.id);
      setReplyText(draft);
      setAiRationale(rationale);
    } catch (e) {
      console.error("AI Generation failed", e);
    }
    setGenerating(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const updatedLead = await sendReplyAction(lead.id, replyText);
      setLead(updatedLead);
      setReplyText("");
    } catch (e: any) {
      alert("Failed to send: " + e.message);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const updated = await updateLeadStatusAction(lead.id, newStatus);
    setLead(updated);
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)] w-full pb-6 px-1 lg:px-8">
      {/* Navigation */}
      <Link href="/leads" className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors text-xs font-medium w-fit">
        <ChevronLeft className="w-4 h-4" />
        back to leads
      </Link>

      {/* Header - Matching Dashboard Style */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white border border-brand-border flex items-center justify-center font-bold text-black text-lg shadow-sm">
            {lead.firstName[0]}{lead.lastName?.[0] || ''}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-black tracking-tight">{lead.firstName} {lead.lastName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase ${
                lead.status === 'Hot' ? 'bg-[#eef8ed] text-[#2b6528] border-[#b2ddab]' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
              }`}>
                {lead.status} lead
              </span>
            </div>
            <p className="text-sm text-brand-muted font-medium">
              · {lead.companyName} · {lead.city || 'Global'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => handleStatusChange(lead.isPaused ? 'resume' : 'pause')}
            disabled={loading}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition-all shadow-sm active:scale-95 ${
              lead.isPaused 
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-black'
            }`}
          >
            {lead.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {lead.isPaused ? 'Resume Sequence' : 'Pause Sequence'}
          </button>
          <button 
            onClick={async () => {
              setLoading(true);
              const res = await syncLeadInboxAction(lead.id);
              if (res.success) window.location.reload();
              setLoading(false);
            }}
            disabled={loading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-black text-white hover:bg-zinc-800 transition-all shadow-sm active:scale-95 disabled:bg-zinc-200"
          >
            <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Inbox
          </button>
          <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left Side: Scrollable Thread */}
        <div className="lg:col-span-9 flex flex-col min-h-0 space-y-4">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-1">Conversation</p>
          <div 
            ref={threadScrollRef}
            className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-6"
          >
            {/* Initial Sent Email */}
            {!lead.messages.some((m: any) => m.role === 'USER') && lead.sent && (
              <div className="bg-[#f2f4f7] border border-zinc-200 rounded-2xl p-6 max-w-[90%] ml-auto shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-black">You (Initial Outreach)</span>
                  <span className="text-[10px] text-zinc-400 font-medium">May 6 · 9:14am</span>
                </div>
                <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {lead.emailBody}
                </div>
              </div>
            )}

            {lead.messages.map((msg: any) => (
              <div 
                key={msg.id}
                className={`rounded-2xl p-6 max-w-[90%] shadow-sm ${
                  msg.role === 'LEAD' 
                    ? 'bg-white border border-brand-border' 
                    : 'bg-[#f2f4f7] border border-zinc-200 ml-auto'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-black">
                    {msg.role === 'LEAD' ? `${lead.firstName} ${lead.lastName}` : 'You'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Mini Timeline Bar */}
          <div className="flex items-center gap-6 py-4 border-t border-zinc-100 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-brand-muted uppercase">Initial outreach</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-brand-muted uppercase">Replied</span>
            </div>
          </div>
        </div>

        {/* Right Side: Reply Section */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-hidden">
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-black">Reply</h3>
              <div className="flex bg-brand-surface p-1 rounded-lg border border-brand-border">
                <button 
                  onClick={() => setReplyMode('ai')}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${replyMode === 'ai' ? 'bg-white text-black shadow-sm' : 'text-zinc-500'}`}
                >
                  AI draft
                </button>
                <button 
                  onClick={() => setReplyMode('manual')}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${replyMode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-zinc-500'}`}
                >
                  Write manually
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl p-4 min-h-[200px] flex flex-col">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                    <p className="text-xs font-medium text-brand-muted">AI is crafting a reply...</p>
                  </div>
                ) : replyText ? (
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                    className="w-full h-full bg-transparent resize-none text-sm text-zinc-700 leading-relaxed focus:outline-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <p className="text-xs text-brand-muted px-4 leading-relaxed">
                      {replyMode === 'ai' 
                        ? "Click below to let AI draft a response based on the conversation." 
                        : "Start typing your manual response."}
                    </p>
                    {replyMode === 'ai' && (
                      <button 
                        onClick={handleGenerateAI}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate AI Draft
                      </button>
                    )}
                  </div>
                )}
              </div>

              {replyMode === 'ai' && aiRationale && (
                <div className="bg-[#f2edfa] border border-[#d6c4f0] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase font-bold text-[#5b32a8] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Why this draft?
                  </div>
                  <p className="text-[#6d41c4] text-xs italic opacity-90 leading-relaxed">
                    {aiRationale}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={handleSendReply}
                disabled={loading || !replyText.trim()}
                className="w-full bg-black hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send reply
              </button>
              <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-3 rounded-xl font-bold transition-colors text-sm shadow-sm">
                Attach booking link
              </button>
            </div>
          </div>

          {/* Status Quick Actions */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-4 px-1">Update Status</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleStatusChange('Hot')}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                  lead.status === 'Hot' ? 'bg-[#eef8ed] text-[#2b6528] border-[#b2ddab] shadow-sm' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                }`}
              >
                Hot
              </button>
              <button 
                onClick={() => handleStatusChange('Closed')}
                className="bg-white border border-zinc-200 hover:border-black text-zinc-600 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Closed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
