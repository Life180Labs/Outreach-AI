import prisma from "@/lib/prisma";
import { LaunchClient } from "./LaunchClient";
import { Stepper } from "@/components/Stepper";

export default async function CampaignLaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } }
  });

  if (!campaign) return <div>Campaign not found</div>;

  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  const readyLeads = await prisma.lead.count({
    where: { campaignId: id, isApproved: true }
  });

  return (
    <div className="flex flex-col h-full relative">
      <Stepper campaignId={id} />
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <LaunchClient 
          campaign={campaign} 
          settings={settings} 
          totalLeads={campaign._count.leads} 
          readyLeads={readyLeads} 
        />
      </div>
    </div>
  );
}
