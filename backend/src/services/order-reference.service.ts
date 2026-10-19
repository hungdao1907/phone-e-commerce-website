/** BankTransaction/Notification have no FK: every order-reference write must hold this lock through commit. */
export async function lockExistingOrderReference(transaction: any, orderId: string): Promise<boolean> {
  const rows = await transaction.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR KEY SHARE`;
  return rows.length === 1;
}

export async function createOrderNotificationSafely(database: any, orderId: string, data: Record<string, unknown>) {
  return database.$transaction(async (tx: any) => {
    if (!await lockExistingOrderReference(tx, orderId)) return null;
    return tx.notification.create({ data: { ...data, referenceType: 'Order', referenceId: orderId } });
  });
}

/** Keep actual bank events, but never persist a dangling Order ID after cleanup wins. */
export async function recordBankEventWithOrderReference(transaction: any, orderId: string, data: Record<string, unknown>) {
  const orderExists = await lockExistingOrderReference(transaction, orderId);
  const event = await transaction.bankTransaction.create({ data: { ...data, orderId: orderExists ? orderId : null,
    status: orderExists ? data.status : 'UNMATCHED' } });
  return { orderExists, event };
}
