export function normalizeCustomerEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isCustomerEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeVietnamPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.trim().replace(/[\s().-]/g, '').replace(/^(?:\+84|0084)/, '0');
  return /^0[35789]\d{8}$/.test(phone) ? phone : null;
}

// bcrypt compares at most 72 bytes. Reject longer passwords rather than silently truncating.
export function customerPasswordError(value: unknown): string | null {
  return typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72
    && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)
    ? null : 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số; tối đa 72 byte.';
}

export function validateCustomerRegistration(body: Record<string, unknown>) {
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = normalizeCustomerEmail(body.email);
  const phone = normalizeVietnamPhone(body.phone);
  const errors: Record<string, string> = {};
  if (!fullName || fullName.length > 150) errors.fullName = 'Vui lòng nhập họ tên hợp lệ (tối đa 150 ký tự).';
  if (!isCustomerEmail(email)) errors.email = 'Email không hợp lệ.';
  if (!phone) errors.phone = 'Số điện thoại Việt Nam không hợp lệ.';
  const passwordError = customerPasswordError(body.password);
  if (passwordError) errors.password = passwordError;
  return { fullName, email, phone: phone || '', password: body.password as string, errors };
}
