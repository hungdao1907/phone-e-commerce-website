const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const iphone = await prisma.product.findFirst({
    where: { name: { contains: 'iphone', mode: 'insensitive' } },
    include: { variants: true, category: true }
  });
  const macbook = await prisma.product.findFirst({
    where: { name: { contains: 'macbook', mode: 'insensitive' } },
    include: { variants: true, category: true }
  });
  console.log('--- IPHONE ---');
  console.log(JSON.stringify(iphone, null, 2));
  console.log('--- MACBOOK ---');
  console.log(JSON.stringify(macbook, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
