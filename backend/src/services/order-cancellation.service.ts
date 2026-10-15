import { isOrderManagerRole } from '../routes/order-authorization';

export class OrderCancellationError extends Error {
  constructor(public readonly httpStatus: number, message: string) { super(message); }
}

/** Owner-approved Customer cancellation. All validation/restoration shares the Order row lock. */
export async function cancelUnpaidOrder(database: any, principal: { id?: string; role?: string }, id: string, input: { reason?: unknown; note?: unknown }) {
  if (!principal.id || !(isOrderManagerRole(principal.role) || principal.role === 'customer' || principal.role === 'staff')) {
    throw new OrderCancellationError(403, 'Không có quyền hủy đơn hàng.');
  }
  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0,500) : '';
  const note = typeof input.note === 'string' ? input.note.trim().slice(0,2000) : '';
  if (!reason) throw new OrderCancellationError(400, 'Vui lòng cung cấp lý do hủy đơn.');
  try {
    return await database.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id }, include: { items: true, Payment: true } });
      if (!order || (principal.role === 'customer' && order.customerId !== principal.id)
        || (principal.role === 'staff' && order.assignedStaffId !== principal.id)) {
        throw new OrderCancellationError(404, 'Không tìm thấy đơn hàng thuộc quyền truy cập.');
      }
      if (order.status === 'cancelled') return { id, replayed: true };
      const transfer = await tx.bankTransaction.findFirst({ where: { orderId: id, status: { in: ['MATCHED', 'MANUAL_REVIEW'] } }, select: { id: true } });
      if (['PAID','REFUNDED'].includes(order.paymentStatus.toUpperCase())
        || order.Payment.some((p: any) => ['PAID','REFUNDED'].includes(p.status)) || transfer) {
        throw new OrderCancellationError(409, 'Đơn hàng đã thanh toán hoặc có giao dịch cần đối soát. Vui lòng liên hệ cửa hàng.');
      }
      if (!['pending','pending_payment','confirmed','processing'].includes(order.status)) {
        throw new OrderCancellationError(409, 'Đơn đang giao hoặc đã hoàn tất, không thể tự hủy.');
      }
      const updated = await tx.order.updateMany({ where: { id, status: order.status, paymentStatus: order.paymentStatus }, data: {
        status: 'cancelled', note: [order.note, `Lý do hủy: ${reason}${note ? ' - '+note : ''}`].filter(Boolean).join('\n'),
      } });
      if (updated.count !== 1) throw new OrderCancellationError(409, 'Trạng thái đơn vừa thay đổi. Vui lòng tải lại.');
      const quantities = new Map<string,number>();
      for (const item of order.items) {
        if (!item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new OrderCancellationError(409, 'Dữ liệu tồn kho của đơn không hợp lệ.');
        const quantity=(quantities.get(item.variantId)||0)+item.quantity;
        if (!Number.isSafeInteger(quantity)) throw new OrderCancellationError(409, 'Số lượng của đơn không hợp lệ.');
        quantities.set(item.variantId,quantity);
      }
      for (const [variantId,quantity] of quantities) await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: quantity } } });
      await tx.payment.updateMany({ where: { orderId: id, status: 'PENDING' }, data: { status: 'EXPIRED' } });
      return { id, replayed: false };
    }, { isolationLevel: 'Serializable' });
  } catch (error: any) {
    if (['P2034','P2025','P2003'].includes(error?.code)) throw new OrderCancellationError(409, 'Đơn đang được xử lý. Không có thay đổi một phần; vui lòng tải lại.');
    throw error;
  }
}
