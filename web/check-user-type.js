const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { email: true, name: true, passwordHash: true }
  });
  console.log('Recent Users:', JSON.stringify(users, null, 2));
}

check().finally(() => prisma.$disconnect());
