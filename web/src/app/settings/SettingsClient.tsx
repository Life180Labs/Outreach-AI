"use client";

import { useState } from "react";
import { saveSettings, testSmtpConnection } from "./actions";
import { Check, Loader2, Mail, ShieldCheck, Zap } from "lucide-react";

export function SettingsClient({ settings }: { settings: any }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [maxEmails, setMaxEmails] = useState(settings?.maxEmailsPerHour || 30);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await saveSettings(formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
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
    <form onSubmit={handleSave} className="flex flex-col lg:grid lg:grid-cols-2 gap-12 pb-24">
      {/* Left Column */}
      <div className="space-y-8">
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP From Email</label>
              <input 
                type="email" 
                name="smtpFromEmail"
                defaultValue={settings?.smtpFromEmail || ""}
                placeholder="hello@yourdomain.com" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
              <p className="text-[10px] text-brand-muted">The verified sender address in your SMTP provider.</p>
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
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-black font-semibold text-sm">Max emails per hour</p>
                <p className="text-brand-muted text-sm">Lower = lower spam risk. Recommended: 20-40.</p>
              </div>
              <span className="text-black font-bold text-sm">{maxEmails}/hr</span>
            </div>
            <input 
              type="range" 
              name="maxEmailsPerHour"
              min="10" 
              max="100" 
              value={maxEmails}
              onChange={(e) => setMaxEmails(parseInt(e.target.value))}
              className="w-full accent-black" 
            />
          </div>
          
          <div className="pt-2 border-t border-brand-border space-y-4">
            <p className="text-black font-semibold text-sm">Follow-up Configuration</p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">Delay Options (Days, comma-separated)</label>
              <input 
                type="text" 
                name="followupDelayOptions"
                defaultValue={settings?.followupDelayOptions || "1,3,5,7,10,14"}
                placeholder="1,3,5,7,10,14" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/5" 
              />
              <p className="text-[10px] text-brand-muted">These options will appear in your campaign setup dropdowns.</p>
            </div>
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

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border p-4 flex justify-center items-center z-50">
        <div className="max-w-7xl w-full flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <p className="text-xs text-brand-muted hidden sm:block">All changes are saved to your local database.</p>
            {saved && <span className="text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">✓ Saved successfully!</span>}
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-black text-white hover:bg-zinc-800'}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Configuration Saved</> : <><Check className="w-4 h-4" /> Save Configuration</>}
          </button>
        </div>
      </div>
    </form>
  );
}
