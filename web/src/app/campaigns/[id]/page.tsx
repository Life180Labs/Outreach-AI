import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } }
  });

  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 min-h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">{campaign.name || 'Untitled'}</h1>
          <span className="bg-[#eef8ed] text-[#2b6528] px-2.5 py-1 rounded-md text-xs font-bold border border-[#b2ddab]">Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
            Pause
          </button>
          <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
            Export CSV
          </button>
          <button className="bg-white hover:bg-red-50 border border-red-200 text-red-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            Stop all
          </button>
        </div>
      </div>

      <div className="bg-[#eef8ed] border border-[#b2ddab] rounded-xl p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
          <p className="text-[#2b6528] text-sm font-medium">3 new replies today — 2 interested. Rania Al-Farsi and James Mwangi flagged as hot leads.</p>
        </div>
        <Link href="/leads" className="text-[#2b6528] text-sm font-bold flex items-center hover:underline whitespace-nowrap">
          Review now <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-4xl font-semibold text-black mb-1">82</p>
          <p className="text-brand-muted text-sm font-medium">Sent</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-4xl font-semibold text-black mb-1">41%</p>
          <p className="text-brand-muted text-sm font-medium">Open rate</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-4xl font-semibold text-black mb-1">12%</p>
          <p className="text-brand-muted text-sm font-medium">Reply rate</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-4xl font-semibold text-emerald-600 mb-1">5</p>
          <p className="text-brand-muted text-sm font-medium">Hot leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
        <div>
          <h3 className="text-black font-semibold text-sm mb-4">Funnel</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-semibold text-black mb-1.5">
                <span>Sent</span>
                <span>82</span>
              </div>
              <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5">
                <div className="h-2.5 bg-[#e0dcd1] rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-semibold text-black mb-1.5">
                <span>Opened</span>
                <span>34</span>
              </div>
              <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5">
                <div className="h-2.5 bg-[#7ba6f5] rounded-full" style={{ width: '41%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-black mb-1.5">
                <span>Replied</span>
                <span>10</span>
              </div>
              <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5">
                <div className="h-2.5 bg-emerald-400 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-black mb-1.5">
                <span>Call booked</span>
                <span>3</span>
              </div>
              <div className="w-full bg-brand-surface border border-brand-border rounded-full h-2.5">
                <div className="h-2.5 bg-emerald-600 rounded-full" style={{ width: '3%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-black font-semibold text-sm mb-4">Hot leads — action needed</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black shrink-0 text-xs">
                  RA
                </div>
                <div>
                  <p className="text-sm font-bold text-black leading-tight">Rania Al-Farsi</p>
                  <p className="text-xs text-brand-muted">NovaSpark AI · Dubai</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#eef8ed] text-[#2b6528] px-2 py-0.5 rounded text-xs font-bold border border-[#b2ddab]">Replied</span>
                <Link href="/leads/1" className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center hover:bg-zinc-800 transition shadow-sm">
                  View <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black shrink-0 text-xs">
                  JM
                </div>
                <div>
                  <p className="text-sm font-bold text-black leading-tight">James Mwangi</p>
                  <p className="text-xs text-brand-muted">Cognify · Toronto</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#eef8ed] text-[#2b6528] px-2 py-0.5 rounded text-xs font-bold border border-[#b2ddab]">Replied</span>
                <Link href="/leads/2" className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center hover:bg-zinc-800 transition shadow-sm">
                  View <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black shrink-0 text-xs">
                  SB
                </div>
                <div>
                  <p className="text-sm font-bold text-black leading-tight">Sara Badr</p>
                  <p className="text-xs text-brand-muted">HeliosML · Riyadh</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-bold border border-orange-200">Opened &times;3</span>
                <Link href="/leads/3" className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition shadow-sm">
                  View <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
