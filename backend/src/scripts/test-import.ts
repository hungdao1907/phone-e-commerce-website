import { processImport } from '../services/import.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const groupedProducts = [{
    key: 'prod-0',
    name: 'Samsung Galaxy Z Fold8 Ultra',
    categorySlug: 'dien-thoai',
    categoryId: 'mock-id',
    brand: 'Samsung',
    description: 'Test description',
    status: 'active',
    specifications: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png',
    galleryUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png' // duplicate to test dedup
    ],
    variants: [
      {
        sku: 'TEST-SKU-1',
        price: 52990000,
        salePrice: null,
        stock: 0,
        colorCode: '#8E7895',
        attributes: { 'Màu sắc': 'Tím Shadow', 'Dung lượng': '256GB' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png'
      },
      {
        sku: 'TEST-SKU-2',
        price: 58990000,
        salePrice: null,
        stock: 0,
        colorCode: '#8E7895',
        attributes: { 'Màu sắc': 'Tím Shadow', 'Dung lượng': '512GB' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/512px-React-icon.svg.png'
      }
    ]
  }];

  try {
    const result = await processImport(groupedProducts);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
