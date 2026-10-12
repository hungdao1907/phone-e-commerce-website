import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async()=>{
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'iPhone 17',
      }
    }
  });
  const products2 = await prisma.product.findMany({
    where: {
      name: {
        contains: 'iPhone Air',
      }
    }
  });
  console.log('iPhone 17:', products.map(p => ({ id: p.id, name: p.name, image: p.image, images: p.images })));
  console.log('iPhone Air:', products2.map(p => ({ id: p.id, name: p.name, image: p.image, images: p.images })));
  process.exit(0);
})();
