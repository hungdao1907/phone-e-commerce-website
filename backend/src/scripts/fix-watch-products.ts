import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing watch products categories and attributes...');

  const categories = await prisma.category.findMany();
  const appleWatchCat = categories.find(c => c.slug === 'apple-watch');
  const samsungWatchCat = categories.find(c => c.slug === 'samsung-watch');
  const xiaomiWatchCat = categories.find(c => c.slug === 'xiaomi-watch');

  if (!appleWatchCat || !samsungWatchCat || !xiaomiWatchCat) {
    throw new Error('Missing watch categories!');
  }

  const updates = [
    // Apple Watches
    {
      name: 'Apple Watch Series 10 GPS 42mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '42mm', 'Kết nối': 'GPS', 'Chất liệu': 'Nhôm' },
    },
    {
      name: 'Apple Watch SE 3 GPS 40mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '40mm', 'Kết nối': 'GPS', 'Chất liệu': 'Nhôm' },
    },
    {
      name: 'Apple Watch SE 3 GPS 44mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '44mm', 'Kết nối': 'GPS', 'Chất liệu': 'Nhôm' },
    },
    {
      name: 'Apple Watch Series 11 GPS 42mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '42mm', 'Kết nối': 'GPS', 'Chất liệu': 'Nhôm' },
    },
    {
      name: 'Apple Watch Series 11 GPS + Cellular 46mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '46mm', 'Kết nối': 'GPS + Cellular', 'Chất liệu': 'Nhôm' },
    },
    {
      name: 'Apple Watch Ultra 3 GPS + Cellular 49mm',
      categoryId: appleWatchCat.id,
      brand: 'Apple',
      status: 'active',
      attrs: { 'Kích thước': '49mm', 'Kết nối': 'GPS + Cellular', 'Chất liệu': 'Titan' },
    },

    // Samsung Watches
    {
      name: 'Samsung Galaxy Watch 7 Bluetooth 40mm',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '40mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Nhôm Armor' },
    },
    {
      name: 'Samsung Galaxy Watch Ultra 2025',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '47mm', 'Kết nối': 'LTE', 'Chất liệu': 'Titan' },
    },
    {
      name: 'Samsung Galaxy Watch8 40mm LTE',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '40mm', 'Kết nối': 'LTE', 'Chất liệu': 'Nhôm Armor' },
    },
    {
      name: 'Samsung Galaxy Watch8 44mm Bluetooth',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '44mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Nhôm Armor' },
    },
    {
      name: 'Samsung Galaxy Watch8 Classic Bluetooth 46mm',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '46mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Thép không gỉ' },
    },
    {
      name: 'Samsung Galaxy Watch9 40mm Bluetooth',
      categoryId: samsungWatchCat.id,
      brand: 'Samsung',
      status: 'active',
      attrs: { 'Kích thước': '40mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Nhôm Armor' },
    },

    // Xiaomi Watches
    {
      name: 'Xiaomi Watch S3 Bluetooth',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '47mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Hợp kim nhôm' },
    },
    {
      name: 'Xiaomi Watch S4 47mm',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '47mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Hợp kim nhôm' },
    },
    {
      name: 'Xiaomi Watch S4 41mm Silicone',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '41mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Hợp kim nhôm' },
    },
    {
      name: 'Xiaomi Watch 5 47mm',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '47mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Thép không gỉ' },
    },
    {
      name: 'Xiaomi Redmi Watch 5 Lite',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '48mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Nhựa cao cấp' },
    },
    {
      name: 'Xiaomi Redmi Watch 5 Active',
      categoryId: xiaomiWatchCat.id,
      brand: 'Xiaomi',
      status: 'active',
      attrs: { 'Kích thước': '49mm', 'Kết nối': 'Bluetooth', 'Chất liệu': 'Nhựa cao cấp' },
    },
  ];

  for (const item of updates) {
    const product = await prisma.product.findFirst({
      where: { name: item.name },
      include: { variants: true },
    });

    if (!product) {
      console.warn(`Product not found: ${item.name}`);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        categoryId: item.categoryId,
        brand: item.brand,
        status: item.status,
      },
    });

    for (const v of product.variants) {
      const currentAttrs = (v.attributes as Record<string, any>) || {};
      const updatedAttrs = {
        ...currentAttrs,
        ...item.attrs,
      };

      await prisma.productVariant.update({
        where: { id: v.id },
        data: {
          attributes: updatedAttrs,
        },
      });
    }

    console.log(`Updated product: ${item.name}`);
  }

  console.log('Finished updating watch products successfully!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
