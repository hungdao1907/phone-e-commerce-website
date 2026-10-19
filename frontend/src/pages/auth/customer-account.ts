export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
export function isEmail(value: string): boolean { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function normalizePhone(value: string): string | null {
  const phone = value.trim().replace(/[\s().-]/g, '').replace(/^(?:\+84|0084)/, '0');
  return /^0[35789]\d{8}$/.test(phone) ? phone : null;
}
export function passwordError(value: string): string | null {
  return value.length >= 8 && new TextEncoder().encode(value).length <= 72 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)
    ? null : 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số; tối đa 72 byte.';
}
export function validateRegistration(values: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }, agreed: boolean) {
  const errors: Record<string, string> = {};
  const fullName = values.fullName.trim();
  const email = normalizeEmail(values.email);
  const phone = normalizePhone(values.phone);
  if (!fullName || fullName.length > 150) errors.fullName = 'Vui lòng nhập họ tên hợp lệ (tối đa 150 ký tự).';
  if (!isEmail(email)) errors.email = 'Email không hợp lệ.';
  if (!phone) errors.phone = 'Số điện thoại Việt Nam không hợp lệ.';
  const invalidPassword = passwordError(values.password);
  if (invalidPassword) errors.password = invalidPassword;
  if (!values.confirmPassword || values.password !== values.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  if (!agreed) errors.agreed = 'Bạn phải đồng ý với Điều khoản sử dụng.';
  return { errors, payload: { fullName, email, phone: phone || '', password: values.password } };
}
