"use client";

import { useState } from "react";
import { saveSettings } from "./actions";

export function SettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    await saveSettings(formData);
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium text-white">Gmail Configuration</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Provide your Gmail App Password for sending emails securely.
        </p>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Gmail Email Address</label>
          <input 
            type="email" 
            name="gmailEmailAddress" 
            defaultValue={initialData?.gmailEmailAddress || ''}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">App Password / Refresh Token</label>
          <input 
            type="password" 
            name="gmailRefreshToken" 
            defaultValue={initialData?.gmailRefreshToken || ''}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium text-white">Google Gemini Configuration</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Gemini API Key</label>
          <input 
            type="password" 
            name="geminiApiKey" 
            defaultValue={initialData?.geminiApiKey || ''}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium text-white">Sending Limits</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Max Emails Per Hour</label>
          <input 
            type="number" 
            name="maxEmailsPerHour" 
            defaultValue={initialData?.maxEmailsPerHour || 50}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
        {success && <span className="text-emerald-500 text-sm">Saved successfully!</span>}
      </div>
    </form>
  );
}
