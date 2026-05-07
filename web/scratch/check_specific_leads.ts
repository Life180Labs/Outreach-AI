import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const campaignId = 'cmov0go4r0000rvn9si3meovz';
  const leads = await prisma.lead.findMany({
    where: { campaignId }
  });
  console.log(`Leads for ${campaignId}:`, JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect())
