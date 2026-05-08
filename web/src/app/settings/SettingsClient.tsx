"use client";

import { useState } from "react";
import { saveSettings, testSmtpConnection } from "./actions";
import { Check, Loader2, Zap, AlertCircle } from "lucide-react";

export function SettingsClient({ settings }: { settings: Record<string, unknown> | null }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [maxEmails, setMaxEmails] = useState((settings?.maxEmailsPerHour as number) || 30);
  const [activeProvider, setActiveProvider] = useState((settings?.aiProvider as string) || "gemini");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    const result = await saveSettings(formData);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Failed to save: " + (result.error || "Unknown error"));
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const form = document.querySelector("form") as HTMLFormElement;
    const formData = new FormData(form);
    const result = await testSmtpConnection(formData);
    setTestResult({
      success: result.success,
      message: result.success ? "Connection verified!" : (result.error || "Connection failed"),
    });
    setTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  const val = (key: string) => (settings?.[key] as string) || "";

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-black">SMTP Configuration</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Primary outbound email transport</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="SMTP Host" name="smtpHost" defaultValue={val("smtpHost")} placeholder="smtp.sendgrid.net" />
            <FieldInput label="SMTP Port" name="smtpPort" type="number" defaultValue={val("smtpPort")} placeholder="587" />
            <FieldInput label="Username" name="smtpUser" defaultValue={val("smtpUser")} placeholder="apikey" />
            <FieldInput label="Password" name="smtpPass" type="password" defaultValue={val("smtpPass")} placeholder="SG...." />
            <div className="col-span-2">
              <FieldInput label="From Email" name="smtpFromEmail" type="email" defaultValue={val("smtpFromEmail")} placeholder="hello@yourdomain.com" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full py-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 text-sm font-medium text-zinc-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Test Connection
          </button>
          {testResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`} role="alert">
              {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Gmail */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-black">Gmail Configuration</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Alternative transport via Google App Passwords</p>
          </div>
          <div className="space-y-4">
            <FieldInput label="Gmail Address" name="gmailEmailAddress" type="email" defaultValue={val("gmailEmailAddress")} placeholder="you@gmail.com" />
            <FieldInput label="Gmail App Password" name="gmailRefreshToken" type="password" defaultValue={val("gmailRefreshToken")} placeholder="xxxx xxxx xxxx xxxx" />
          </div>
        </div>

        {/* Sending Controls */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-black">Sending Controls</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Rate limits and follow-up timing</p>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-xs font-medium text-zinc-500">Max Emails Per Hour</label>
              <span className="text-sm font-semibold text-black tabular-nums">{maxEmails}/hr</span>
            </div>
            <input
              type="range" name="maxEmailsPerHour" min="10" max="100" value={maxEmails}
              onChange={(e) => setMaxEmails(parseInt(e.target.value))}
              className="w-full accent-black h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1"><span>10</span><span>50</span><span>100</span></div>
          </div>
          <FieldInput label="Follow-up Delays (days)" name="followupDelayOptions" defaultValue={val("followupDelayOptions") || "1,3,5,7,10,14"} placeholder="1,3,5,7,10,14" />
        </div>

        {/* AI Provider */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-black">AI Provider</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Select provider and configure API keys</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["gemini", "groq", "openai", "claude"] as const).map(provider => (
              <label key={provider} className="cursor-pointer">
                <input type="radio" name="aiProvider" value={provider} className="peer sr-only" defaultChecked={activeProvider === provider} onChange={() => setActiveProvider(provider)} />
                <div className="text-center py-2.5 rounded-lg border text-xs font-medium transition-colors peer-checked:bg-black peer-checked:text-white peer-checked:border-black border-zinc-200 text-zinc-500 hover:border-zinc-400">
                  {provider}
                </div>
              </label>
            ))}
          </div>
          <div className="space-y-4 pt-2">
            <FieldInput label="Gemini API Key" name="geminiApiKey" type="password" defaultValue={val("geminiApiKey")} placeholder="AIzaSy..." />
            <FieldInput label="Groq API Key" name="groqApiKey" type="password" defaultValue={val("groqApiKey")} placeholder="gsk_..." />
            <FieldInput label="OpenAI API Key" name="openaiApiKey" type="password" defaultValue={val("openaiApiKey")} placeholder="sk-proj-..." />
            <FieldInput label="Claude API Key" name="claudeApiKey" type="password" defaultValue={val("claudeApiKey")} placeholder="sk-ant-..." />
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-zinc-200 py-4 px-6 z-50">
        <div className="flex items-center justify-end gap-4 max-w-7xl mx-auto">
          {saved && <span className="text-emerald-600 text-xs font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Save Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldInput({ label, name, type = "text", defaultValue = "", placeholder = "" }: {
  label: string; name: string; type?: string; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium text-zinc-500 mb-1 block">{label}</label>
      <input id={name} type={type} name={name} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-400" />
    </div>
  );
}
