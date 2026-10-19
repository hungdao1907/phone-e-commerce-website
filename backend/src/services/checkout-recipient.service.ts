import { isCustomerEmail, normalizeCustomerEmail } from './customer-account-policy';

export class CheckoutRecipientError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = 'CheckoutRecipientError';
  }
}

/** Resolve account identity from PostgreSQL; request fields are delivery snapshots only. */
export async function resolveCheckoutRecipient(
  database: { customer: { findUnique(args: any): Promise<any> } },
  customerId: string,
  requestedName: unknown,
): Promise<{ recipientName: string }> {
  if (requestedName !== undefined && (typeof requestedName !== 'string'
    || !requestedName.trim() || requestedName.trim().length > 200)) {
    throw new CheckoutRecipientError('INVALID_RECIPIENT_NAME', 400, 'Tên người nhận cần từ 1 đến 200 ký tự.');
  }
  const customer = await database.customer.findUnique({
    where: { id: customerId },
    select: { id: true, fullName: true, email: true, verified: true },
  });
  if (!customer || customer.id !== customerId || customer.verified !== true) {
    throw new CheckoutRecipientError('CUSTOMER_PROFILE_UNAVAILABLE', 403, 'Vui lòng đăng nhập bằng tài khoản Customer đã xác minh.');
  }
  if (!isCustomerEmail(normalizeCustomerEmail(customer.email))) {
    throw new CheckoutRecipientError('CUSTOMER_EMAIL_INVALID', 400, 'Email tài khoản không hợp lệ. Vui lòng liên hệ cửa hàng.');
  }
  const recipientName = requestedName === undefined ? customer.fullName?.trim() : (requestedName as string).trim();
  if (!recipientName || recipientName.length > 200) {
    throw new CheckoutRecipientError('INVALID_RECIPIENT_NAME', 400, 'Vui lòng nhập tên người nhận hợp lệ.');
  }
  return { recipientName };
}
