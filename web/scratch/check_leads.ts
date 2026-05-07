import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLeads() {
  const leads = await prisma.lead.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log("Checking last 5 leads:");
  leads.forEach((l, i) => {
    console.log(`Lead ${i+1}: ${l.firstName} ${l.lastName}`);
    console.log(`- Email: ${l.email}`);
    console.log(`- Notes: ${l.notes}`);
    console.log(`- Subject: ${l.emailSubject}`);
    console.log("-------------------");
  });
}

checkLeads();
