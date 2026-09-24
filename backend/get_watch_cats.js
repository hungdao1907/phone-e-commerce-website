const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.category.findFirst({ where: { slug: 'ong-ho-thong-minh' } });
  if (!c) {
    console.log("No watch category found");
  } else {
    const subcats = await prisma.category.findMany({ where: { parentId: c.id } });
    console.log(subcats);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
