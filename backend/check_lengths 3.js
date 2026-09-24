const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  products.forEach(p => {
    let imgLen = p.image ? p.image.length : 0;
    let imgsLen = (p.images || []).map(i => i ? i.length : 0);
    if (imgLen > 1000 || imgsLen.some(l => l > 1000)) {
       console.log(`Product ${p.id} has large images: image=${imgLen}, images=[${imgsLen.join(',')}]`);
    }
  });

  const variants = await prisma.productVariant.findMany();
  variants.forEach(v => {
    let imgLen = v.image ? v.image.length : 0;
    if (imgLen > 1000) {
       console.log(`Variant ${v.id} has large image: image=${imgLen}`);
    }
  });
  console.log("Done checking lengths.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
