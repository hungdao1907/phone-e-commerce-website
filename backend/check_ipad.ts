import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const ipads = await prisma.product.findMany({
    where: { 
      brand: 'Apple',
      category: {
        slug: { in: ['ipad', 'tablet', 'may-tinh-bang'] }
      }
    },
    include: { category: true }
  });
  console.log("IPads found:", ipads.length);
  ipads.forEach(p => console.log(p.name, p.status, p.category?.slug));
  
  // also check how TabletPage filters
  const allProducts = await prisma.product.findMany({ include: { category: true } });
  const brand = 'ipad';
  const apiProducts = allProducts.filter((p: any) => {
    const isTablet = p.category?.slug?.includes('tablet') || p.category?.name?.toLowerCase().includes('bảng');
    const pBrand = (p.brand || '').toLowerCase();
    
    if (brand === 'ipad') {
      return isTablet && (pBrand === 'apple' || p.name?.toLowerCase().includes('ipad'));
    }
    return isTablet && (pBrand === brand.toLowerCase() || p.name?.toLowerCase().includes(brand.toLowerCase()));
  });
  console.log("apiProducts length:", apiProducts.length);
  
  process.exit(0);
})();
