const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const products = await prisma.product.findMany({ include: { variants: true } });
  
  const filters = { brands: [] };
  const brandCount = {};
  
  products.forEach(p => {
    if (p.brand) {
      brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
    }
  });
  
  for (const b in brandCount) filters.brands.push({ value: b, count: brandCount[b] });
  
  console.log(JSON.stringify(filters, null, 2));
}
test().catch(console.error).finally(() => prisma.$disconnect());
