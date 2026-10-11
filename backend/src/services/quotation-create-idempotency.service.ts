import crypto from 'crypto';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._~-]{16,128}$/;
export const MAX_QUOTATION_CREATE_RETRIES = 3;

export class QuotationCreateIdempotencyError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'QuotationCreateIdempotencyError';
  }
}

type QuotationCreateTransaction = {
  quotationCreateIdempotency: {
    create(args: any): Promise<any>;
    findUnique(args: any): Promise<any>;
  };
};

export type QuotationCreateIdempotencyDatabase<TTransaction extends QuotationCreateTransaction> = {
  $transaction<T>(
    work: (transaction: TTransaction) => Promise<T>,
    options: { isolationLevel: 'Serializable' },
  ): Promise<T>;
  quotationCreateIdempotency: { findUnique(args: any): Promise<any> };
};

export type QuotationCreateFingerprintInput = {
  items: Array<{ variantId: string; quantity: number }>;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  deliveryMethod?: 'delivery' | 'pickup';
  promoCode?: string | null;
  note?: string | null;
  sourceSessionId?: string | null;
};

function digest(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Opaque per-intent token. Only its SHA-256 digest is persisted by the service. */
export function generateQuotationCreateIdempotencyKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashQuotationCreateIdempotencyKey(value: unknown): string {
  if (typeof value !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new QuotationCreateIdempotencyError(
      'IDEMPOTENCY_KEY_REQUIRED',
      400,
      'Send a valid Idempotency-Key for this quotation request.',
    );
  }
  return digest(value);
}

function normalizeRequest(customerId: string, input: QuotationCreateFingerprintInput) {
  if (!customerId || !Array.isArray(input?.items) || input.items.length === 0) {
    throw new QuotationCreateIdempotencyError('INVALID_QUOTATION_DTO', 400, 'Quotation request is invalid.');
  }
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    const variantId = typeof item?.variantId === 'string' ? item.variantId.trim() : '';
    if (!variantId || !Number.isSafeInteger(item?.quantity) || item.quantity <= 0) {
      throw new QuotationCreateIdempotencyError('INVALID_QUOTATION_DTO', 400, 'Quotation request is invalid.');
    }
    const next = (quantities.get(variantId) || 0) + item.quantity;
    if (!Number.isSafeInteger(next)) {
      throw new QuotationCreateIdempotencyError('INVALID_QUOTATION_DTO', 400, 'Quotation request is invalid.');
    }
    quantities.set(variantId, next);
  }
  if (typeof input.shippingAddress !== 'string' || !input.shippingAddress.trim()
    || typeof input.shippingPhone !== 'string' || !input.shippingPhone.trim()
    || (input.paymentMethod !== 'COD' && input.paymentMethod !== 'BANK_TRANSFER')
    || (input.deliveryMethod !== undefined && input.deliveryMethod !== 'delivery' && input.deliveryMethod !== 'pickup')) {
    throw new QuotationCreateIdempotencyError('INVALID_QUOTATION_DTO', 400, 'Quotation request is invalid.');
  }

  return {
    customerId,
    items: [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([variantId, quantity]) => ({ variantId, quantity })),
    shippingAddress: input.shippingAddress.trim(),
    shippingPhone: input.shippingPhone.trim(),
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod || 'delivery',
    promoCode: typeof input.promoCode === 'string' ? input.promoCode.trim().toLocaleUpperCase('en-US') || null : null,
    note: typeof input.note === 'string' ? input.note.trim() || null : null,
    sourceSessionId: typeof input.sourceSessionId === 'string' ? input.sourceSessionId.trim() || null : null,
  };
}

/** Fingerprint is one-way; the normalized PII is neither returned nor logged. */
export function fingerprintQuotationCreateRequest(customerId: string, input: QuotationCreateFingerprintInput): string {
  return digest(normalizeRequest(customerId, input));
}

/** Match only the Customer/keyHash unique constraint, never quoteNumber or another P2002. */
export function isQuotationCreateKeyCollision(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const databaseError = error as { code?: unknown; meta?: { modelName?: unknown; target?: unknown; constraint?: unknown } };
  if (databaseError.code !== 'P2002' || !databaseError.meta) return false;
  const { modelName, target, constraint } = databaseError.meta;
  if (modelName !== undefined && modelName !== 'QuotationCreateIdempotency') return false;
  const exact = (candidate: unknown) => Array.isArray(candidate)
    ? candidate.length === 2 && candidate.includes('customerId') && candidate.includes('keyHash')
    : candidate === 'customerId_keyHash'
      || candidate === 'QuotationCreateIdempotency_customerId_keyHash_key';
  return exact(target) || exact(constraint);
}

export function isQuotationCreateSerializationConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === 'P2034');
}

function makeError(code: string, status: number, message: string): QuotationCreateIdempotencyError {
  return new QuotationCreateIdempotencyError(code, status, message);
}

function rejectDeletedResult(record: any): void {
  if (record?.quotationId === null) {
    throw makeError('IDEMPOTENCY_QUOTATION_DELETED', 410,
      'This quotation was permanently deleted. To request a new quotation, start a new request with a new Idempotency-Key.');
  }
}

async function readClaim(delegate: { findUnique(args: any): Promise<any> }, args: any): Promise<any> {
  // Read the scalar tombstone first, including with an older generated required relation.
  // A tombstone is never treated as a missing claim, including commit-error recovery.
  const scalar = await delegate.findUnique({ where: args.where });
  rejectDeletedResult(scalar);
  if (!scalar) return null;
  const record = await delegate.findUnique(args);
  rejectDeletedResult(record);
  if (!record) throw makeError('IDEMPOTENCY_RESULT_UNCERTAIN', 503, 'The saved request changed while reading. Retry with the same key.');
  return record;
}

async function loadExisting<TQuotation>(
  database: QuotationCreateIdempotencyDatabase<any>,
  customerId: string,
  keyHash: string,
  requestHash: string,
  quotationSelect: Record<string, unknown>,
): Promise<TQuotation | null> {
  const record = await readClaim(database.quotationCreateIdempotency, {
    where: { customerId_keyHash: { customerId, keyHash } },
    include: { quotation: { select: { ...quotationSelect, customerId: true } } },
  });
  if (!record) return null;
  if (record.requestHash !== requestHash) {
    throw makeError(
      'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
      409,
      'This idempotency key was already used for a different quotation request. Start a new request with a new key.',
    );
  }
  if (!record.quotation || record.quotation.customerId !== customerId) {
    throw makeError('IDEMPOTENCY_RESULT_UNAVAILABLE', 503, 'The saved quotation result is unavailable. Retry with the same key.');
  }
  return record.quotation as TQuotation;
}

/** Durable same-key lookup used before throttling and by the authenticated recovery endpoint. */
export async function findExistingQuotationCreate<TQuotation>(options: {
  database: QuotationCreateIdempotencyDatabase<any>;
  customerId: string;
  rawKey: unknown;
  input: QuotationCreateFingerprintInput;
  quotationSelect: Record<string, unknown>;
}): Promise<TQuotation | null> {
  const keyHash = hashQuotationCreateIdempotencyKey(options.rawKey);
  const requestHash = fingerprintQuotationCreateRequest(options.customerId, options.input);
  return loadExisting<TQuotation>(options.database, options.customerId, keyHash, requestHash, options.quotationSelect);
}

/** Recovery is scoped to the authenticated Customer and opaque key; no payload is needed or returned. */
export async function recoverQuotationCreateResult<TQuotation extends { customerId?: string }>(options: {
  database: QuotationCreateIdempotencyDatabase<any>;
  customerId: string;
  rawKey: unknown;
  quotationSelect: Record<string, unknown>;
}): Promise<TQuotation | null> {
  const keyHash = hashQuotationCreateIdempotencyKey(options.rawKey);
  const record = await readClaim(options.database.quotationCreateIdempotency, {
    where: { customerId_keyHash: { customerId: options.customerId, keyHash } },
    include: { quotation: { select: { ...options.quotationSelect, customerId: true } } },
  });
  if (!record) return null;
  if (!record.quotation || record.quotation.customerId !== options.customerId) {
    throw makeError('IDEMPOTENCY_RESULT_UNAVAILABLE', 503, 'The saved quotation result is unavailable. Check again with the same key.');
  }
  return record.quotation as TQuotation;
}

/**
 * Creates the Quotation and its durable claim in one Serializable transaction.
 * Callback code must be database-only: no PDF, email, n8n, or other external effects.
 */
export async function runIdempotentQuotationCreate<
  TQuotation extends { id: string; customerId: string },
  TTransaction extends QuotationCreateTransaction,
