const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const specs = [
    { key: "Màn hình", value: "Dynamic AMOLED 2X 6.9 inch, Quad HD+, 120Hz, 2600 nits" },
    { key: "CPU", value: "Snapdragon 8 Elite Gen 5, 8 nhân 4.74GHz" },
    { key: "RAM", value: "12GB / 16GB" },
    { key: "Lưu trữ", value: "256GB / 512GB / 1TB" },
    { key: "Camera", value: "Sau: 200MP + 50MP + 50MP + 10MP; Trước: 12MP" },
    { key: "Pin", value: "5000mAh, Sạc nhanh 60W" },
    { key: "OS", value: "Android 15, One UI AI" },
    { key: "Kết nối", value: "Wi-Fi 7, Bluetooth 6.0, 5G, S Pen tích hợp" },
    { key: "Thiết kế", value: "Armor Aluminum, Kính Gorilla Armor 2, Kháng nước IP68" }
  ];
  
  await prisma.product.updateMany({
    where: { name: { contains: 'Samsung Galaxy S26 Ultra' } },
    data: { specifications: specs }
  });
  console.log("Updated S26 Ultra specs");
}
main().catch(console.error).finally(() => prisma.$disconnect());
