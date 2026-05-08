"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Clock,
  Pause,
  Play,
  ChevronDown,
  MessageCircle,
  RefreshCcw,
  Loader2,
  Zap,
  Mail,
  Building,
  MapPin,
} from "lucide-react";
import {
  updateLeadStatusAction,
  sendReplyAction,
  generateAIReplyAction,
  syncLeadInboxAction,
} from "./actions";
import type { LeadWithMessages } from "@/types";

export function LeadDetailClient({ lead: initialLead }: { lead: LeadWithMessages }) {
  const [lead, setLead] = useState(initialLead);
  const [replyText, setReplyText] = useState("");
  const [aiRationale, setAiRationale] = useState("");
  const [regenComment, setRegenComment] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [lead.messages]);

  const showStatus = useCallback((type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const handleGenerateAI = async (feedback?: string) => {
    setGenerating(true);
    setShowRegenInput(false);
    setRegenComment("");
    const result = await generateAIReplyAction(lead.id, feedback);
    if (result.success) {
      setReplyText(result.data.draft);
      setAiRationale(result.data.rationale);
    } else {
      showStatus("error", result.error);
    }
    setGenerating(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    const result = await sendReplyAction(lead.id, replyText);
    if (result.success) {
      setLead(result.data);
      setReplyText("");
      setAiRationale("");
      showStatus("success", "Reply sent");
    } else {
      showStatus("error", result.error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const result = await updateLeadStatusAction(lead.id, newStatus);
    if (result.success) setLead(result.data);
    else showStatus("error", result.error);
  };

  const handleSync = async () => {
    setLoading(true);
    const result = await syncLeadInboxAction(lead.id);
    if (result.success) {
      if (result.data.newMessages > 0) {
        showStatus("success", `${result.data.newMessages} new message(s) synced`);
        window.location.reload();
      } else {
        showStatus("success", "No new messages");
      }
    } else {
      showStatus("error", result.error);
    }
    setLoading(false);
  };

  // Only show the relevant email thread — initial outreach + direct messages
  const relevantMessages = lead.messages.filter(m => {
    // Keep all messages that are part of this lead's thread
    return m.leadId === lead.id;
  });

  return (
    <div className="space-y-6">
      {/* Status toast */}
      {statusMessage && (
        <div className={`fixed top-20 right-6 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${
          statusMessage.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`} role="alert">
          {statusMessage.text}
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Column: Lead Info + Thread (4/12) */}
        <div className="flex-1 lg:w-[33.33%] space-y-4">
          {/* Lead Profile Card */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-lg font-semibold text-zinc-500">
                {lead.firstName[0]}{lead.lastName?.[0] || ""}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-black truncate">{lead.firstName} {lead.lastName}</h1>
                <p className="text-xs text-zinc-400">{lead.jobTitle}</p>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow icon={Building} label={lead.companyName} />
              <InfoRow icon={Mail} label={lead.email} />
              {lead.city && <InfoRow icon={MapPin} label={`${lead.city}${lead.country ? `, ${lead.country}` : ""}`} />}
            </div>

            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-zinc-100">
              <span className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                lead.status === "Hot" ? "bg-emerald-50 text-emerald-700"
                : lead.status === "Warm" ? "bg-amber-50 text-amber-700"
                : "bg-zinc-100 text-zinc-500"
              }`}>
                {lead.status}
              </span>
              {lead.sent && <span className="px-2 py-1 rounded text-[11px] bg-blue-50 text-blue-600 font-medium">Sent</span>}
              {lead.replied && <span className="px-2 py-1 rounded text-[11px] bg-emerald-50 text-emerald-600 font-medium">Replied</span>}
              {lead.isPaused && <span className="px-2 py-1 rounded text-[11px] bg-amber-50 text-amber-600 font-medium">Paused</span>}
            </div>
          </div>

          {/* Actions Card */}
          <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-3">
            <p className="text-xs font-medium text-zinc-400 mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleStatusChange("Hot")} className={`py-2.5 rounded-lg text-xs font-medium border transition-colors ${lead.status === "Hot" ? "bg-emerald-500 text-white border-emerald-500" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>
                Mark Hot
              </button>
              <button onClick={() => handleStatusChange("Closed")} className="py-2.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors">
                Mark Won
              </button>
              <button onClick={() => handleStatusChange(lead.isPaused ? "resume" : "pause")} className="py-2.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors flex items-center justify-center gap-1.5">
                {lead.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {lead.isPaused ? "Resume" : "Pause"}
              </button>
              <button onClick={handleSync} disabled={loading} className="py-2.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Clock className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Sync Inbox
              </button>
            </div>
          </div>

          {/* AI Rationale */}
          {aiRationale && (
            <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[11px] font-medium text-blue-600">AI Strategy</p>
              </div>
              <p className="text-xs text-blue-800/80 leading-relaxed">{aiRationale}</p>
            </div>
          )}
        </div>

        {/* Right Column: Thread + Composer (8/12) */}
        <div className="flex-1 lg:w-[66.66%] flex flex-col min-h-0">

          {/* Message Thread */}
          <div className="flex-1 rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col" style={{ minHeight: "500px" }}>
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black">Conversation</h2>
              <span className="text-[11px] text-zinc-400">{relevantMessages.length + (lead.sent ? 1 : 0)} messages</span>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "thin", maxHeight: "400px" }}>
              {/* Initial Outreach */}
              {lead.sent && lead.emailBody && (
                <div className="flex justify-end">
                  <div className="bg-zinc-50 rounded-2xl rounded-tr-sm p-5 max-w-[80%] border border-zinc-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3 h-3 text-zinc-400" />
                      <span className="text-[11px] font-medium text-zinc-500">Initial Outreach</span>
                    </div>
                    {lead.emailSubject && (
                      <p className="text-xs font-semibold text-black mb-2">Subject: {lead.emailSubject}</p>
                    )}
                    <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{lead.emailBody}</div>
                  </div>
                </div>
              )}

              {/* Thread Messages */}
              {relevantMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "LEAD" ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-2xl p-5 max-w-[80%] border ${
                    msg.role === "LEAD"
                      ? "bg-white border-zinc-200 rounded-tl-sm"
                      : "bg-zinc-50 border-zinc-100 rounded-tr-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-zinc-500">
                        {msg.role === "LEAD" ? `${lead.firstName} ${lead.lastName}` : "You"}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-4">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {relevantMessages.length === 0 && !lead.sent && (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <MessageCircle className="w-8 h-8 text-zinc-200 mb-3" />
                  <p className="text-sm text-zinc-400">No messages yet</p>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-zinc-100 p-5 space-y-4">
              {/* Draft Area */}
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={5}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-black resize-none focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-400"
                  aria-label="Reply content"
                />
                {generating && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-xs font-medium text-zinc-600">Generating AI draft...</span>
                  </div>
                )}
              </div>

              {/* Regenerate with comment */}
              {showRegenInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regenComment}
                    onChange={(e) => setRegenComment(e.target.value)}
                    placeholder="e.g. Make it shorter, more casual..."
                    className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 placeholder:text-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && regenComment.trim()) handleGenerateAI(regenComment);
                    }}
                  />
                  <button
                    onClick={() => handleGenerateAI(regenComment)}
                    disabled={generating}
                    className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                  <button onClick={() => { setShowRegenInput(false); setRegenComment(""); }} className="px-3 py-2 text-zinc-400 hover:text-black text-xs">
                    Cancel
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateAI()}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium text-black transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {replyText ? "Re-draft with AI" : "Generate AI Draft"}
                </button>

                {replyText && (
                  <button
                    onClick={() => setShowRegenInput(!showRegenInput)}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-zinc-500 hover:text-black text-xs font-medium transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Regenerate with feedback
                  </button>
                )}

                <button
                  onClick={handleSendReply}
                  disabled={loading || !replyText.trim()}
                  className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      <span className="text-sm text-zinc-600 truncate">{label}</span>
    </div>
  );
}
