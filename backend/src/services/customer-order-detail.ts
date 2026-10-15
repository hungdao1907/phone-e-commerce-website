/** Presentation of stored transaction values only; never applies current catalog pricing. */
export function presentCustomerOrderDetail(order: any, customerId: string) {
  if (!order || order.customerId !== customerId) throw new Error('Order ownership mismatch.');
  const moneyFields = [order.totalAmount, order.discountAmount, order.shippingFee];
  if (!moneyFields.every(value => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error('Invalid stored order totals.');
  }
  const subtotal = order.totalAmount + order.discountAmount - order.shippingFee;
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || !Array.isArray(order.items)) {
    throw new Error('Invalid stored order snapshot.');
  }
  const items = order.items.map((item: any) => {
    const lineTotal = item.unitPrice * item.quantity;
    if (!Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0
      || !Number.isSafeInteger(item.quantity) || item.quantity <= 0
      || !Number.isSafeInteger(lineTotal)) throw new Error('Invalid stored order item.');
    return { ...item, lineTotal };
  });
  return { ...order, subtotal, items };
}
