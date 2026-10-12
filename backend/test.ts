import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const p = await prisma.product.findFirst({ include: { category: true } });
  console.log(p);
  process.exit(0);
})();
