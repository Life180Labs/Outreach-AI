import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Flame, Mail, BarChart3, Users, Zap, ExternalLink, Inbox } from "lucide-react";
import { CampaignActions } from "./CampaignActions";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } }
  });

  if (!campaign) return <div className="p-8 text-center text-zinc-400">Campaign not found</div>;

  const leads = await prisma.lead.findMany({
    where: { campaignId: id }
  });

  const sentCount = leads.filter(l => l.sent).length;
  const openedCount = leads.filter(l => l.opened).length;
  const repliedCount = leads.filter(l => l.replied).length;

  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
  const replyRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0;

  const hotLeads = leads.filter(l => l.status === "Hot" || l.replied).slice(0, 8);
  const hotCount = leads.filter(l => l.status === "Hot" || l.replied).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-black tracking-tight">{campaign.name || 'Untitled'}</h1>
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border capitalize ${
            campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
          }`}>
            {campaign.status}
          </span>
        </div>
        <CampaignActions campaign={campaign} leads={leads} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sent" value={sentCount} icon={Mail} />
        <StatCard label="Open Rate" value={`${openRate}%`} icon={ExternalLink} />
        <StatCard label="Reply Rate" value={`${replyRate}%`} icon={Inbox} />
        <StatCard label="Hot Leads" value={hotCount} icon={Flame} color="text-emerald-600" bg="bg-emerald-50/50" border="border-emerald-100" />
      </div>

      {/* Bento Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left: Funnel & Activity (7/12) */}
        <div className="flex-1 lg:w-[58.33%] space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-black">Conversion Funnel</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Performance across sequence stages</p>
            </div>
            
            <div className="space-y-6">
              <FunnelStep label="Emails Sent" value={sentCount} total={sentCount} color="bg-zinc-100" />
              <FunnelStep label="Opened" value={openedCount} total={sentCount} color="bg-blue-100" activeColor="bg-blue-500" />
              <FunnelStep label="Replied" value={repliedCount} total={sentCount} color="bg-emerald-100" activeColor="bg-emerald-500" />
            </div>

            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-[11px] text-zinc-400 font-medium">Auto-synced every 5 minutes</p>
              </div>
              <Link href={`/campaigns/${id}/sending`} className="text-xs font-semibold text-black hover:underline underline-offset-2 flex items-center gap-1">
                View Live Feed <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-blue-50 bg-blue-50/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">{repliedCount} Total Replies</p>
                <p className="text-xs text-blue-700/60 mt-0.5">Leads awaiting your response</p>
              </div>
            </div>
            <Link href={`/campaigns/${id}/review`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm">
              Review Drafts
            </Link>
          </div>
        </div>

        {/* Right: Hot Leads (5/12) */}
        <div className="flex-1 lg:w-[41.66%] flex flex-col h-full rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-black">Top Prospects</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {hotLeads.length > 0 ? (
              hotLeads.map((lead) => (
                <div key={lead.id} className="p-4 border-b border-zinc-50 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-500">
                    {lead.firstName[0]}{lead.lastName?.[0] || ''}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black truncate">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{lead.companyName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      lead.replied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {lead.replied ? 'Replied' : 'Opened'}
                    </span>
                    <Link href={`/leads/${lead.id}`} className="p-1 text-zinc-300 hover:text-black transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-3 text-center p-8">
                <Flame className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">No hot leads flagged yet</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
            <Link href="/leads?status=hot" className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors flex items-center justify-center gap-1.5">
              View All Hot Leads
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-5 rounded-2xl border ${border || 'border-zinc-200'} ${bg || 'bg-white'}`}>
      <Icon className={`w-4 h-4 ${color || 'text-zinc-400'} mb-3`} />
      <p className={`text-2xl font-semibold tabular-nums ${color || 'text-black'}`}>{value}</p>
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function FunnelStep({ label, value, total, color, activeColor }: any) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
        <span>{label}</span>
        <span className="text-black font-semibold">{value} <span className="text-zinc-300 font-normal ml-1">({percent}%)</span></span>
      </div>
      <div className={`w-full ${color} rounded-full h-2 overflow-hidden`}>
        <div 
          className={`h-full ${activeColor || 'bg-zinc-900'} rounded-full transition-all duration-1000`} 
          style={{ width: `${percent}%` }} 
        />
      </div>
    </div>
  );
}
