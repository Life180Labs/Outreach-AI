import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  const saveSettings = async (formData: FormData) => {
    "use server";
    await prisma.settings.upsert({
      where: { id: "global" },
      update: {
        maxEmailsPerHour: parseInt(formData.get("maxEmailsPerHour") as string),
        aiProvider: formData.get("aiProvider") as string,
        geminiApiKey: formData.get("geminiApiKey") as string,
        groqApiKey: formData.get("groqApiKey") as string,
        openaiApiKey: formData.get("openaiApiKey") as string,
        claudeApiKey: formData.get("claudeApiKey") as string,
        smtpHost: formData.get("smtpHost") as string,
        smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : null,
        smtpUser: formData.get("smtpUser") as string,
        smtpPass: formData.get("smtpPass") as string,
      },
      create: {
        id: "global",
        maxEmailsPerHour: parseInt(formData.get("maxEmailsPerHour") as string),
        aiProvider: formData.get("aiProvider") as string,
        geminiApiKey: formData.get("geminiApiKey") as string,
        groqApiKey: formData.get("groqApiKey") as string,
        openaiApiKey: formData.get("openaiApiKey") as string,
        claudeApiKey: formData.get("claudeApiKey") as string,
        smtpHost: formData.get("smtpHost") as string,
        smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : null,
        smtpUser: formData.get("smtpUser") as string,
        smtpPass: formData.get("smtpPass") as string,
      }
    });
    revalidatePath("/settings");
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 min-h-full">
      <form action={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <h3 className="text-black font-semibold text-sm">SMTP Configuration</h3>
          
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Host</label>
              <input 
                type="text" 
                name="smtpHost"
                defaultValue={settings?.smtpHost || ""}
                placeholder="smtp.sendgrid.net" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Port</label>
              <input 
                type="number" 
                name="smtpPort"
                defaultValue={settings?.smtpPort || ""}
                placeholder="587" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Username</label>
              <input 
                type="text" 
                name="smtpUser"
                defaultValue={settings?.smtpUser || ""}
                placeholder="apikey" 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">SMTP Password</label>
              <input 
                type="password" 
                name="smtpPass"
                defaultValue={settings?.smtpPass || ""}
                placeholder="SG...." 
                className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
              />
            </div>
            
            <div className="pt-2">
              <button type="button" className="w-full bg-white border border-brand-border hover:bg-zinc-50 text-black px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm">
                Test Connection
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-black font-semibold text-sm">Sending controls & AI</h3>
            <button type="submit" className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition shadow-sm">Save Settings</button>
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
                className="w-full accent-blue-500" 
              />
            </div>

            <div className="pt-2 border-t border-brand-border space-y-4">
              <p className="text-black font-semibold text-sm mb-3">AI Generation Provider</p>
              
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="aiProvider" value="gemini" className="peer sr-only" defaultChecked={!settings?.aiProvider || settings?.aiProvider === 'gemini'} />
                  <div className="px-4 py-2 text-center rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Google Gemini
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="aiProvider" value="groq" className="peer sr-only" defaultChecked={settings?.aiProvider === 'groq'} />
                  <div className="px-4 py-2 text-center rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Groq (Llama 3)
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="aiProvider" value="openai" className="peer sr-only" defaultChecked={settings?.aiProvider === 'openai'} />
                  <div className="px-4 py-2 text-center rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    OpenAI
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="aiProvider" value="claude" className="peer sr-only" defaultChecked={settings?.aiProvider === 'claude'} />
                  <div className="px-4 py-2 text-center rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Claude
                  </div>
                </label>
              </div>

              <div className="space-y-4 pt-4 border-t border-brand-border">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-black uppercase tracking-wider">Gemini API Key</label>
                  <input 
                    type="password" 
                    name="geminiApiKey"
                    defaultValue={settings?.geminiApiKey || ""}
                    placeholder="AIzaSy..." 
                    className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-black uppercase tracking-wider">Groq API Key</label>
                  <input 
                    type="password" 
                    name="groqApiKey"
                    defaultValue={settings?.groqApiKey || ""}
                    placeholder="gsk_..." 
                    className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-black uppercase tracking-wider">OpenAI API Key</label>
                  <input 
                    type="password" 
                    name="openaiApiKey"
                    defaultValue={settings?.openaiApiKey || ""}
                    placeholder="sk-proj-..." 
                    className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-black uppercase tracking-wider">Claude API Key</label>
                  <input 
                    type="password" 
                    name="claudeApiKey"
                    defaultValue={settings?.claudeApiKey || ""}
                    placeholder="sk-ant-..." 
                    className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-black focus:outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
