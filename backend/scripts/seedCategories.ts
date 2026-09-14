import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const categoryData = [
  {
    name: "Điện thoại", icon: "smartphone",
    children: [
      { name: "iPhone" }, { name: "Samsung" }, { name: "Xiaomi" }, { name: "OPPO" }, { name: "HONOR" }, { name: "vivo" }, { name: "TECNO" }, { name: "Nubia" }, { name: "Sony" }, { name: "Nokia" }, { name: "Infinix" }, { name: "Nothing Phone" }, { name: "Realme" }, { name: "Itel" }, { name: "Masstel" }, { name: "Các thương hiệu khác" }
    ]
  },
  {
    name: "Máy tính bảng", icon: "tablet",
    children: [
      { name: "iPad" }, { name: "Samsung Galaxy Tab" }, { name: "Xiaomi Pad" }, { name: "Lenovo" }, { name: "OPPO Pad" }, { name: "Huawei" }, { name: "Android Tablet" }, { name: "Các thương hiệu khác" }
    ]
  },
  {
    name: "Laptop", icon: "laptop",
    children: [
      { name: "MacBook" }, { name: "ASUS" }, { name: "Lenovo" }, { name: "MSI" }, { name: "Acer" }, { name: "HP" }, { name: "Dell" }, { name: "LG" }, { name: "Gigabyte" }, { name: "Masstel" }, { name: "Laptop văn phòng" }, { name: "Laptop Gaming" }, { name: "Laptop mỏng nhẹ" }, { name: "Laptop đồ họa – kỹ thuật" }, { name: "Laptop sinh viên" }, { name: "Laptop cảm ứng" }, { name: "Laptop AI" }
    ]
  },
  {
    name: "PC & Máy tính", icon: "laptop",
    children: [
      { name: "PC Gaming" }, { name: "PC văn phòng" }, { name: "PC đồ họa" }, { name: "Mini PC" }, { name: "All-in-One PC" }, { name: "Linh kiện PC" }
    ]
  },
  {
    name: "Màn hình", icon: "laptop",
    children: [
      { name: "Màn hình Gaming" }, { name: "Màn hình văn phòng" }, { name: "Màn hình đồ họa" }, { name: "Màn hình cong" }, { name: "Màn hình Ultrawide" }, { name: "Màn hình 4K" }, { name: "Màn hình Portable" }
    ]
  },
  {
    name: "Máy in", icon: "laptop",
    children: [
      { name: "Máy in Laser" }, { name: "Máy in phun" }, { name: "Máy in màu" }, { name: "Máy in văn phòng" }, { name: "Máy in đa chức năng" }
    ]
  },
  {
    name: "Âm thanh", icon: "headphones",
    children: [
      {
        name: "Tai nghe",
        children: [{ name: "Tai nghe Bluetooth" }, { name: "Tai nghe có dây" }, { name: "Tai nghe chụp tai" }, { name: "Tai nghe nhét tai" }, { name: "Tai nghe Gaming" }, { name: "Tai nghe thể thao" }, { name: "Tai nghe kiểm âm" }, { name: "Tai nghe phiên dịch" }]
      },
      {
        name: "Loa",
        children: [{ name: "Loa Bluetooth" }, { name: "Loa Soundbar" }, { name: "Loa Karaoke" }, { name: "Loa vi tính" }]
      },
      {
        name: "Micro",
        children: [{ name: "Micro thu âm" }, { name: "Micro Karaoke" }]
      },
      { name: "Đầu đĩa than" }
    ]
  },
  {
    name: "Đồng hồ thông minh", icon: "watch",
    children: [
      { name: "Apple Watch" }, { name: "Samsung" }, { name: "Xiaomi" }, { name: "Huawei" }, { name: "Garmin" }, { name: "Amazfit" }, { name: "Kieslect" }, { name: "Coros" }, { name: "Mibro" }, { name: "Kospet" }, { name: "Smartwatch trẻ em" }, { name: "Smartwatch thể thao" }, { name: "Vòng đeo tay thông minh" }
    ]
  },
  {
    name: "Camera & Thiết bị quay", icon: "smartphone",
    children: [
      {
        name: "Camera an ninh",
        children: [{ name: "Camera trong nhà" }, { name: "Camera ngoài trời" }, { name: "Camera 360°" }]
      },
      { name: "Camera hành trình" },
      { name: "Action Camera" },
      {
        name: "Máy ảnh",
        children: [{ name: "Mirrorless" }, { name: "DSLR" }]
      },
      { name: "Flycam" }, { name: "Gimbal" }, { name: "Tripod" }, { name: "Webcam" }
    ]
  },
  {
    name: "Gaming", icon: "headphones",
    children: [
      { name: "PlayStation" }, { name: "Tay cầm chơi game" }, { name: "Gaming Mouse" }, { name: "Gaming Keyboard" }, { name: "Gaming Headset" }, { name: "Gaming Controller" }, { name: "Gaming Monitor" }, { name: "Gaming Gear" }, { name: "Phụ kiện Gaming" }
    ]
  },
  {
    name: "Phụ kiện điện thoại & Tablet", icon: "smartphone",
    children: [
      { name: "Phụ kiện Apple" }, { name: "Ốp lưng" }, { name: "Bao da" }, { name: "Dán màn hình" }, { name: "Cáp" }, { name: "Củ sạc" }, { name: "Bộ sạc" }, { name: "Sạc không dây" }, { name: "Pin sạc dự phòng" }, { name: "Thẻ nhớ" }, { name: "USB" }, { name: "SIM" }, { name: "AppleCare" }, { name: "Bút cảm ứng" }
    ]
  },
  {
    name: "Phụ kiện Laptop & Máy tính", icon: "laptop",
    children: [
      { name: "Chuột" }, { name: "Bàn phím" }, { name: "Túi chống sốc" }, { name: "Balo laptop" }, { name: "Giá đỡ laptop" }, { name: "Đế tản nhiệt" }, { name: "Lót chuột" }, { name: "Webcam" }, { name: "Bộ vệ sinh" }, { name: "Sạc laptop" }, { name: "Hub USB" }, { name: "Docking Station" }, { name: "USB Adapter" }, { name: "Bút trình chiếu" }
    ]
  },
  {
    name: "Thiết bị lưu trữ", icon: "laptop",
    children: [
      { name: "HDD" }, { name: "SSD" }, { name: "SSD Portable" }, { name: "USB Flash Drive" }, { name: "Thẻ nhớ" }, { name: "Ổ cứng di động" }, { name: "NAS" }
    ]
  }
];

const generateSlug = (name: string) => {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
};

async function createNode(node: any, parentId: string | null = null, sortOrder: number = 0) {
  const cat = await prisma.category.create({
    data: {
      name: node.name,
      slug: generateSlug(node.name),
      icon: node.icon || null,
      parentId: parentId,
      sortOrder: sortOrder,
      isActive: true
    }
  });

  if (node.children && node.children.length > 0) {
    for (let i = 0; i < node.children.length; i++) {
      await createNode(node.children[i], cat.id, i);
    }
  }
}

async function seed() {
  console.log('Deleting existing categories...');
  // Delete all categories (onDelete Cascade should handle nested)
  await prisma.category.deleteMany({});
  
  console.log('Seeding new categories...');
  for (let i = 0; i < categoryData.length; i++) {
    await createNode(categoryData[i], null, i);
  }
  
  console.log('Seeding completed successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
