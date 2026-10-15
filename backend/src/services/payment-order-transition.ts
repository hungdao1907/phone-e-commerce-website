/** Conditional UPDATE shares the Order lock with cancellation; late payments cannot reopen cancelled Orders. */
export async function markPendingOrderPaid(transaction: any, orderId: string): Promise<boolean> {
  const result = await transaction.order.updateMany({ where: {
    id: orderId, status: { in: ['pending','pending_payment','confirmed','processing'] },
    paymentMethod: 'BANK_TRANSFER', paymentStatus: { notIn: ['PAID','REFUNDED'] },
  }, data: { status: 'confirmed', paymentStatus: 'PAID' } });
  return result.count === 1;
}
