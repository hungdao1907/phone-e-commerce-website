import { Prisma, PrismaClient } from '@prisma/client';

export class CustomerDeletionError extends Error {
  constructor(
    public readonly kind: 'NOT_FOUND' | 'PROTECTED_HISTORY',
    message: string,
  ) {
    super(message);
    this.name = 'CustomerDeletionError';
  }
}

/**
 * Hard-delete only a Customer with no dependent business, review, dispute,
 * quotation, or wishlist records. The checks and delete share one serializable
 * transaction; database foreign keys remain the final race-safety boundary.
 */
export async function deleteCustomerSafely(database: PrismaClient, customerId: string): Promise<void> {
  await database.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      throw new CustomerDeletionError('NOT_FOUND', 'Không tìm thấy khách hàng.');
    }

    const [orders, payments, invoices, quotations, disputes, reviews, wishlists] = await Promise.all([
      tx.order.count({ where: { customerId } }),
      tx.payment.count({ where: { order: { customerId } } }),
      tx.invoice.count({ where: { order: { customerId } } }),
      tx.quotation.count({ where: { customerId } }),
      tx.dispute.count({ where: { customerId } }),
      tx.review.count({ where: { customerId } }),
      tx.wishlist.count({ where: { customerId } }),
    ]);

    if (orders + payments + invoices + quotations + disputes + reviews + wishlists > 0) {
      throw new CustomerDeletionError(
        'PROTECTED_HISTORY',
        'Không thể xóa khách hàng vì còn đơn hàng hoặc dữ liệu liên quan cần được bảo toàn.',
      );
    }

    await tx.customer.delete({ where: { id: customerId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export function isCustomerForeignKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2003');
}
