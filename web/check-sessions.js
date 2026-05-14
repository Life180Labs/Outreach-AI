const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessionCount = await prisma.session.count();
  const sessions = await prisma.session.findMany({
    orderBy: { expires: 'desc' },
    take: 5,
    include: { user: { select: { email: true } } }
  });
  console.log(`Total Sessions: ${sessionCount}`);
  console.log('Recent Sessions:', JSON.stringify(sessions, null, 2));
}

check().finally(() => prisma.$disconnect());
