import type { CustomerQuotationCreateRequest } from './quotation-api';

export type QuotationCreateIntent = { fingerprint: string; key: string };
export type QuotationCreateRecoveryMarker = { key: string; createdAt: number; accountId?: string };

export const QUOTATION_CREATE_RECOVERY_STORAGE_KEY = 'webphone_quotation_create_recovery_v1';
const recoveryStorageKey = (accountId?: string) => accountId
  ? `${QUOTATION_CREATE_RECOVERY_STORAGE_KEY}:${encodeURIComponent(accountId)}` : QUOTATION_CREATE_RECOVERY_STORAGE_KEY;

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
    storage.setItem(recoveryStorageKey(marker.accountId), JSON.stringify({ key: marker.key, createdAt: marker.createdAt,
      ...(marker.accountId ? { accountId: marker.accountId } : {}) }));
    return true;
  } catch { return false; }
}

export function loadQuotationCreateRecoveryMarker(
  storage: Pick<Storage, 'getItem' | 'removeItem'> | null = browserSessionStorage(),
  accountId?: string,
): QuotationCreateRecoveryMarker | null {
  if (!storage) return null;
  try {
    let recordKey = recoveryStorageKey(accountId);
    let raw = storage.getItem(recordKey);
    // Previous deployed clients stored no account metadata. Keep that uncertain
    // result blocking new POSTs until the current JWT can establish ownership.
    if (!raw && accountId) {
      recordKey = QUOTATION_CREATE_RECOVERY_STORAGE_KEY;
      raw = storage.getItem(recordKey);
    }
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.key !== 'string' || !/^[A-Za-z0-9._~-]{16,128}$/.test(value.key)
      || !Number.isSafeInteger(value.createdAt)) {
      storage.removeItem(recordKey);
      return null;
    }
    if (accountId && value.accountId !== accountId
      && (recordKey !== QUOTATION_CREATE_RECOVERY_STORAGE_KEY || typeof value.accountId === 'string')) return null;
    return { key: value.key, createdAt: value.createdAt as number,
      ...(typeof value.accountId === 'string' ? { accountId: value.accountId } : {}) };
  } catch { return null; }
}

export function clearQuotationCreateRecoveryMarker(
  storage: Pick<Storage, 'removeItem'> | null = browserSessionStorage(),
  accountId?: string,
): void {
  try { storage?.removeItem(recoveryStorageKey(accountId)); } catch { /* best-effort cleanup after confirmed success */ }
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
    ...(input.recipientName === undefined ? {} : { recipientName: input.recipientName.trim() }),
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
