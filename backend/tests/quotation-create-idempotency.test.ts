import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fingerprintQuotationCreateRequest,
  findExistingQuotationCreate,
  recoverQuotationCreateResult,
  generateQuotationCreateIdempotencyKey,
  hashQuotationCreateIdempotencyKey,
  isQuotationCreateKeyCollision,
  runIdempotentQuotationCreate,
} from '../src/services/quotation-create-idempotency.service';

const baseInput = {
  items: [{ variantId: 'variant-a', quantity: 2 }],
  shippingAddress: '  Test Address ',
  shippingPhone: ' 0900000000 ',
  paymentMethod: 'COD' as const,
  deliveryMethod: 'delivery' as const,
};
const selectedQuotation = { id: true, quoteNumber: true, customerId: true, items: { select: { id: true } } };

function p2002(target: string[] = ['customerId', 'keyHash']) {
  return Object.assign(new Error('unique constraint'), {
    code: 'P2002',
    meta: { modelName: 'QuotationCreateIdempotency', target },
  });
}

function createMemoryDatabase(options: { collisionOnClaimCreate?: boolean; errorBeforeCommit?: Error; errorAfterCommit?: Error } = {}) {
  const claims = new Map<string, any>();
  const quotations = new Map<string, any>();
  let nextId = 0;
  let tail: Promise<void> = Promise.resolve();
  let collisionOnClaimCreate = options.collisionOnClaimCreate || false;
  let hideClaimOnNextTransactionalRead = false;
  let errorBeforeCommit = options.errorBeforeCommit;
  let errorAfterCommit = options.errorAfterCommit;

  const keyOf = (customerId: string, keyHash: string) => `${customerId}:${keyHash}`;
  const readClaim = (where: any, stagedClaims = new Map<string, any>(), stagedQuotes = new Map<string, any>()) => {
    const { customerId, keyHash } = where.customerId_keyHash;
    const claim = stagedClaims.get(keyOf(customerId, keyHash)) || claims.get(keyOf(customerId, keyHash));
    if (!claim) return null;
    const quotation = stagedQuotes.get(claim.quotationId) || quotations.get(claim.quotationId);
    return { ...claim, quotation: quotation ? { ...quotation, customerId } : null };
  };

  const database: any = {
    state: { claims, quotations },
    setCollisionOnClaimCreate() { collisionOnClaimCreate = true; hideClaimOnNextTransactionalRead = true; },
    setErrorBeforeCommit(error: Error) { errorBeforeCommit = error; },
    setErrorAfterCommit(error: Error) { errorAfterCommit = error; },
    quotationCreateIdempotency: {
      findUnique: async ({ where }: any) => readClaim(where),
    },
    async $transaction(work: (transaction: any) => Promise<any>) {
      let release!: () => void;
      const predecessor = tail;
      tail = new Promise<void>(resolve => { release = resolve; });
      await predecessor;
      const stagedQuotes = new Map<string, any>();
      const stagedClaims = new Map<string, any>();
      const transaction = {
        quotation: {
          create: async ({ data }: any) => {
            const quotation = {
              id: `quotation-${++nextId}`,
              quoteNumber: `QT-${nextId}`,
              customerId: data.customerId,
              status: 'PENDING_CUSTOMER_CONFIRMATION',
              items: [{ id: `item-${nextId}` }],
            };
            stagedQuotes.set(quotation.id, quotation);
            return quotation;
          },
        },
        quotationCreateIdempotency: {
          findUnique: async ({ where }: any) => {
            if (hideClaimOnNextTransactionalRead) {
              hideClaimOnNextTransactionalRead = false;
              return null;
            }
            return readClaim(where, stagedClaims, stagedQuotes);
          },
          create: async ({ data }: any) => {
            if (collisionOnClaimCreate) {
              collisionOnClaimCreate = false;
              throw p2002();
            }
            const compoundKey = keyOf(data.customerId, data.keyHash);
            if (claims.has(compoundKey) || stagedClaims.has(compoundKey)) throw p2002();
            stagedClaims.set(compoundKey, data);
            return data;
          },
        },
      };
      try {
        const result = await work(transaction);
        if (errorBeforeCommit) {
          const error = errorBeforeCommit;
          errorBeforeCommit = undefined;
          throw error;
        }
        for (const [id, quotation] of stagedQuotes) quotations.set(id, quotation);
        for (const [key, claim] of stagedClaims) claims.set(key, claim);
        if (errorAfterCommit) {
          const error = errorAfterCommit;
          errorAfterCommit = undefined;
          throw error;
        }
        return result;
      } finally {
        release();
      }
    },
  };
  return database;
}

