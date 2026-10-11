export type CustomerOrderDetail = {
  id: string; customerId: string; orderCode: string; createdAt: string; status: string;
  paymentMethod: string; paymentStatus: string; shippingAddress: string; shippingPhone: string;
  subtotal: number; discountAmount: number; shippingFee: number; totalAmount: number; note?: string | null;
  items: Array<{ id: string; productName: string; variantInfo: string; quantity: number; unitPrice: number; lineTotal: number }>;
};
export class CustomerOrderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function fetchCustomerOrderDetail(
  orderId: string, token: string, customerId: string,
  options: { baseUrl: string; signal?: AbortSignal; fetcher?: typeof fetch },
): Promise<CustomerOrderDetail> {
  if (!orderId || !token || !customerId) throw new CustomerOrderError(401, 'Vui lòng đăng nhập bằng tài khoản khách hàng.');
  const response = await (options.fetcher || fetch)(`${options.baseUrl.replace(/\/$/, '')}/api/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: options.signal, cache: 'no-store',
  });
  if (!response.ok) {
    const message = response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : response.status === 403 || response.status === 404 ? 'Không tìm thấy đơn hàng thuộc tài khoản của bạn.'
        : 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại.';
    throw new CustomerOrderError(response.status, message);
  }
  const order = await response.json() as CustomerOrderDetail;
  if (order?.id !== orderId || order.customerId !== customerId) throw new CustomerOrderError(403, 'Không tìm thấy đơn hàng thuộc tài khoản của bạn.');
  if (!Array.isArray(order.items) || ![order.subtotal, order.discountAmount, order.shippingFee, order.totalAmount]
    .every(value => Number.isSafeInteger(value) && value >= 0)) throw new CustomerOrderError(502, 'Dữ liệu đơn hàng chưa đầy đủ.');
  return order;
}
export function orderStatusLabel(status: string): string {
  return ({ pending: 'Chờ xác nhận', pending_payment: 'Chờ thanh toán', confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý', shipping: 'Đang giao hàng', delivered: 'Đã giao hàng',
    completed: 'Hoàn thành', cancelled: 'Đã hủy', returned: 'Đã hoàn trả' } as Record<string, string>)[status.toLowerCase()] || status;
}
