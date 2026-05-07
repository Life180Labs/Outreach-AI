"use client";

import { useState } from "react";
import { saveSettings, testSmtpConnection } from "./actions";
import { Check, Loader2, Mail, ShieldCheck, Zap } from "lucide-react";

export function SettingsClient({ settings }: { settings: any }) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    await saveSettings(formData);
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const form = document.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    const result = await testSmtpConnection(formData);
    
    if (result.success) {
      setTestResult({ success: true, message: "Connection successful!" });
    } else {
      setTestResult({ success: false, message: result.error || "Connection failed" });
    }
    setTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left Column */}
      <div className="space-y-6">
        <div>
          <h3 className="text-black font-semibold text-sm mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" /> SMTP Configuration
          </h3>
          
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Host</label>
              <input 
                type="text" 
                name="smtpHost"
                defaultValue={settings?.smtpHost || ""}
                placeholder="smtp.sendgrid.net" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Port</label>
              <input 
                type="number" 
                name="smtpPort"
                defaultValue={settings?.smtpPort || ""}
                placeholder="587" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Username</label>
              <input 
                type="text" 
                name="smtpUser"
                defaultValue={settings?.smtpUser || ""}
                placeholder="apikey" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Password</label>
              <input 
                type="password" 
                name="smtpPass"
                defaultValue={settings?.smtpPass || ""}
                placeholder="SG...." 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full bg-white border border-brand-border hover:bg-zinc-50 text-black px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Connection"}
              </button>
              {testResult && (
                <p className={`mt-2 text-xs font-medium text-center ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                  {testResult.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Gmail Configuration (Alternative)
          </h3>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">Gmail Address</label>
              <input 
                type="email" 
                name="gmailEmailAddress"
                defaultValue={settings?.gmailEmailAddress || ""}
                placeholder="you@gmail.com" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">Gmail App Password</label>
              <input 
                type="password" 
                name="gmailRefreshToken"
                defaultValue={settings?.gmailRefreshToken || ""}
                placeholder="xxxx xxxx xxxx xxxx" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
              <p className="text-[10px] text-brand-muted">Note: Uses Gmail App Passwords for simplicity.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-black font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> Sending controls & AI
          </h3>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-black font-semibold text-sm">Max emails per hour</p>
                <p className="text-brand-muted text-sm">Lower = lower spam risk. Recommended: 20-40.</p>
              </div>
              <span className="text-black font-bold text-sm">{settings?.maxEmailsPerHour || 30}/hr</span>
            </div>
            <input 
              type="range" 
              name="maxEmailsPerHour"
              min="10" 
              max="100" 
              defaultValue={settings?.maxEmailsPerHour || 30}
              className="w-full accent-black" 
            />
          </div>

          <div className="pt-2 border-t border-brand-border space-y-4">
            <p className="text-black font-semibold text-sm mb-3">AI Generation Provider</p>
            
            <div className="grid grid-cols-2 gap-2">
              {['gemini', 'groq', 'openai', 'claude'].map((provider) => (
                <label key={provider} className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="aiProvider" 
                    value={provider} 
                    className="peer sr-only" 
                    defaultChecked={(!settings?.aiProvider && provider === 'gemini') || settings?.aiProvider === provider} 
                  />
                  <div className="px-4 py-2 text-center rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black capitalize">
                    {provider}
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-brand-border">
              {[
                { name: 'geminiApiKey', label: 'Gemini API Key', placeholder: 'AIzaSy...' },
                { name: 'groqApiKey', label: 'Groq API Key', placeholder: 'gsk_...' },
                { name: 'openaiApiKey', label: 'OpenAI API Key', placeholder: 'sk-proj-...' },
                { name: 'claudeApiKey', label: 'Claude API Key', placeholder: 'sk-ant-...' },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-xs font-semibold text-black uppercase tracking-wider">{field.label}</label>
                  <input 
                    type="password" 
                    name={field.name}
                    defaultValue={settings?.[field.name] || ""}
                    placeholder={field.placeholder} 
                    className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
