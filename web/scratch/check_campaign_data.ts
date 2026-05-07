import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { leads: true } } }
  });
  console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
  
  const leads = await prisma.lead.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });
  console.log('Recent Leads:', JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect())
