const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const disputes = await prisma.dispute.findMany();
  for (const dispute of disputes) {
    // Find an order item for this order
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId: dispute.orderId },
      include: { variant: { include: { product: true } } }
    });

    if (orderItem) {
      await prisma.$executeRaw`
        UPDATE "Dispute"
        SET "orderItemId" = ${orderItem.id},
            "variantId" = ${orderItem.variantId},
            "productId" = ${orderItem.variant.productId}
        WHERE id = ${dispute.id}
      `;
      console.log(`Updated dispute ${dispute.id}`);
    } else {
      await prisma.$executeRaw`DELETE FROM "Dispute" WHERE id = ${dispute.id}`;
      console.log(`Deleted dispute ${dispute.id} (no order items)`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
