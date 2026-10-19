// Delivery contacts are separate from the immutable Customer registration identity.
export function savedDeliveryAddress(address: string = '') {
  let value: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(address);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed;
  } catch { return { address, city: '', district: '', ward: '' }; }
  const text = (key: string) => typeof value[key] === 'string' ? value[key] as string : '';
  const code = (key: string) => typeof value[key] === 'number' ? value[key] as number : undefined;
  return { address: text('detailAddress'), city: text('city'), district: text('district'), ward: text('ward'),
    cityCode: code('cityCode'), districtCode: code('districtCode'), wardCode: code('wardCode') };
}

export function validProfileEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function deliveryContactFromProfile(profile: { fullName?: string; phone?: string; address?: string }) {
  let recipient: { recipientName?: unknown; recipientPhone?: unknown } = {};
  try {
    const parsed = JSON.parse(profile.address || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) recipient = parsed;
  } catch { /* Legacy addresses can be plain text. */ }
  return {
    fullName: typeof recipient.recipientName === 'string' && recipient.recipientName.trim() ? recipient.recipientName.trim() : typeof profile.fullName === 'string' ? profile.fullName.trim() : '',
    phone: typeof recipient.recipientPhone === 'string' && recipient.recipientPhone.trim() ? recipient.recipientPhone.trim() : typeof profile.phone === 'string' ? profile.phone.trim() : '',
  };
}
