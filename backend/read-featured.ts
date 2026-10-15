import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const featured = await prisma.homeFeaturedProduct.findMany({
    include: { product: { select: { name: true } } },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  console.log(JSON.stringify(featured, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
