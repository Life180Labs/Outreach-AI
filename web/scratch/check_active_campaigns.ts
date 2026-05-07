import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, status: true, _count: { select: { leads: true } } }
  });
  console.log('Active Campaigns:', activeCampaigns);
  
  if (activeCampaigns.length > 0) {
    const campaignId = activeCampaigns[0].id;
    const unsentLeads = await prisma.lead.count({
      where: { campaignId, sent: false }
    });
    console.log(`Campaign ${campaignId} has ${unsentLeads} unsent leads.`);
    
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    console.log('SMTP Config:', {
      host: settings?.smtpHost,
      user: settings?.smtpUser,
      from: settings?.smtpFromEmail,
      hasPass: !!settings?.smtpPass
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
