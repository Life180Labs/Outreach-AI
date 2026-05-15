"use client";

import { useState } from "react";
import AccountManager from "./AccountManager";
import { saveSettings } from "./actions";
import { toast } from "sonner";
import { Save, Bot, Mail, Sliders, Zap, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

import type { Settings, SmtpAccountSafe } from "@/types";

interface SettingsClientProps {
  settings: Settings | null;
  accounts: SmtpAccountSafe[];
}

export default function SettingsClient({ settings, accounts }: SettingsClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({
    ai: true,
    delivery: true,
    smtp: true
  });

  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false,
    groq: false,
    claude: false
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleKey = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>, section: string) => {
    e.preventDefault();
    setLoading(section);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await saveSettings(formData);
      if (res.success) {
        toast.success(`${section} settings saved successfully`);
      } else {
        toast.error(res.error || `Failed to save ${section} settings`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Configuration</h1>
          <p className="text-zinc-500 mt-1">Manage your outreach engine, AI models, and email integrations.</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* 1. AI Integration Section */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('ai')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">AI Intelligence</h2>
                <p className="text-xs text-zinc-500">Configure your LLM providers and primary engine</p>
              </div>
            </div>
            {expanded.ai ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>

          {expanded.ai && (
            <form onSubmit={(e) => handleSave(e, "AI")} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Primary AI Provider</label>
                  <select
                    name="aiProvider"
                    defaultValue={settings?.aiProvider || "gemini"}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="groq">Groq (Llama 3)</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>

                {/* Gemini */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Gemini API Key</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                      type={showKeys.gemini ? "text" : "password"}
                      name="geminiApiKey"
                      defaultValue={settings?.geminiApiKey || ""}
                      placeholder="AI Studio Key..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('gemini')}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                    >
                      {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* OpenAI */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">OpenAI API Key</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                      type={showKeys.openai ? "text" : "password"}
                      name="openaiApiKey"
                      defaultValue={settings?.openaiApiKey || ""}
                      placeholder="sk-..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('openai')}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                    >
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Groq */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Groq API Key</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                      type={showKeys.groq ? "text" : "password"}
                      name="groqApiKey"
                      defaultValue={settings?.groqApiKey || ""}
                      placeholder="gsk_..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('groq')}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                    >
                      {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Claude */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Claude API Key</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                      type={showKeys.claude ? "text" : "password"}
                      name="claudeApiKey"
                      defaultValue={settings?.claudeApiKey || ""}
                      placeholder="x-api-key..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('claude')}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                    >
                      {showKeys.claude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading === "AI"}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading === "AI" ? "Saving..." : "Save AI Settings"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 2. Outreach Delivery Section */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('delivery')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Delivery Controls</h2>
                <p className="text-xs text-zinc-500">Manage throughput and safety limits</p>
              </div>
            </div>
            {expanded.delivery ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>

          {expanded.delivery && (
            <form onSubmit={(e) => handleSave(e, "Delivery")} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Max Emails Per Hour (Per Account)</label>
                  <input
                    type="number"
                    name="maxEmailsPerHour"
                    defaultValue={settings?.maxEmailsPerHour || 30}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 italic">Recommended: 20-40 to avoid spam filters.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Follow-up Delay Options (Days)</label>
                  <input
                    type="text"
                    name="followupDelayOptions"
                    defaultValue={settings?.followupDelayOptions || "1,3,5,7,10,14"}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 italic">Comma-separated list of days for sequence steps.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading === "Delivery"}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading === "Delivery" ? "Saving..." : "Save Delivery Settings"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 3. SMTP Integrations */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('smtp')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Email Sending Accounts</h2>
                <p className="text-xs text-zinc-500">Add and manage SMTP or Gmail connections</p>
              </div>
            </div>
            {expanded.smtp ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>

          {expanded.smtp && (
            <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AccountManager initialAccounts={accounts} />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}