import Link from "next/link";
import { ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { StopSequencesButton } from "./StopSequencesButton";

export default async function DashboardPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { 
      _count: { 
        select: { 
          leads: true 
        } 
      },
      leads: {
        select: {
          sent: true,
          status: true
        }
      }
    }
  });

  const lastCampaign = campaigns[0];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-brand-border bg-white flex flex-col justify-between items-start h-40">
          <div>
            <h3 className="text-xl font-semibold text-black mb-1">New campaign</h3>
            <p className="text-brand-muted text-sm">Upload leads + configure + send</p>
          </div>
          <Link href="/campaigns/new/upload" className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center gap-1 text-sm">
            Start <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="p-6 rounded-2xl border border-brand-border bg-white flex flex-col justify-between items-start h-40">
          <div>
            <h3 className="text-xl font-semibold text-black mb-1">Resume campaign</h3>
            <p className="text-brand-muted text-sm">{lastCampaign?.name || 'No recent campaigns'}</p>
          </div>
          {lastCampaign ? (
            <Link href={`/campaigns/${lastCampaign.id}/setup`} className="bg-white hover:bg-zinc-50 border border-brand-border text-black px-5 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center gap-1 text-sm shadow-sm">
              Continue <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
             <button disabled className="bg-white border border-brand-border text-brand-muted px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-1 text-sm opacity-50 shadow-sm">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
          <p className="text-red-900 text-sm"><span className="font-semibold">Global kill switch</span> — stops all active sequences immediately if a prompt error is detected.</p>
        </div>
        <StopSequencesButton />
      </div>

      <div>
        <h2 className="text-sm font-bold text-brand-muted mb-4">Active campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.length === 0 ? (
            <div className="p-6 text-brand-muted text-sm border border-brand-border rounded-xl bg-brand-surface">No campaigns yet.</div>
          ) : campaigns.map(c => {
            const sentCount = c.leads.filter(l => l.sent).length;
            const hotCount = c.leads.filter(l => l.status === 'hot').length;
            const progress = c._count.leads > 0 ? (sentCount / c._count.leads) * 100 : 0;

            return (
              <div key={c.id} className="p-5 rounded-xl border border-brand-border bg-brand-surface space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-0.5">{c.name || 'Untitled'}</h3>
                  <p className="text-brand-muted text-sm">{c._count.leads} leads · {c.status === 'active' ? 'Running' : c.status === 'completed' ? 'Completed' : 'Draft'}</p>
                </div>
                <div className="w-full bg-brand-border rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${c.status === 'completed' ? 'bg-[#a3d482]' : 'bg-brand-primary'}`} 
                    style={{ width: `${c.status === 'completed' ? 100 : progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-brand-muted">
                  Sent {sentCount} · {hotCount} hot leads · <Link href={`/campaigns/${c.id}`} className="text-black hover:underline inline-flex items-center">View <ArrowRight className="w-3 h-3 ml-0.5" /></Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
