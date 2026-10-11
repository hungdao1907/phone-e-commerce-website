import type { CustomerQuotationCreateRequest } from './quotation-api';

export type QuotationCreateIntent = { fingerprint: string; key: string };
export type QuotationCreateRecoveryMarker = { key: string; createdAt: number };

export const QUOTATION_CREATE_RECOVERY_STORAGE_KEY = 'webphone_quotation_create_recovery_v1';

function browserSessionStorage(): Storage | null {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

/** Stores only the opaque idempotency key and timestamp, never the request payload or credentials. */
export function saveQuotationCreateRecoveryMarker(
  marker: QuotationCreateRecoveryMarker,
  storage: Pick<Storage, 'setItem'> | null = browserSessionStorage(),
): boolean {
  if (!storage || !/^[A-Za-z0-9._~-]{16,128}$/.test(marker.key) || !Number.isSafeInteger(marker.createdAt)) return false;
  try {
    storage.setItem(QUOTATION_CREATE_RECOVERY_STORAGE_KEY, JSON.stringify({ key: marker.key, createdAt: marker.createdAt }));
    return true;
  } catch { return false; }
}

export function loadQuotationCreateRecoveryMarker(
  storage: Pick<Storage, 'getItem' | 'removeItem'> | null = browserSessionStorage(),
): QuotationCreateRecoveryMarker | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(QUOTATION_CREATE_RECOVERY_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.key !== 'string' || !/^[A-Za-z0-9._~-]{16,128}$/.test(value.key)
      || !Number.isSafeInteger(value.createdAt)) {
      storage.removeItem(QUOTATION_CREATE_RECOVERY_STORAGE_KEY);
      return null;
    }
    return { key: value.key, createdAt: value.createdAt as number };
  } catch { return null; }
}

export function clearQuotationCreateRecoveryMarker(
  storage: Pick<Storage, 'removeItem'> | null = browserSessionStorage(),
): void {
  try { storage?.removeItem(QUOTATION_CREATE_RECOVERY_STORAGE_KEY); } catch { /* best-effort privacy cleanup */ }
}

/** Browser CSPRNG only; never fall back to Math.random or persistent browser storage. */
export function generateQuotationCreateKey(cryptoProvider: Pick<Crypto, 'getRandomValues'> = globalThis.crypto): string {
  if (!cryptoProvider?.getRandomValues) throw new Error('A secure random generator is unavailable.');
  const bytes = cryptoProvider.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Used only in component memory to keep retries on the same payload/key pair. */
export function quotationCreateFingerprint(input: CustomerQuotationCreateRequest): string {
  const items = [...input.items]
    .map(item => ({ variantId: item.variantId.trim(), quantity: item.quantity }))
    .sort((left, right) => left.variantId.localeCompare(right.variantId));
  return JSON.stringify({
    items,
    shippingAddress: input.shippingAddress.trim(),
    shippingPhone: input.shippingPhone.trim(),
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod,
  });
}

export function getQuotationCreateIntent(
  previous: QuotationCreateIntent | null,
  input: CustomerQuotationCreateRequest,
  createKey: () => string = generateQuotationCreateKey,
): QuotationCreateIntent {
  const fingerprint = quotationCreateFingerprint(input);
  return previous?.fingerprint === fingerprint
    ? previous
    : { fingerprint, key: createKey() };
}
