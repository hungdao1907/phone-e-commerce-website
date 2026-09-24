const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany();
  console.log(`Found ${reviews.length} existing reviews.`);
  
  if (reviews.length > 0) {
    console.log('Clearing existing reviews to allow schema changes...');
    await prisma.review.deleteMany();
    console.log('Cleared.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
