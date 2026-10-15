import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addQuotationDraftSelection,
  clearQuotationDraft,
  loadQuotationDraft,
  mergeQuotationDraftSelection,
  parseQuotationDraft,
  QUOTATION_DRAFT_SESSION_KEY,
} from './quotation-draft';
import { isValidChatbotQuantity, makeQuotationSelection } from '../chatbot/quotation-selection';
import {
  QUOTATION_CREATED_EVENT,
  subscribeToQuotationDraftChanges,
  publishQuotationCreated,
} from './quotation-events';
import { upsertPersistedQuotation } from './customer-quotation-state';

test('quotation handoff persists only a valid product/variant selection and integer quantity', () => {
  assert.deepEqual(parseQuotationDraft({
    items: [{ productId: 'p-1', variantId: 'v-1', quantity: 2, price: 1, customerId: 'not-accepted' }],
    token: 'not-accepted',
  }), [{ productId: 'p-1', variantId: 'v-1', quantity: 2 }]);
  assert.equal(parseQuotationDraft({ items: [{ productId: 'p-1', variantId: 'v-1', quantity: 0 }] }), null);
  assert.equal(parseQuotationDraft({ items: [{ productId: 'p-1', variantId: 'v-1', quantity: 1.5 }] }), null);
  assert.equal(parseQuotationDraft({ items: [{ productId: '', variantId: 'v-1', quantity: 1 }] }), null);
});

test('chatbot quote selection rejects fractional, zero, and over-stock quantities', () => {
  assert.equal(isValidChatbotQuantity('2', 3), true);
  assert.equal(isValidChatbotQuantity('1.5', 3), false);
  assert.equal(isValidChatbotQuantity('0', 3), false);
  assert.equal(isValidChatbotQuantity('4', 3), false);
  assert.deepEqual(makeQuotationSelection('p-1', 'v-1', '2', 3), { productId: 'p-1', variantId: 'v-1', quantity: 2 });
  assert.equal(makeQuotationSelection('p-1', 'v-1', '4', 3), null);
});

test('chatbot selections accumulate across product cards and merge duplicate variants safely', () => {
  const first = { productId: 'p-1', variantId: 'v-1', quantity: 2 };
  const second = { productId: 'p-2', variantId: 'v-2', quantity: 1 };
  assert.deepEqual(mergeQuotationDraftSelection([first], second), [first, second]);
  assert.deepEqual(mergeQuotationDraftSelection([first], { ...first, quantity: 3 }), [
    { ...first, quantity: 5 },
  ]);
  assert.equal(mergeQuotationDraftSelection([{ ...first, quantity: 1000 }], { ...first, quantity: 1 }), null);
});

