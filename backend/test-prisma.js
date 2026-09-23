const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const whereClause = {};
  const products = await prisma.product.findMany({
    where: whereClause,
    include: { category: true, variants: true }
  });
  console.log("Total products fetched:", products.length);
}
test().catch(console.error).finally(() => prisma.$disconnect());
