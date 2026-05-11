"use client";

import { useState } from "react";
import { Zap, Loader2, Check, AlertCircle, Play, ShieldCheck, Search } from "lucide-react";

export default function AiEvalPage() {
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; draft: string } | null>(null);

  const handleTest = async () => {
    setLoading(true);
    // Mocking evaluation logic for now - will connect to real AI later
    await new Promise(r => setTimeout(r, 2000));
    setResult({
      score: 85,
      feedback: "Great personalization using the notes. The CTA is clear and low-friction. Tone is appropriately professional yet conversational.",
      draft: "Hi John,\n\nI noticed you're leading growth at Acme Corp and recently spoke at the SaaS summit about scaling outreach. Your points on AI-human hybrid models really resonated with our team at Life180.\n\nWe've built something that automates the research phase while keeping the final touch 100% human. Would you be open to a 5-minute chat next Thursday to see how we could save your SDRs 10 hours a week?\n\nBest regards,\nThe Life180 Team"
    });
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-emerald-500" />
          AI Evaluation Sandbox
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Test your AI prompts and evaluate generation quality before launching campaigns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border-2 border-zinc-100 bg-zinc-50/30 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">System Strategy (Author Prompt)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Focus on our new AI features and keep the tone very casual..."
                className="w-full h-32 bg-white border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:border-black transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Lead Notes (CSV Data)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. John is the CEO of Acme. He loves fly fishing and just raised Series A..."
                className="w-full h-32 bg-white border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:border-black transition-all"
              />
            </div>
            <button
              onClick={handleTest}
              disabled={loading || !prompt || !notes}
              className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Run Evaluation
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-emerald-200 flex items-center justify-center text-lg font-bold text-emerald-700">
                    {result.score}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Quality Score</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Excellent Generation</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Check className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Verified</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">AI Feedback</p>
                <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                  {result.feedback}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Generated Draft</p>
                <div className="bg-white border border-emerald-100 rounded-xl p-4 text-sm text-zinc-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {result.draft}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-300 gap-4">
              <Search className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Run a test to see the evaluation results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
