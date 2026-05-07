import prisma from "@/lib/prisma";
import { updateCampaignSetup } from "../../actions";
import { Stepper } from "@/components/Stepper";
import { ArrowRight } from "lucide-react";

export default async function CampaignSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } }
  });
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="flex flex-col h-full">
      <Stepper campaignId={id} />
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <form action={updateCampaignSetup} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <input type="hidden" name="campaignId" value={campaign.id} />
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Campaign name</label>
              <input 
                type="text"
                name="campaignName"
                defaultValue={campaign.name || "Untitled Campaign"}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black focus:outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Sender & AI Config</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${settings?.gmailEmailAddress || settings?.smtpHost ? 'bg-emerald-500' : 'bg-zinc-300'}`}></div>
                  <span className="truncate text-sm font-medium">{settings?.gmailEmailAddress || settings?.smtpUser || "No account"}</span>
                  <span className="text-brand-muted text-[10px] ml-auto uppercase">{settings?.smtpHost ? 'SMTP' : 'Gmail'}</span>
                </div>
                <div className="bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${settings?.aiProvider ? 'bg-purple-500' : 'bg-zinc-300'}`}></div>
                  <span className="truncate text-sm font-medium capitalize">{settings?.aiProvider || "gemini"}</span>
                  <span className="text-brand-muted text-[10px] ml-auto uppercase">AI</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Context for AI <span className="text-brand-muted font-normal">(anchors personalization)</span></label>
              <textarea 
                name="context" 
                defaultValue={campaign.context || ""}
                placeholder="e.g. Offering AI ops support to recently funded startups..."
                rows={3}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black focus:outline-none resize-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Follow-up schedule</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-black mb-1">Follow-up 1</p>
                  <select 
                    name="followup1Delay"
                    defaultValue={campaign.followup1Delay}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black text-sm focus:outline-none appearance-none"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold text-black mb-1">Follow-up 2</p>
                  <select 
                    name="followup2Delay"
                    defaultValue={campaign.followup2Delay}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black text-sm focus:outline-none appearance-none"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Tone</label>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="tone" value="Professional" className="peer sr-only" defaultChecked={!campaign.tone || campaign.tone.includes('Professional')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Professional
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="tone" value="Friendly" className="peer sr-only" defaultChecked={campaign.tone?.includes('Friendly')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Friendly
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="tone" value="Direct" className="peer sr-only" defaultChecked={campaign.tone?.includes('Direct')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Direct
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">CTA type</label>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="cta" value="Book a call" className="peer sr-only" defaultChecked={!campaign.cta || campaign.cta.includes('Book')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Book a call
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="cta" value="Reply back" className="peer sr-only" defaultChecked={campaign.cta?.includes('Reply')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Reply back
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="cta" value="Custom" className="peer sr-only" defaultChecked={campaign.cta?.includes('Custom')} />
                  <div className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium transition-colors peer-checked:border-black peer-checked:bg-white peer-checked:shadow-sm bg-white text-brand-muted hover:text-black">
                    Custom
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Business type <span className="text-brand-muted font-normal">(auto-detected)</span></label>
              <input 
                type="text"
                name="businessType"
                defaultValue={campaign.businessType || ""}
                placeholder="e.g. AI Startup / SaaS"
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black text-sm focus:outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Location context <span className="text-brand-muted font-normal">(auto)</span></label>
              <input 
                type="text"
                name="locationContext"
                defaultValue={campaign.locationContext || ""}
                placeholder="e.g. UAE, KSA, Canada"
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-black text-sm focus:outline-none" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full mt-6 bg-black hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-sm"
            >
              Generate {campaign._count.leads} emails <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
