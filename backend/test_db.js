const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(p.map(x => ({ id: x.id, name: x.name, status: x.status, categoryId: x.categoryId })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
