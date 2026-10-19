import { Prisma, PrismaClient } from '@prisma/client';

export class OrderDeletionError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

const expectedForeignKeys = new Set([
  'OrderItem:orderId:Order', 'Payment:orderId:Order', 'Invoice:orderId:Order',
  'Review:orderId:Order', 'Dispute:orderId:Order', 'CheckoutIdempotency:orderId:Order',
  'Review:orderItemId:OrderItem', 'Dispute:orderItemId:OrderItem',
]);

/** A deliberately narrow cleanup path: cancellation handles stock, deletion never does. */
export async function deleteOrderSafely(database: PrismaClient, id: string, confirmationCode: unknown) {
  if (!id || typeof confirmationCode !== 'string' || !confirmationCode) {
    throw new OrderDeletionError(400, 'ORDER_DELETE_CONFIRMATION_REQUIRED', 'Vui lòng nhập đúng mã đơn hàng để xác nhận xóa.');
  }
  try {
    return await database.$transaction(async tx => {
      // Serializes with cancellation, status/payment updates and non-FK reference writers.
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`;
      // A Review may reference just OrderItem (nullable orderId). Lock children too,
      // before checking history, so their CASCADE cannot erase a newly inserted review.
      await tx.$queryRaw`SELECT "id" FROM "OrderItem" WHERE "orderId" = ${id} ORDER BY "id" FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "orderId" = ${id} ORDER BY "id" FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id }, include: { items: { select: { id: true } }, Payment: true, Invoice: true } });
      if (!order) throw new OrderDeletionError(404, 'ORDER_NOT_FOUND', 'Đơn hàng không tồn tại hoặc đã được xóa.');
      if (confirmationCode !== order.orderCode) throw new OrderDeletionError(400, 'ORDER_DELETE_CONFIRMATION_MISMATCH', 'Mã xác nhận không khớp mã đơn hàng.');

      if (order.quotationId) throw new OrderDeletionError(409, 'ORDER_HAS_QUOTATION', 'Đơn hàng liên kết báo giá. Không thể xóa vì phải giữ nguyên lịch sử và trạng thái Quotation.');
      if (order.Invoice) throw new OrderDeletionError(409, 'ORDER_HAS_INVOICE', 'Đơn hàng có hóa đơn. Chức năng này không xóa hóa đơn hoặc lịch sử kế toán.');
      if (!['PENDING', 'UNPAID', 'EXPIRED', 'FAILED', 'CANCELLED'].includes(order.paymentStatus.toUpperCase())
        || order.Payment.some(p => !['PENDING', 'EXPIRED', 'FAILED'].includes(p.status.toUpperCase()) || p.paidAt || p.transactionCode)) {
        throw new OrderDeletionError(409, 'ORDER_HAS_SETTLEMENT', 'Đơn hàng đã thanh toán, hoàn tiền hoặc có dấu vết giao dịch. Cần xử lý tài chính riêng; không phát sinh hoàn tiền ở đây.');
      }
      if (order.status !== 'cancelled') throw new OrderDeletionError(409, 'ORDER_MUST_BE_CANCELLED', 'Chỉ xóa đơn đã hủy, chưa thanh toán. Hãy hủy qua quy trình hiện có để hoàn kho đúng một lần trước.');

      // Detect schema drift rather than relying on an unreviewed cascade or failing halfway.
      const keys = await tx.$queryRaw<Array<{ child_schema: string; child_table: string; parent_table: string; child_columns: string[]; parent_columns: string[] }>>`
        SELECT ns.nspname::text AS child_schema, child.relname::text AS child_table, parent.relname::text AS parent_table,
          ARRAY(SELECT a.attname::text FROM unnest(c.conkey) AS k(attnum)
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY a.attnum) AS child_columns,
          ARRAY(SELECT a.attname::text FROM unnest(c.confkey) AS k(attnum)
            JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum ORDER BY a.attnum) AS parent_columns
        FROM pg_constraint c JOIN pg_class child ON child.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = child.relnamespace JOIN pg_class parent ON parent.oid = c.confrelid
        WHERE c.contype = 'f' AND c.confrelid IN ('"Order"'::regclass, '"OrderItem"'::regclass)`;
      const found = new Set(keys.map(key => `${key.child_table}:${key.child_columns.join(',')}:${key.parent_table}`));
      if (found.size !== expectedForeignKeys.size || keys.some(key => key.child_schema !== 'public' || key.parent_columns.join(',') !== 'id'
        || !expectedForeignKeys.has(`${key.child_table}:${key.child_columns.join(',')}:${key.parent_table}`))) {
        throw new OrderDeletionError(409, 'ORDER_UNSUPPORTED_DEPENDENCY', 'Cấu trúc khóa ngoại không khớp phạm vi đã hỗ trợ. Chưa xóa dữ liệu; cần kiểm tra quan hệ trước.');
      }
      const itemIds = order.items.map(item => item.id);
      const linked = { OR: [{ orderId: id }, { orderItemId: { in: itemIds } }] };
      const [reviews, disputes, bankTransaction] = await Promise.all([
        tx.review.count({ where: linked }), tx.dispute.count({ where: linked }),
        tx.bankTransaction.findFirst({ where: { OR: [
          { orderId: id }, { orderCode: { equals: order.orderCode, mode: 'insensitive' } },
          { description: { contains: order.orderCode, mode: 'insensitive' } },
        ] }, select: { id: true } }),
      ]);
      if (bankTransaction) throw new OrderDeletionError(409, 'ORDER_HAS_BANK_TRANSACTION', 'Đơn hàng có giao dịch ngân hàng cần bảo toàn/đối soát. Không xóa hoặc sửa giao dịch ngân hàng.');
      if (reviews || disputes) throw new OrderDeletionError(409, 'ORDER_HAS_CUSTOMER_HISTORY', `Đơn hàng còn ${reviews} đánh giá và ${disputes} khiếu nại. Cần xử lý lịch sử khách hàng theo quy trình riêng trước khi xóa.`);

      // Any non-standard reference is preserved for manual review; delete only typed Order notifications.
      const ambiguous = await tx.notification.count({ where: { referenceId: id, NOT: { referenceType: { equals: 'Order', mode: 'insensitive' } } } });
      const untyped = await tx.notification.count({ where: { referenceId: id, referenceType: null } });
      const indirect = await tx.notification.count({ where: { referenceId: { in: [
        order.orderCode, ...itemIds, ...order.Payment.map(payment => payment.id),
      ] } } });
      if (ambiguous || untyped || indirect) throw new OrderDeletionError(409, 'ORDER_AMBIGUOUS_NOTIFICATION', 'Có thông báo tham chiếu đơn hàng hoặc dữ liệu con chưa xác định được loại. Cần kiểm tra trước khi xóa.');

      const notifications = await tx.notification.deleteMany({ where: { referenceId: id, referenceType: { equals: 'Order', mode: 'insensitive' } } });
      // Retain the Customer/key/request digests: retrying an old checkout key returns 410.
      await tx.checkoutIdempotency.updateMany({ where: { orderId: id }, data: { orderId: null } });
      const payments = await tx.payment.deleteMany({ where: { orderId: id } });
      const items = await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
      return { id, orderCode: order.orderCode, deleted: true, removed: { items: items.count, payments: payments.count, notifications: notifications.count } };
    // READ COMMITTED is intentional: after waiting for a non-FK writer's Order
    // lock, dependency reads must see its committed bank event/notification.
    // A snapshot taken before that wait can miss rows when those writers use
    // READ COMMITTED. Parent/child FOR UPDATE locks protect all actual FK writes.
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  } catch (error: any) {
    if (['P2003', 'P2014', 'P2034', 'P2025', 'P2028'].includes(error?.code)
      || (error?.code === 'P2010' && ['40001', '40P01', '55P03'].includes(error?.meta?.code))) {
      throw new OrderDeletionError(409, 'ORDER_DELETE_CONFLICT', 'Đơn hàng đang được xử lý hoặc có dữ liệu phụ thuộc mới. Toàn bộ thao tác đã rollback; vui lòng tải lại.');
    }
    throw error;
  }
}
