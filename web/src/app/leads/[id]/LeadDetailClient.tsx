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
  ChevronLeft,
  Calendar,
  MessageCircle,
  Zap
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
      {/* 1. Navigation & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/leads" className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-500 hover:text-black transition-all shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          <Link href="/leads" className="hover:text-black transition-colors">Leads</Link>
          <span className="text-zinc-200">/</span>
          <span className="text-zinc-600">Conversation Detail</span>
        </div>
      </div>

      {/* 2. Focused Lead Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[24px] bg-white border border-zinc-200 flex items-center justify-center text-xl font-black text-black shadow-sm ring-4 ring-zinc-50">
            {lead.firstName[0]}{lead.lastName?.[0] || ''}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-black text-black tracking-tight">{lead.firstName} {lead.lastName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border tracking-wider uppercase ${
                lead.status === 'Hot' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
              }`}>
                {lead.status} lead
              </span>
            </div>
            <p className="text-sm text-zinc-500 font-bold">
              {lead.jobTitle} <span className="text-zinc-300 mx-2">·</span> {lead.companyName} <span className="text-zinc-300 mx-2">·</span> <span className="font-medium">{lead.city || 'Global'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => handleStatusChange(lead.isPaused ? 'resume' : 'pause')}
            disabled={loading}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all shadow-sm active:scale-95 ${
              lead.isPaused 
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-black'
            }`}
          >
            {lead.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {lead.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={async () => {
              setLoading(true);
              const res = await syncLeadInboxAction(lead.id);
              if (res.success) window.location.reload();
              setLoading(false);
            }}
            disabled={loading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:bg-zinc-200"
          >
            <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Inbox
          </button>
          <button className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-black transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Main Communication Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left: Enhanced Thread */}
        <div className="lg:col-span-9 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Message History</p>
             <div className="h-[1px] flex-1 bg-zinc-100 mx-4" />
          </div>
          
          <div 
            ref={threadScrollRef}
            className="flex-1 overflow-y-auto space-y-8 pr-6 custom-scrollbar pb-10"
          >
            {/* Initial Outreach Card */}
            {!lead.messages.some((m: any) => m.role === 'USER') && lead.sent && (
              <div className="group relative">
                <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-zinc-100 group-hover:bg-zinc-200 transition-colors" />
                <div className="bg-zinc-50 border border-zinc-200/60 rounded-[32px] p-8 max-w-[90%] ml-auto shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white fill-white" />
                      </div>
                      <span className="text-[11px] font-black text-black uppercase tracking-widest">Initial Outreach</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">May 6 · 9:14am</span>
                  </div>
                  <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium italic">
                    {lead.emailBody}
                  </div>
                </div>
              </div>
            )}

            {lead.messages.map((msg: any) => (
              <div key={msg.id} className="group relative">
                <div className={`absolute top-0 bottom-0 w-[2px] bg-zinc-100 transition-colors ${
                  msg.role === 'LEAD' ? '-right-3 group-hover:bg-emerald-200' : '-left-3 group-hover:bg-zinc-300'
                }`} />
                <div className={`rounded-[32px] p-8 max-w-[90%] shadow-sm transition-all border ${
                  msg.role === 'LEAD' 
                    ? 'bg-white border-zinc-200 hover:border-emerald-200' 
                    : 'bg-zinc-50 border-zinc-200 ml-auto'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-black uppercase tracking-widest">
                      {msg.role === 'LEAD' ? `${lead.firstName} ${lead.lastName}` : 'System Outreach'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Status Bar */}
          <div className="flex items-center gap-8 py-4 border-t border-zinc-100 mt-auto px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sequence Start</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Engagement Detected</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-40">
              <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Follow-up Paused</span>
            </div>
          </div>
        </div>

        {/* Right: Unified Smart Editor */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-hidden">
          <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-xl shadow-zinc-200/20 flex flex-col flex-1 min-h-0 border-t-4 border-t-black">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-black text-black uppercase tracking-widest">Draft Response</h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1 tracking-tighter">Direct Email Reply</p>
              </div>
              <div className="flex bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                <button 
                  onClick={() => setReplyMode('ai')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${replyMode === 'ai' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  AI
                </button>
                <button 
                  onClick={() => setReplyMode('manual')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${replyMode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Manual
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-5 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex-1 bg-zinc-50/50 border border-zinc-100 rounded-[24px] p-5 min-h-[200px] flex flex-col focus-within:bg-white focus-within:border-black transition-all">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center animate-bounce shadow-xl shadow-black/20">
                       <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Crafting Intelligence...</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Analyzing context & sentiment</p>
                    </div>
                  </div>
                ) : replyText ? (
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your strategic response..."
                    className="w-full h-full bg-transparent resize-none text-sm text-zinc-800 font-medium leading-relaxed focus:outline-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-zinc-300" />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-4 leading-relaxed">
                      {replyMode === 'ai' 
                        ? "Click below to draft an AI optimized response" 
                        : "Ready for your manual input"}
                    </p>
                    {replyMode === 'ai' && (
                      <button 
                        onClick={handleGenerateAI}
                        className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Generate Intelligence
                      </button>
                    )}
                  </div>
                )}
              </div>

              {replyMode === 'ai' && aiRationale && (
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-[24px] p-5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                    AI Strategy Logic
                  </div>
                  <p className="text-emerald-900/70 text-[11px] leading-relaxed italic font-medium">
                    {aiRationale}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={handleSendReply}
                disabled={loading || !replyText.trim()}
                className="w-full bg-black hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl shadow-black/20 active:scale-95"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send response
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 text-zinc-500 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors">
                <Calendar className="w-4 h-4" />
                Attach Calendar
              </button>
            </div>
          </div>

          {/* Quick Decision Actions */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-6">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">Pipeline Stage</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleStatusChange('Hot')}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  lead.status === 'Hot' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                }`}
              >
                Interested
              </button>
              <button 
                onClick={() => handleStatusChange('Closed')}
                className="bg-white border border-zinc-200 hover:border-black text-zinc-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Mark Won
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