test('first selection saves successfully with the exact Backend productId and variantId', () => {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    },
  });
  try {
    clearQuotationDraft();
    const selection = { productId: 'iphone-17-pro-max', variantId: 'variant-256-navy', quantity: 1 };
    assert.equal(addQuotationDraftSelection(selection), true);
    assert.deepEqual(loadQuotationDraft(), [selection]);
    assert.deepEqual(JSON.parse(values.get(QUOTATION_DRAFT_SESSION_KEY) || '{}'), { items: [selection] });
  } finally {
    clearQuotationDraft();
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('blocked sessionStorage falls back to in-memory draft for same-session navigation', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() { throw new DOMException('Storage access denied', 'SecurityError'); },
  });
  try {
    clearQuotationDraft();
    const selection = { productId: 'iphone-17-pro-max', variantId: 'variant-512-silver', quantity: 1 };
    assert.equal(addQuotationDraftSelection(selection), true);
    assert.deepEqual(loadQuotationDraft(), [selection]);
  } finally {
    clearQuotationDraft();
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('QuotaExceededError keeps draft in memory and never clears unrelated browser storage', () => {
  const values = new Map<string, string>([['other-app-key', 'preserve-me']]);
  const removed: string[] = [];
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: () => { throw new DOMException('Storage is full', 'QuotaExceededError'); },
      removeItem: (key: string) => { removed.push(key); values.delete(key); },
    },
  });
  try {
    clearQuotationDraft();
    values.set('other-app-key', 'preserve-me');
    const selection = { productId: 'iphone-17-pro-max', variantId: 'variant-1tb-orange', quantity: 1 };
    assert.equal(addQuotationDraftSelection(selection), true);
    assert.deepEqual(loadQuotationDraft(), [selection]);
    assert.equal(values.get('other-app-key'), 'preserve-me');
    assert.ok(removed.every(key => key === QUOTATION_DRAFT_SESSION_KEY));
  } finally {
    clearQuotationDraft();
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('A-C: already-mounted same-page subscriber sees successive chatbot draft changes immediately', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const windowTarget = new EventTarget();
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: windowTarget });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    },
  });
  try {
    clearQuotationDraft();
    const observed: Array<{ source: string; items: ReturnType<typeof loadQuotationDraft> }> = [];
    const unsubscribe = subscribeToQuotationDraftChanges(source => {
      observed.push({ source, items: loadQuotationDraft() });
    });
    const first = { productId: 'iphone-17', variantId: 'variant-256-blue', quantity: 1 };
    const second = { productId: 'iphone-17-pro', variantId: 'variant-512-black', quantity: 2 };

    assert.equal(addQuotationDraftSelection(first), true);
    assert.deepEqual(observed.at(-1), { source: 'chatbot', items: [first] });
    assert.equal(addQuotationDraftSelection(second), true);
    assert.deepEqual(observed.at(-1), { source: 'chatbot', items: [first, second] });
    assert.equal(observed.length, 2);
    unsubscribe();
  } finally {
    clearQuotationDraft();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('E: blocked sessionStorage still publishes the updated in-memory draft to same-document subscribers', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() { throw new DOMException('Storage access denied', 'SecurityError'); },
  });
  try {
    clearQuotationDraft();
    let observed: ReturnType<typeof loadQuotationDraft> = [];
    const unsubscribe = subscribeToQuotationDraftChanges(() => { observed = loadQuotationDraft(); });
    const selection = { productId: 'iphone-17', variantId: 'variant-memory', quantity: 1 };
    assert.equal(addQuotationDraftSelection(selection), true);
    assert.deepEqual(observed, [selection]);
    unsubscribe();
  } finally {
    clearQuotationDraft();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('draft changes do not emit quotation-created; persisted quotation replay is list-deduplicated', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const target = new EventTarget();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: target });
  try {
    clearQuotationDraft();
    let createdEvents = 0;
    target.addEventListener(QUOTATION_CREATED_EVENT, () => { createdEvents += 1; });
    assert.equal(addQuotationDraftSelection({ productId: 'p-1', variantId: 'v-1', quantity: 1 }), true);
    assert.equal(createdEvents, 0);

    const first = { id: 'quote-1', totalAmount: 100 };
    const other = { id: 'quote-2', totalAmount: 200 };
    const once = upsertPersistedQuotation([other], first);
    const replay = upsertPersistedQuotation(once, first);
    assert.deepEqual(replay, [first, other]);

    publishQuotationCreated(first.id);
    assert.equal(createdEvents, 1);
  } finally {
    clearQuotationDraft();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('stale sessionStorage cannot override a newer in-memory draft after a failed write', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const stale = { productId: 'old-product', variantId: 'old-variant', quantity: 1 };
  const current = { productId: 'new-product', variantId: 'new-variant', quantity: 2 };
  const stored = new Map([[QUOTATION_DRAFT_SESSION_KEY, JSON.stringify({ items: [stale] })]]);
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: () => { throw new DOMException('Storage full', 'QuotaExceededError'); },
      removeItem: (key: string) => { stored.delete(key); },
    },
  });
  try {
    clearQuotationDraft();
    stored.set(QUOTATION_DRAFT_SESSION_KEY, JSON.stringify({ items: [stale] }));
    assert.equal(addQuotationDraftSelection(current), true);
    assert.deepEqual(loadQuotationDraft(), [stale, current]);
  } finally {
    clearQuotationDraft();
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
