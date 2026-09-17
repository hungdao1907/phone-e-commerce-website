const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking Products...");
  const products = await prisma.product.findMany({
    select: { id: true, image: true, images: true }
  });
  
  for (const p of products) {
    let changed = false;
    let newImage = p.image;
    let newImages = p.images || [];
    
    if (newImage && newImage.startsWith('data:image')) {
      newImage = null; // or empty string depending on schema
      changed = true;
    }
    
    let clearedImages = newImages.map(img => {
      if (img && img.startsWith('data:image')) {
        changed = true;
        return '';
      }
      return img;
    });
    
    if (changed) {
      console.log(`Fixing Product ${p.id}...`);
      await prisma.product.update({
        where: { id: p.id },
        data: { image: newImage, images: clearedImages }
      });
    }
  }

  console.log("Checking Variants...");
  const variants = await prisma.productVariant.findMany({
    select: { id: true, image: true }
  });
  
  for (const v of variants) {
    if (v.image && v.image.startsWith('data:image')) {
      console.log(`Fixing Variant ${v.id}...`);
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { image: null }
      });
    }
  }
  console.log("Done!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
