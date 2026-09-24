const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  console.log("Categories:");
  cats.forEach(c => {
    console.log(`ID: ${c.id.slice(0,5)} | Name: ${c.name} | Slug: ${c.slug}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
