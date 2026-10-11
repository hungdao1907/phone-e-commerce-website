export type CheckoutIntentPayload = {
  items: Array<{ variantId: string; quantity: number }>;
  promoCode?: string | null;
  deliveryMethod: 'delivery' | 'pickup';
  paymentMethod?: string | null;
  shippingAddress: string;
  shippingPhone: string;
  note?: string | null;
};

export type CheckoutIntent = { key: string; estimatedDelivery: string };

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type CryptoLike = Pick<Crypto, 'subtle' | 'getRandomValues'>;

function canonicalIntent(customerId: string, payload: CheckoutIntentPayload): string {
  if (!customerId || !Array.isArray(payload.items) || !payload.items.length) {
    throw new Error('Checkout intent is missing its customer or items.');
  }
  const quantities = new Map<string, number>();
  for (const item of payload.items) {
    if (!item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Checkout intent contains an invalid item.');
    }
    const total = (quantities.get(item.variantId) || 0) + item.quantity;
    if (!Number.isSafeInteger(total)) throw new Error('Checkout quantity exceeds the supported range.');
    quantities.set(item.variantId, total);
  }
  const normalized = {
    customerId,
    items: [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b)),
    promoCode: payload.promoCode?.trim().toLocaleUpperCase('en-US') || null,
    deliveryMethod: payload.deliveryMethod,
    paymentMethod: payload.paymentMethod === 'BANK' || payload.paymentMethod === 'BANK_TRANSFER'
      ? 'BANK_TRANSFER'
      : 'COD',
    shippingAddress: payload.shippingAddress,
    shippingPhone: payload.shippingPhone,
    note: payload.note ?? null,
  };
  return JSON.stringify(normalized);
}

function getStorage(storage?: StorageLike): StorageLike {
  try {
    const target = storage ?? globalThis.sessionStorage;
    if (!target) throw new Error('sessionStorage unavailable');
    return target;
  } catch {
    throw new Error('Secure checkout retry storage is unavailable. Please keep this page open and retry later.');
  }
}

function getCrypto(cryptoApi?: CryptoLike): CryptoLike {
  const target = cryptoApi ?? globalThis.crypto;
  if (!target?.subtle || !target.getRandomValues) {
    throw new Error('Secure checkout key generation is unavailable in this browser.');
  }
  return target;
}

async function sha256(value: string, cryptoApi: CryptoLike): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function newKey(cryptoApi: CryptoLike): string {
  return Array.from(cryptoApi.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function storageKey(customerId: string): string {
  return `webphone:checkout-intent:v1:${encodeURIComponent(customerId)}`;
}

/** Keeps key and estimated-delivery input stable for retries without persisting PII. */
export async function getCheckoutIntent(
  customerId: string,
  payload: CheckoutIntentPayload,
  storage?: StorageLike,
  cryptoApi?: CryptoLike,
  now = Date.now(),
): Promise<CheckoutIntent> {
  const targetStorage = getStorage(storage);
  const targetCrypto = getCrypto(cryptoApi);
  const recordKey = storageKey(customerId);
  const fingerprint = await sha256(canonicalIntent(customerId, payload), targetCrypto);

  try {
    const previous = targetStorage.getItem(recordKey);
    if (previous) {
      try {
        const parsed = JSON.parse(previous) as Partial<CheckoutIntent & { fingerprint: string }>;
        if (parsed.fingerprint === fingerprint
          && typeof parsed.key === 'string'
          && typeof parsed.estimatedDelivery === 'string') {
          return { key: parsed.key, estimatedDelivery: parsed.estimatedDelivery };
        }
      } catch {
        // Discard a corrupt record and generate a fresh checkout key below.
      }
    }

    const intent = {
      key: newKey(targetCrypto),
      estimatedDelivery: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    targetStorage.setItem(recordKey, JSON.stringify({ ...intent, fingerprint }));
    return intent;
  } catch {
    throw new Error('Could not persist the checkout retry key. No order request was sent.');
  }
}

export function clearCheckoutIntent(customerId: string, key: string, storage?: StorageLike): void {
  try {
    const targetStorage = getStorage(storage);
    const recordKey = storageKey(customerId);
    const previous = targetStorage.getItem(recordKey);
    if (previous && (JSON.parse(previous) as { key?: string }).key === key) {
      targetStorage.removeItem(recordKey);
    }
  } catch {
    // A stale key can only replay the already-created Order; it cannot create another.
  }
}