function runner(database: any, customerId: string, rawKey: string, input = baseInput, create?: (tx: any) => Promise<any>) {
  return runIdempotentQuotationCreate({
    database,
    customerId,
    rawKey,
    input,
    quotationSelect: selectedQuotation,
    createQuotation: create || (transaction => transaction.quotation.create({ data: { customerId } })),
  });
}

test('hard-deleted quotation tombstone rejects old create, lookup and recovery; a fresh key still works', async () => {
  const database = createMemoryDatabase(), key = 'deleted-request-key-0001';
  const first = await runner(database, 'customer-a', key);
  const claim = [...database.state.claims.values()][0];
  claim.quotationId = null;
  database.state.quotations.delete(first.quotation.id);
  const options = { database, customerId: 'customer-a', rawKey: key, input: baseInput, quotationSelect: selectedQuotation };
  let creates = 0;
  const attempt = () => runner(database, 'customer-a', key, baseInput, async () => { creates++; throw new Error('must not create'); });
  for (const work of [attempt, () => findExistingQuotationCreate(options), () => recoverQuotationCreateResult(options)]) {
    await assert.rejects(work(), (e: any) => e.code === 'IDEMPOTENCY_QUOTATION_DELETED' && e.httpStatus === 410);
  }
  await Promise.all([assert.rejects(attempt(), { code: 'IDEMPOTENCY_QUOTATION_DELETED' }), assert.rejects(attempt(), { code: 'IDEMPOTENCY_QUOTATION_DELETED' })]);
  assert.equal(creates, 0); assert.equal(database.state.quotations.size, 0); assert.equal(database.state.claims.size, 1);
  const fresh = await runner(database, 'customer-a', 'new-intent-request-0002');
  assert.equal(fresh.replayed, false); assert.equal(database.state.quotations.size, 1);
  const otherCustomer = await runner(database, 'customer-b', key);
  assert.equal(otherCustomer.replayed, false, 'Keys remain customer-scoped');
});

