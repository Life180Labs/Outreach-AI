"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, Check, AlertCircle, Play, ShieldCheck, Search, Sparkles, Save, FileText, Target, Info, Layers, UserCircle, Briefcase, HelpCircle, Layout } from "lucide-react";
import { runEvaluationAction, saveStructuredPromptAction, getInitialDataAction, refineStructuredPromptAction, saveAsNewStrategyAction } from "./actions";

export default function AiEvalPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saved, setSaved] = useState(false);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [showSaveNameModal, setShowSaveNameModal] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");
  
  const [result, setResult] = useState<{ score: number; feedback: string; draft: string; subject?: string; rationale?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'structured' | 'preview'>('structured');

  const [form, setForm] = useState({
    role: "Elite B2B sales copywriter specializing in highly technical GTM cold outreach.",
    product: "Life180: Advanced AI-driven outreach automation.",
    persona: "VP of Sales, Growth Lead, or Founder.",
    painPoint: "Low reply rates and time-consuming manual research.",
    socialProof: "Helped 50+ SaaS companies double their pipeline.",
    tone: "Peer-to-peer, conversational, and direct.",
    cta: "Is this on your radar for Q3?",
    testNotes: "Anirban is the founder of Life180. He is looking for ways to scale his outreach without losing the human touch. He recently posted about the importance of personalized hooks on LinkedIn."
  });

  useEffect(() => {
    async function load() {
      const data = await getInitialDataAction();
      setStrategies(data.strategies || []);
      if (data.structured) {
        setForm(prev => ({
          ...prev,
          role: data.structured.role || prev.role,
          product: data.structured.product || prev.product,
          persona: data.structured.persona || prev.persona,
          painPoint: data.structured.painPoint || prev.painPoint,
          socialProof: data.structured.socialProof || prev.socialProof,
          tone: data.structured.tone || prev.tone,
          cta: data.structured.cta || prev.cta,
        }));
      }
    }
    load();
  }, []);

  const handleSaveNewStrategy = async () => {
    if (!newStrategyName.trim()) return;
    setSaving(true);
    const res = await saveAsNewStrategyAction(newStrategyName, form);
    if (res.success && res.data) {
      setStrategies([(res as any).data, ...strategies]);
      setActiveStrategyId((res as any).data.id);
      setShowSaveNameModal(false);
      setNewStrategyName("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Error: " + (res as any).error);
    }
    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const builtPrompt = `Role: ${form.role}

Context:
- Product/Service: ${form.product}
- Target Persona: ${form.persona}
- Core Pain Point: ${form.painPoint}
- Social Proof: ${form.socialProof}

Constraints & Guidelines:
- Tone: ${form.tone}
- CTA: ${form.cta}
- Length: Max 120 words.
- Opening: Start with a specific hook from notes. No "I hope you're well".
- Style: Direct, conversational, zero marketing fluff.
- Spam Avoidance: No sales trigger words (free, guarantee).

Output Format:
- Subject Line Options (3 options)
- Email Body`;

  const handleTest = async () => {
    setLoading(true);
    const res = await runEvaluationAction(builtPrompt, form.testNotes);
    if (res.success && res.data) {
      setResult(res.data as any);
    } else {
      alert("Error: " + (res as any).error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveStructuredPromptAction(form);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleRefine = async () => {
    if (!result?.feedback) return;
    setRefining(true);
    const res = await refineStructuredPromptAction(form, result.feedback);
    if (res.success && res.data) {
      setForm(prev => ({
        ...prev,
        ...res.data
      }));
      // Clear results so user can test the new prompt
      setResult(null);
    } else {
      alert("Refinement failed: " + (res as any).error);
    }
    setRefining(false);
  };

  return (
    <div className="w-full space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            Prompt Engineering Studio
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Configure your structured GTM strategy and audit performance end-to-end.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "STRATEGY SAVED" : "SAVE TO ALL CAMPAIGNS"}
        </button>
      </div>

      {/* Strategy Library */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-white p-2 rounded-lg border border-zinc-200">
            <Layout className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Strategy</p>
            <select 
              value={activeStrategyId || ""}
              onChange={(e) => {
                const id = e.target.value;
                setActiveStrategyId(id);
                if (id) {
                  const s = strategies.find(x => x.id === id);
                  if (s) {
                    setForm({
                      role: s.role || "",
                      product: s.product || "",
                      persona: s.persona || "",
                      painPoint: s.painPoint || "",
                      socialProof: s.socialProof || "",
                      tone: s.tone || "",
                      cta: s.cta || "",
                      testNotes: form.testNotes
                    });
                  }
                }
              }}
              className="bg-transparent border-none text-sm font-semibold text-black focus:outline-none p-0 w-full"
            >
              <option value="">Default (Global Settings)</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSaveNameModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-[11px] font-bold hover:text-black hover:border-zinc-400 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            SAVE AS NEW STRATEGY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Input Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-zinc-100">
              <button 
                onClick={() => setActiveTab('structured')}
                className={`flex-1 px-4 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'structured' ? 'bg-zinc-50 text-black border-b-2 border-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Structure
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`flex-1 px-4 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-zinc-50 text-black border-b-2 border-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Preview Prompt
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'structured' ? (
                <div className="space-y-6">
                  {/* ROLE */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-zinc-400" />
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Persona Role</label>
                    </div>
                    <textarea 
                      value={form.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className="w-full h-20 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none"
                    />
                  </div>

                  {/* CONTEXT */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-zinc-400" />
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-black">Campaign Context</label>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Product/Service</p>
                        <input 
                          value={form.product}
                          onChange={(e) => handleChange('product', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Target Persona</p>
                        <input 
                          value={form.persona}
                          onChange={(e) => handleChange('persona', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Core Pain Point</p>
                        <input 
                          value={form.painPoint}
                          onChange={(e) => handleChange('painPoint', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Social Proof</p>
                        <input 
                          value={form.socialProof}
                          onChange={(e) => handleChange('socialProof', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONSTRAINTS */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-zinc-400" />
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-black">Guidelines</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Tone</p>
                        <input 
                          value={form.tone}
                          onChange={(e) => handleChange('tone', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 ml-1">Desired CTA</p>
                        <input 
                          value={form.cta}
                          onChange={(e) => handleChange('cta', e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Computed System Prompt</p>
                  <div className="bg-zinc-900 text-emerald-400 p-6 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-zinc-800 shadow-inner overflow-y-auto max-h-[500px]">
                    {builtPrompt}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Harness */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Test Simulation (Lead Data)</label>
              <div className="flex gap-2">
                 <button className="text-[9px] font-bold text-zinc-400 hover:text-black border border-zinc-200 px-2 py-1 rounded">MOCK CSV</button>
                 <button className="text-[9px] font-bold text-zinc-400 hover:text-black border border-zinc-200 px-2 py-1 rounded">SHEET INPUT</button>
              </div>
            </div>
            <textarea 
              value={form.testNotes}
              onChange={(e) => handleChange('testNotes', e.target.value)}
              placeholder="Paste sample notes from your sheet here..."
              className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:border-black transition-all outline-none"
            />
            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 fill-white text-white" />}
              RUN END-TO-END AUDIT
            </button>
          </div>
        </div>

        {/* Results Harness */}
        <div className="space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Score Dashboard */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Quality</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-emerald-600">{result.score}%</span>
                      <span className="text-[10px] text-zinc-400 mb-1 font-bold">SCORE</span>
                    </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm col-span-2 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">AI Auditor Feedback</p>
                      <p className="text-xs text-zinc-600 line-clamp-2">{result.feedback}</p>
                    </div>
                    <button
                      onClick={handleRefine}
                      disabled={refining}
                      className="shrink-0 flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all disabled:opacity-50"
                    >
                      {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      SMART FIX
                    </button>
                  </div>
               </div>

               {/* Inbox Simulation */}
               <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Layout className="w-4 h-4 text-zinc-400" />
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inbox Delivery Preview</p>
                    </div>
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden max-w-[600px] mx-auto antialiased" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                      <div className="bg-zinc-50/50 px-8 py-4 border-b border-zinc-100">
                         <p className="text-[11px] text-zinc-400 font-medium">Subject: <span className="text-zinc-900 font-bold ml-1">{result.subject || 're: inquiry'}</span></p>
                      </div>
                      <div className="p-10">
                        <div className="text-[15px] text-[#1f2937] leading-[1.6] whitespace-pre-wrap">
                          {result.draft}
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-zinc-100">
                           <p className="text-[15px] text-[#374151] mb-5">Best regards,<br/><strong>The Life180 Team</strong></p>
                           <div className="flex gap-3">
                              <div className="w-[3px] h-10 bg-black rounded-sm" />
                              <div>
                                <p className="text-[15px] font-bold text-zinc-900 leading-tight">GTM Team</p>
                                <p className="text-[13px] font-medium text-zinc-500">Life180 Labs</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Rationale */}
               <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Strategy Rationale</p>
                    <p className="text-xs text-emerald-900/70 italic mt-0.5">{result.rationale}</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] border-2 border-dashed border-zinc-200 bg-white rounded-3xl flex flex-col items-center justify-center text-zinc-300 gap-6">
               <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center animate-pulse">
                  <Search className="w-10 h-10 opacity-10" />
               </div>
               <div className="text-center space-y-2">
                  <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Auditor Standby</p>
                  <p className="text-xs text-zinc-300 max-w-[240px] mx-auto leading-relaxed">Configure your GTM strategy on the left and run the audit to see the high-conversion draft results.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Strategy Modal */}
      {showSaveNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Save as New Strategy
              </h3>
              <p className="text-zinc-500 text-sm mt-1">Give this strategy a name to identify it across all campaigns.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Strategy Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="e.g. Q3 Tech Sales Strategy"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNewStrategy()}
                />
              </div>
            </div>
            <div className="p-6 bg-zinc-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowSaveNameModal(false)}
                className="px-4 py-2 text-zinc-500 hover:text-black text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNewStrategy}
                disabled={saving || !newStrategyName.trim()}
                className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Strategy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
