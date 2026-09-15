const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    // If slug has a format like "name-xxxx", we can clean it
    let cleanSlug = cat.slug;
    const parts = cat.slug.split('-');
    if (parts.length > 1 && parts[parts.length - 1].length === 4) {
      parts.pop(); // remove the random 4 chars
      cleanSlug = parts.join('-');
    }
    
    // Check if cleanSlug is unique
    const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
    if (!existing || existing.id === cat.id) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { slug: cleanSlug }
      });
      console.log(`Updated slug for ${cat.name}: ${cat.slug} -> ${cleanSlug}`);
    } else {
      console.log(`Skipped ${cat.name}: clean slug ${cleanSlug} already exists`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
