/**
 * Seed script: backfill Notification records từ dữ liệu Orders, Reviews, Disputes và
 * ProductVariants (tồn kho thấp) hiện có trong database.
 *
 * Chạy: npx ts-node scripts/seed-notifications.ts
 * (hoặc: node -r ts-node/register scripts/seed-notifications.ts)
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOW_STOCK_THRESHOLD = 10;

async function main() {
  console.log('🔔 Bắt đầu backfill notifications...\n');

  // Xoá hết notification cũ (nếu chạy lại script) — chỉ khi DB chưa có data thật
  const existing = await prisma.notification.count();
  if (existing > 0) {
    console.log(`ℹ️  Đã có ${existing} notifications trong DB. Bỏ qua backfill.`);
    console.log('   (Xoá bảng notifications thủ công nếu muốn chạy lại seed)\n');
    return;
  }

  const notificationsToCreate: {
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    referenceType: string | null;
    referenceId: string | null;
    createdAt: Date;
  }[] = [];

  // ─── Orders ────────────────────────────────────────────────────────────────
  const orders = await prisma.order.findMany({
    include: { customer: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  for (const order of orders) {
    notificationsToCreate.push({
      type: 'ORDER',
      title: `Đơn hàng mới #${order.orderCode}`,
      message: `${order.customer?.fullName || 'Khách hàng'} vừa đặt hàng. Tổng: ${new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ.`,
      isRead: true, // backfill → coi như đã đọc
      referenceType: 'Order',
      referenceId: order.id,
      createdAt: order.createdAt,
    });
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────
  const reviews = await prisma.review.findMany({
    include: {
      customer: { select: { fullName: true } },
      order: { select: { orderCode: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  for (const review of reviews) {
    const stars = '⭐'.repeat(review.rating);
    notificationsToCreate.push({
      type: 'REVIEW',
      title: `Đánh giá mới ${stars}`,
      message: `${review.customer?.fullName || 'Khách hàng'} vừa đánh giá đơn hàng #${review.order?.orderCode}${review.comment ? ': ' + review.comment.slice(0, 60) : ''}.`,
      isRead: true,
      referenceType: 'Review',
      referenceId: review.id,
      createdAt: review.createdAt,
    });
  }

  // ─── Disputes ──────────────────────────────────────────────────────────────
  const disputes = await prisma.dispute.findMany({
    include: {
      customer: { select: { fullName: true } },
      order: { select: { orderCode: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  for (const dispute of disputes) {
    notificationsToCreate.push({
      type: 'DISPUTE',
      title: `Khiếu nại mới từ ${dispute.customer?.fullName || 'khách hàng'}`,
      message: `Đơn hàng #${dispute.order?.orderCode} — ${dispute.reason}: ${dispute.description.slice(0, 80)}`,
      isRead: true,
      referenceType: 'Dispute',
      referenceId: dispute.id,
      createdAt: dispute.createdAt,
    });
  }

  // ─── Inventory alerts (low stock) ─────────────────────────────────────────
  const lowStockVariants = await prisma.productVariant.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD } },
    include: { product: { select: { id: true, name: true } } },
    orderBy: { stock: 'asc' },
    take: 20,
  });

  for (const variant of lowStockVariants) {
    const attrString = Object.values(variant.attributes as Record<string, string>).join(' · ');
    notificationsToCreate.push({
      type: 'INVENTORY',
      title: `Cảnh báo tồn kho thấp`,
      message: `${variant.product.name} (${attrString || 'Mặc định'}) chỉ còn ${variant.stock} sản phẩm.`,
      isRead: true,
      referenceType: 'Product',
      referenceId: variant.product.id,
      createdAt: variant.updatedAt,
    });
  }

  // Sắp xếp theo thời gian để đúng thứ tự
  notificationsToCreate.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (notificationsToCreate.length === 0) {
    console.log('⚠️  Không tìm thấy dữ liệu nghiệp vụ để tạo notifications.');
    return;
  }

  console.log(`📦 Chuẩn bị tạo ${notificationsToCreate.length} notifications:`);
  console.log(`   - Orders:    ${orders.length}`);
  console.log(`   - Reviews:   ${reviews.length}`);
  console.log(`   - Disputes:  ${disputes.length}`);
  console.log(`   - Inventory: ${lowStockVariants.length}`);
  console.log('');

  // Batch insert
  const result = await prisma.notification.createMany({
    data: notificationsToCreate,
    skipDuplicates: true,
  });

  console.log(`✅ Đã tạo ${result.count} notifications thành công!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
