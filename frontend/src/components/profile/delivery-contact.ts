// Delivery contacts are separate from the immutable Customer registration identity.
export function deliveryContactFromProfile(profile: { fullName?: string; phone?: string; address?: string }) {
  let recipient: { recipientName?: unknown; recipientPhone?: unknown } = {};
  try {
    const parsed = JSON.parse(profile.address || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) recipient = parsed;
  } catch { /* Legacy addresses can be plain text. */ }
  return {
    fullName: typeof recipient.recipientName === 'string' && recipient.recipientName.trim() ? recipient.recipientName : profile.fullName || '',
    phone: typeof recipient.recipientPhone === 'string' && recipient.recipientPhone.trim() ? recipient.recipientPhone : profile.phone || '',
  };
}
