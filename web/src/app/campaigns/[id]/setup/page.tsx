import prisma from "@/lib/prisma";
import { updateCampaignSetup } from "../../actions";
import { Stepper } from "@/components/Stepper";
import { ArrowRight, Settings2, Sliders, Globe, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function CampaignSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id as string;

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id, userId },
    include: { _count: { select: { leads: true } } }
  });

  const settings = await prisma.settings.findUnique({ where: { userId } });
  const strategies = await prisma.strategy.findMany({ orderBy: { name: 'asc' } });
  const smtpAccounts = await prisma.integrationAccount.findMany({
    where: { userId, type: "SMTP" },
    orderBy: { createdAt: 'desc' }
  });



  if (!campaign) return <div className="p-8 text-center text-zinc-400">Campaign not found</div>;

  return (
    <div className="w-full space-y-6">
      <Stepper campaignId={id} />
      
      <form action={updateCampaignSetup} className="space-y-6">
        <input type="hidden" name="campaignId" value={campaign.id} />

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Campaign</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-[10px] font-bold text-black uppercase tracking-widest">Configuration</span>
          </div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">{campaign.name || 'Campaign Setup'}</h1>
          <p className="text-zinc-400 text-sm">Define your outreach strategy and AI context</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Core Info (7/12) */}
          <div className="flex-1 lg:w-[58.33%] space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-black">Campaign Identity</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Define your internal name and outreach context</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Campaign Name</label>
                  <input 
                    type="text"
                    name="campaignName"
                    defaultValue={campaign.name || "Untitled Campaign"}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors" 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">AI Author / Sender Name</label>
                  <input 
                    type="text"
                    name="senderName"
                    defaultValue={campaign.senderName || "The Life180 Team"}
                    placeholder="e.g. Your Name or 'GTM Team'"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Context for AI <span className="font-normal opacity-50">(anchors personalization)</span></label>
                  <textarea 
                    name="context" 
                    defaultValue={campaign.context || ""}
                    placeholder="e.g. Offering AI ops support to recently funded startups..."
                    rows={4}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors resize-none" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-black">Sequence Logic</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Configure follow-up timing and sequence steps</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Follow-up 1</label>
                  <select 
                    name="followup1Delay"
                    defaultValue={campaign.followup1Delay}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors appearance-none cursor-pointer"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Follow-up 2</label>
                  <select 
                    name="followup2Delay"
                    defaultValue={campaign.followup2Delay}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors appearance-none cursor-pointer"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Style & Auto-detected (5/12) */}
          <div className="flex-1 lg:w-[41.66%] space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-black">Tone & Strategy</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Refine how the AI communicates</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-2 block">Sending Email Account</label>
                  <select 
                    name="smtpAccountId"
                    defaultValue={campaign.smtpAccountId || ""}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <option value="">Select Sending Account...</option>
                    {smtpAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.provider})</option>
                    ))}
                  </select>
                  {smtpAccounts.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-2">
                      No SMTP accounts found. <Link href="/settings" className="underline font-bold">Add one in settings</Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-2 block">AI Outreach Strategy</label>

                  <select 
                    name="strategyId"
                    defaultValue={campaign.strategyId || ""}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <option value="">Global Default</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-2 italic">Select a proven strategy from the Prompt Engineering Studio</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-3 block">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {['Professional', 'Friendly', 'Direct'].map(t => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" name="tone" value={t} className="peer sr-only" defaultChecked={(!campaign.tone && t === 'Professional') || campaign.tone?.includes(t)} />
                        <div className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium transition-all peer-checked:bg-black peer-checked:text-white peer-checked:border-black text-zinc-500 hover:border-zinc-400">
                          {t}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-3 block">CTA Style</label>
                  <div className="flex flex-wrap gap-2">
                    {['Book a call', 'Reply back', 'Custom'].map(c => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="cta" value={c} className="peer sr-only" defaultChecked={(!campaign.cta && c === 'Book a call') || campaign.cta?.includes(c)} />
                        <div className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium transition-all peer-checked:bg-black peer-checked:text-white peer-checked:border-black text-zinc-500 hover:border-zinc-400">
                          {c}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-black">Auto-Detected Context</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Refined by AI during lead ingestion</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tight mb-1 block">Business Type</label>
                  <input 
                    type="text"
                    name="businessType"
                    defaultValue={campaign.businessType || ""}
                    placeholder="e.g. SaaS, Real Estate..."
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tight mb-1 block">Geographic Focus</label>
                  <input 
                    type="text"
                    name="locationContext"
                    defaultValue={campaign.locationContext || ""}
                    placeholder="e.g. North America, Global..."
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black hover:bg-zinc-800 text-white px-5 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              Generate {campaign._count.leads} Drafts
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
