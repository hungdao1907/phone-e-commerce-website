const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'Garmin' } },
        { name: { contains: 'Smartwatch trẻ em' } },
        { name: { contains: 'Đồng hồ trẻ em' } }
      ]
    }
  });
  console.log('Found categories to delete:', c);
  for (const cat of c) {
    await prisma.category.delete({ where: { id: cat.id } });
    console.log('Deleted', cat.name);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