test('quotation create keys use CSPRNG-shaped opaque values and persist only a digest', () => {
  const key = generateQuotationCreateIdempotencyKey();
  const keyHash = hashQuotationCreateIdempotencyKey(key);
  assert.match(key, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(keyHash.length, 64);
  assert.notEqual(keyHash, key);
  assert.throws(() => hashQuotationCreateIdempotencyKey('short'), { code: 'IDEMPOTENCY_KEY_REQUIRED' });
});

test('quotation request fingerprint normalizes duplicate variants and whitespace without exposing PII', () => {
  const first = fingerprintQuotationCreateRequest('customer-a', {
    ...baseInput,
    items: [{ variantId: ' variant-a ', quantity: 1 }, { variantId: 'variant-a', quantity: 1 }],
    promoCode: 'save',
  });
  const second = fingerprintQuotationCreateRequest('customer-a', {
    ...baseInput,
    promoCode: ' SAVE ',
  });
  assert.equal(first, second);
  assert.equal(first.includes('0900000000'), false);
  assert.equal(first.includes('Test Address'), false);
  assert.notEqual(first, fingerprintQuotationCreateRequest('customer-b', baseInput));
});

test('same-key replay and simultaneous duplicate submits return one committed Quotation', async () => {
  const database = createMemoryDatabase();
  let createCount = 0;
  const create = async (transaction: any) => {
    createCount += 1;
    return transaction.quotation.create({ data: { customerId: 'customer-a' } });
  };
  const [first, second] = await Promise.all([
    runner(database, 'customer-a', 'same-request-key-0001', baseInput, create),
    runner(database, 'customer-a', 'same-request-key-0001', baseInput, create),
  ]);
  assert.equal(createCount, 1);
  assert.equal(database.state.quotations.size, 1);
  assert.equal(database.state.claims.size, 1);
  assert.equal(first.quotation.id, second.quotation.id);
  const replay = await runner(database, 'customer-a', 'same-request-key-0001');
  assert.equal(replay.quotation.id, first.quotation.id);
});

test('same key with changed payload is rejected with HTTP 409 semantics', async () => {
  const database = createMemoryDatabase();
  await runner(database, 'customer-a', 'same-request-key-0002');
  await assert.rejects(
    runner(database, 'customer-a', 'same-request-key-0002', { ...baseInput, items: [{ variantId: 'variant-b', quantity: 1 }] }),
    { code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', httpStatus: 409 },
  );
});

test('same raw key is isolated by authenticated Customer scope', async () => {
  const database = createMemoryDatabase();
  const first = await runner(database, 'customer-a', 'shared-request-key-0003');
  const second = await runner(database, 'customer-b', 'shared-request-key-0003');
  assert.notEqual(first.quotation.id, second.quotation.id);
  assert.equal(database.state.quotations.size, 2);
  assert.equal(database.state.claims.size, 2);
});

test('transaction rollback leaves neither a quotation nor an idempotency claim', async () => {
  const database = createMemoryDatabase({ errorBeforeCommit: new Error('mock commit failure') });
  await assert.rejects(runner(database, 'customer-a', 'rollback-request-key-004'), /mock commit failure/);
  assert.equal(database.state.quotations.size, 0);
  assert.equal(database.state.claims.size, 0);
});

test('a matching compound P2002 recovers the existing committed quotation', async () => {
  const database = createMemoryDatabase();
  const existing = await runner(database, 'customer-a', 'collision-request-key-005');
  database.setCollisionOnClaimCreate();
  const replay = await runner(database, 'customer-a', 'collision-request-key-005');
  assert.equal(replay.quotation.id, existing.quotation.id);
  assert.equal(isQuotationCreateKeyCollision(p2002()), true);
  assert.equal(isQuotationCreateKeyCollision(p2002(['quoteNumber'])), false);
  assert.equal(isQuotationCreateKeyCollision({ code: 'P2002', meta: { modelName: 'Quotation', target: ['customerId', 'keyHash'] } }), false);
});

test('unrelated P2002 is not treated as an idempotency collision', async () => {
  const database = createMemoryDatabase();
  const unrelated = p2002(['quoteNumber']);
  await assert.rejects(runner(database, 'customer-a', 'unrelated-p2002-key-006', baseInput, async () => { throw unrelated; }), error => error === unrelated);
  assert.equal(database.state.claims.size, 0);
});

test('serialization conflicts retry only after rollback and stay bounded', async () => {
  const conflict = Object.assign(new Error('serialization'), { code: 'P2034' });
  const database = createMemoryDatabase({ errorBeforeCommit: conflict });
  let calls = 0;
  const result = await runner(database, 'customer-a', 'serialization-key-0007', baseInput, async transaction => {
    calls += 1;
    return transaction.quotation.create({ data: { customerId: 'customer-a' } });
  });
  assert.equal(calls, 2);
  assert.equal(result.quotation.customerId, 'customer-a');
  assert.equal(database.state.claims.size, 1);
});

test('commit outcome uncertainty is recovered by retry key without a second quotation', async () => {
  const database = createMemoryDatabase({ errorAfterCommit: new Error('connection lost after commit') });
  let createCount = 0;
  const result = await runner(database, 'customer-a', 'post-commit-recovery-0008', baseInput, async transaction => {
    createCount += 1;
    return transaction.quotation.create({ data: { customerId: 'customer-a' } });
  });
  assert.equal(result.replayed, true);
  assert.equal(createCount, 1);
  assert.equal(database.state.quotations.size, 1);
  assert.equal(database.state.claims.size, 1);
});