>(options: {
  database: QuotationCreateIdempotencyDatabase<TTransaction>;
  customerId: string;
  rawKey: unknown;
  input: QuotationCreateFingerprintInput;
  quotationSelect: Record<string, unknown>;
  createQuotation: (transaction: TTransaction) => Promise<TQuotation>;
}): Promise<{ quotation: TQuotation; replayed: boolean }> {
  const { database, customerId, input, quotationSelect, createQuotation } = options;
  const keyHash = hashQuotationCreateIdempotencyKey(options.rawKey);
  const requestHash = fingerprintQuotationCreateRequest(customerId, input);

  for (let attempt = 1; attempt <= MAX_QUOTATION_CREATE_RETRIES; attempt += 1) {
    try {
      const outcome = await database.$transaction(async transaction => {
        const existing = await readClaim(transaction.quotationCreateIdempotency, {
          where: { customerId_keyHash: { customerId, keyHash } },
          include: { quotation: { select: { ...quotationSelect, customerId: true } } },
        });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw makeError(
              'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', 409,
              'This idempotency key was already used for a different quotation request. Start a new request with a new key.',
            );
          }
          if (!existing.quotation || existing.quotation.customerId !== customerId) {
            throw makeError('IDEMPOTENCY_RESULT_UNAVAILABLE', 503, 'The saved quotation result is unavailable. Retry with the same key.');
          }
          return { quotation: existing.quotation as TQuotation, replayed: true };
        }

        const created = await createQuotation(transaction);
        if (!created?.id || created.customerId !== customerId) {
          throw new Error('Quotation creation did not return a record for the authenticated Customer.');
        }
        await transaction.quotationCreateIdempotency.create({
          data: { customerId, keyHash, requestHash, quotationId: created.id },
        });
        return { quotation: created, replayed: false };
      }, { isolationLevel: 'Serializable' });
      return outcome;
    } catch (error) {
      if (error instanceof QuotationCreateIdempotencyError) throw error;

      if (isQuotationCreateKeyCollision(error)) {
        try {
          const recovered = await loadExisting<TQuotation>(database, customerId, keyHash, requestHash, quotationSelect);
          if (recovered) return { quotation: recovered, replayed: true };
        } catch (recoveryError) {
          if (recoveryError instanceof QuotationCreateIdempotencyError) throw recoveryError;
          throw makeError('IDEMPOTENCY_RESULT_UNCERTAIN', 503, 'The request result could not be confirmed. Retry the same request with the same Idempotency-Key.');
        }
        if (attempt < MAX_QUOTATION_CREATE_RETRIES) continue;
        throw makeError('IDEMPOTENCY_RESULT_UNCERTAIN', 503, 'The request result could not be confirmed. Retry the same request with the same Idempotency-Key.');
      }

      if (isQuotationCreateSerializationConflict(error)) {
        try {
          const recovered = await loadExisting<TQuotation>(database, customerId, keyHash, requestHash, quotationSelect);
          if (recovered) return { quotation: recovered, replayed: true };
        } catch (recoveryError) {
          if (recoveryError instanceof QuotationCreateIdempotencyError) throw recoveryError;
          if (attempt === MAX_QUOTATION_CREATE_RETRIES) {
            throw makeError('IDEMPOTENCY_RESULT_UNCERTAIN', 503, 'The request result could not be confirmed. Retry the same request with the same Idempotency-Key.');
          }
        }
        if (attempt < MAX_QUOTATION_CREATE_RETRIES) continue;
        throw makeError(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          409,
          'A request using this key may still be processing. Retry the same request with the same Idempotency-Key.',
        );
      }

      // If the driver failed while commit outcome was uncertain, a strong read by key
      // recovers the committed response. A failed recovery read must not claim failure.
      try {
        const recovered = await loadExisting<TQuotation>(database, customerId, keyHash, requestHash, quotationSelect);
        if (recovered) return { quotation: recovered, replayed: true };
      } catch (recoveryError) {
        if (recoveryError instanceof QuotationCreateIdempotencyError) throw recoveryError;
        throw makeError('IDEMPOTENCY_RESULT_UNCERTAIN', 503, 'The request result could not be confirmed. Retry the same request with the same Idempotency-Key.');
      }
      throw error;
    }
  }
  throw new Error('Quotation idempotency retry loop exited unexpectedly.');
}
