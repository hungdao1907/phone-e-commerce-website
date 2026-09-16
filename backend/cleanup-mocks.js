const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanUpMockProducts() {
  // Find products that match the mock data names
  const mockNames = ['iPhone 17 Pro Max', 'iPhone 17', 'Galaxy S25 Ultra', 'Xiaomi 15 Ultra', 'OPPO Find X8 Pro'];
  
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: mockNames
      }
    }
  });

  console.log('Found mock products in DB:', products.map(p => p.name));

  for (const product of products) {
    // Delete variants first
    await prisma.productVariant.deleteMany({
      where: { productId: product.id }
    });
    
    // Delete product
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('Deleted', product.name);
  }
}

cleanUpMockProducts()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
