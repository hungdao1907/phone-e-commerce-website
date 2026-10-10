import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const categories = await prisma.category.findMany();
  console.log(categories);
  process.exit(0);
})();
