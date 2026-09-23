const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  console.log("All products:");
  products.forEach(p => {
    console.log(`ID: ${p.id.slice(0,5)} | Name: ${p.name} | Cat: ${p.category?.name} | Brand: ${p.brand} | Status: ${p.status}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
