const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { email: true, createdAt: true, name: true }
  });
  console.log(`Total Users: ${count}`);
  console.log('Recent Users:', JSON.stringify(users, null, 2));
}

check().finally(() => prisma.$disconnect());
