import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSharedPricing,
  createQuotationPricingAdapter,
  quotationPriceSnapshotMatches,
  PricingInputError,
  PricingPolicy,
} from '../src/services/pricing.service';
import {
  calculateCheckoutPricing,
  createCheckoutPricingConfirmation,
  createV1QuotationPricingProvider,
  createV1QuotationPricingAdapter,
  getV1QuotationExpiry,
  PRICING_POLICY_V1,
  resolveV1Campaign,
  resolveV1CampaignOffers,
  verifyCheckoutPricingConfirmation,
} from '../src/services/checkout-pricing.service';

const now = new Date('2026-10-10T00:00:00.000Z');
function policy(overrides: Partial<PricingPolicy> = {}): PricingPolicy {
  return {
    catalogPriceStrategy: 'lowest_valid_offer',
    discountStacking: 'sequential',
    zeroUsageLimitPolicy: 'exhausted',
    discounts: [],
    shipping: { method: 'delivery', deliveryFee: 50000 },
    ...overrides,
  };
}

test('ordinary price and quantity produce exact VND subtotals and grand total', () => {
  const result = calculateSharedPricing([{ variantId: 'v1', quantity: 3, price: 120000 }], policy(), now);
  assert.equal(result.originalSubtotal, 360000);
  assert.equal(result.subtotal, 360000);
  assert.equal(result.discountBreakdown.totalSavingsAmount, 0);
  assert.equal(result.shipping.amount, 50000);
  assert.equal(result.grandTotal, 410000);
});

test('lowest valid sale and campaign offer is selected without accepting client prices', () => {
  const result = calculateSharedPricing([{
    variantId: 'v1', quantity: 2, price: 100000, salePrice: 90000,
    offers: [{ source: 'campaign', discountType: 'fixed', discountValue: 15000, isActive: true }],
  }], policy(), now);
  assert.equal(result.lines[0].originalUnitPrice, 100000);
  assert.equal(result.lines[0].effectiveUnitPrice, 85000);
  assert.equal(result.lines[0].catalogDiscountSource, 'campaign');
  assert.equal(result.subtotal, 170000);
});

test('fixed promo and percentage reward discounts are reported and applied sequentially', () => {
  const result = calculateSharedPricing([{ variantId: 'v1', quantity: 2, price: 1000 }], policy({
    discounts: [
      { id: 'promo-1', source: 'promo', type: 'percentage', value: 10 },
      { id: 'reward-1', source: 'reward', type: 'fixed', value: 50 },
    ],
  }), now);
  assert.deepEqual(result.discountBreakdown.cart.map(item => item.appliedAmount), [200, 50]);
  assert.equal(result.discountBreakdown.cartDiscountAmount, 250);
  assert.equal(result.grandTotal, 51750);
});

test('discount is capped at subtotal and pickup omits delivery fee', () => {
  const result = calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: 500 }], policy({
    discounts: [{ id: 'promo', source: 'promo', type: 'fixed', value: 900 }],
    shipping: { method: 'pickup', deliveryFee: 50000 },
  }), now);
  assert.equal(result.discountBreakdown.cartDiscountAmount, 500);
  assert.equal(result.shipping.reason, 'pickup');
  assert.equal(result.grandTotal, 0);
});

test('threshold and reward shipping reasons remain explicit', () => {
  const threshold = calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: 200000 }], policy({
    shipping: { method: 'delivery', deliveryFee: 50000, freeShippingThreshold: 200000 },
  }), now);
  assert.equal(threshold.shipping.reason, 'threshold');
  assert.equal(threshold.shipping.amount, 0);
  const reward = calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: 1000 }], policy({
    shipping: { method: 'delivery', deliveryFee: 50000, rewardFreeShipping: true },
  }), now);
  assert.equal(reward.shipping.reason, 'reward');
});

test('invalid quantities, monetary values, discount percentages, and sale prices are rejected', () => {
  assert.throws(() => calculateSharedPricing([{ variantId: 'v1', quantity: 0, price: 100 }], policy(), now), PricingInputError);
  assert.throws(() => calculateSharedPricing([{ variantId: 'v1', quantity: 1.2, price: 100 }], policy(), now), PricingInputError);
  assert.throws(() => calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: -1 }], policy(), now), PricingInputError);
  assert.throws(() => calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: 100, salePrice: 101 }], policy(), now), PricingInputError);
  assert.throws(() => calculateSharedPricing([{ variantId: 'v1', quantity: 1, price: 100 }], policy({
    discounts: [{ id: 'bad', source: 'promo', type: 'percentage', value: 101 }],
  }), now), PricingInputError);
});

test('quotation pricing adapter snapshots backend variant data and detects price changes', () => {
  const adapter = createQuotationPricingAdapter({
    policy: policy({ shipping: { method: 'pickup', deliveryFee: 50000 } }),
    generateQuoteNumber: () => 'QT-TEST-1',
    now: () => now,
  });
  const snapshot = adapter.resolveVariantPrice({ id: 'v1', price: 1000, salePrice: 800 });
  assert.deepEqual(snapshot, { unitPrice: 800, originalUnitPrice: 1000, saleUnitPrice: 800 });
  assert.equal(adapter.calculateTotals(1600).totalAmount, 1600);
  assert.equal(adapter.generateQuoteNumber(), 'QT-TEST-1');
  assert.equal(quotationPriceSnapshotMatches(snapshot, snapshot), true);
  assert.equal(quotationPriceSnapshotMatches(snapshot, { ...snapshot, unitPrice: 700 }), false);
});

function pricingDatabase(options: { variants?: any[]; campaigns?: any[]; promo?: any; milestones?: any[] } = {}) {
  return {
    productVariant: { findMany: async ({ where }: any) => (options.variants || []).filter(item => where.id.in.includes(item.id)) },
    campaign: { findMany: async () => options.campaigns || [] },
    promoCode: { findUnique: async ({ where }: any) => options.promo && (where.code === options.promo.code || where.id === options.promo.id) ? options.promo : null },
    rewardMilestone: { findMany: async () => options.milestones || [] },
  };
}

const v1Variant = { id: 'v1', price: 100000, salePrice: 90000, stock: 5, attributes: {}, productId: 'p1', product: { id: 'p1', categoryId: 'c1', name: 'Phone', status: 'active' } };

test('Pricing V1 picks the best eligible sale/campaign offer without stacking them', async () => {
  const database = pricingDatabase({
    variants: [v1Variant],
    campaigns: [{ id: 'campaign-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'fixed', discountValue: 15000 }],
  });
  const result = await calculateCheckoutPricing(database, { items: [{ variantId: 'v1', quantity: 2 }], deliveryMethod: 'delivery' }, now);
  assert.equal(result.lines[0].effectiveUnitPrice, 85000);
  assert.equal(result.discountBreakdown.catalogDiscountAmount, 30000);
  assert.equal(result.subtotal, 170000);
  const lowerSale = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, salePrice: 80000 }],
    campaigns: [{ id: 'campaign-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'fixed', discountValue: 15000 }],
  }), { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'pickup' }, now);
  assert.equal(lowerSale.lines[0].effectiveUnitPrice, 80000);
  assert.equal(lowerSale.lines[0].catalogDiscountSource, 'sale_price');
});

test('Pricing V1 selects the greatest eligible product/category/all campaign saving, not specificity alone', async () => {
  const campaigns = [
    { id: 'product-small', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'fixed', discountValue: 1000 },
    { id: 'category-best', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'category', targetIds: ['c1'], discountType: 'fixed', discountValue: 12000 },
    { id: 'all-middle', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'all', targetIds: [], discountType: 'percentage', discountValue: 10 },
  ];
  assert.equal(resolveV1Campaign(v1Variant.product, campaigns, 100000, now)?.id, 'category-best');
  const offer = resolveV1CampaignOffers(v1Variant.product, campaigns, 100000, now);
  assert.deepEqual(offer.map(item => item.discountValue), [12000]);

  const result = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, salePrice: null }], campaigns,
  }), { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'pickup' }, now);
  assert.equal(result.lines[0].effectiveUnitPrice, 88000);
  assert.equal(result.lines[0].catalogDiscountSource, 'campaign');
});

test('Pricing V1 uses campaign specificity only as a tie-breaker and rejects malformed active campaigns', () => {
  const tied = [
    { id: 'all', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'all', targetIds: [], discountType: 'fixed', discountValue: 5000 },
    { id: 'product', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'fixed', discountValue: 5000 },
  ];
  assert.equal(resolveV1CampaignOffers(v1Variant.product, tied, 100000, now)[0].source, 'campaign');
  assert.throws(() => resolveV1CampaignOffers(v1Variant.product, [
    { id: 'bad', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'all', targetIds: [], discountType: 'percentage', discountValue: 101 },
  ], 100000, now), /invalid discount policy/i);
});

test('Pricing V1 applies percentage and fixed promos and chooses only the greater Promo/Reward discount', async () => {
  const basePromo = { id: 'promo-1', code: 'SAVE', isActive: true, discountType: 'percentage', discountValue: 20, minOrderValue: 0, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), usageLimit: 0, usedCount: 700 };
  const database = pricingDatabase({
    variants: [{ ...v1Variant, price: 10000, salePrice: null }],
    promo: basePromo,
    milestones: [{ id: 'reward-1', amount: 0, type: 'voucher', discount: 30, isActive: true }],
  });
  const result = await calculateCheckoutPricing(database, { items: [{ variantId: 'v1', quantity: 2 }], promoCode: 'SAVE', deliveryMethod: 'pickup' }, now);
  assert.equal(result.discountBreakdown.cartDiscountAmount, 6000);
  assert.deepEqual(result.discountBreakdown.cart.map(item => item.appliedAmount), [0, 6000]);
  assert.equal(result.promo?.applied, false);
  assert.equal(result.shipping.amount, 0);

  const fixed = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, price: 10000, salePrice: null }],
    promo: { ...basePromo, discountType: 'fixed', discountValue: 7000 },
    milestones: [{ id: 'reward-1', amount: 0, type: 'voucher', discount: 30, isActive: true }],
  }), { items: [{ variantId: 'v1', quantity: 2 }], promoCode: 'SAVE', deliveryMethod: 'pickup' }, now);
  assert.equal(fixed.discountBreakdown.cartDiscountAmount, 7000);
  assert.equal(fixed.discountBreakdown.cart[0].appliedAmount, 7000);
  assert.equal(fixed.discountBreakdown.cart[1].appliedAmount, 0);
});

test('usageLimit zero is unlimited and exhausted/inactive/under-minimum promos are not applied', async () => {
  const promo = { id: 'promo-1', code: 'SAVE', isActive: true, discountType: 'fixed', discountValue: 1000, minOrderValue: 0, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), usageLimit: 0, usedCount: 100000 };
  const unlimited = await calculateCheckoutPricing(pricingDatabase({ variants: [{ ...v1Variant, price: 2000, salePrice: null }], promo }), {
    items: [{ variantId: 'v1', quantity: 1 }], promoCode: 'SAVE', deliveryMethod: 'pickup',
  }, now);
  assert.equal(unlimited.discountBreakdown.cart[0].eligible, true);
  assert.equal(unlimited.discountBreakdown.cartDiscountAmount, 1000);
  const limited = await calculateCheckoutPricing(pricingDatabase({ variants: [{ ...v1Variant, price: 2000, salePrice: null }], promo: { ...promo, usageLimit: 2, usedCount: 2 } }), {
    items: [{ variantId: 'v1', quantity: 1 }], promoCode: 'SAVE', deliveryMethod: 'pickup',
  }, now);
  assert.equal(limited.discountBreakdown.cart[0].reason, 'usage_limit');
});

test('Delivery uses the verified fee, threshold and shipping reward; Pickup always costs zero', async () => {
  assert.equal(PRICING_POLICY_V1.deliveryFee, 50000);
  assert.equal(PRICING_POLICY_V1.freeShippingThreshold, 25000000);
  const db = pricingDatabase({ variants: [{ ...v1Variant, price: 25000000, salePrice: null }] });
  const atThreshold = await calculateCheckoutPricing(db, { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'delivery' }, now);
  assert.equal(atThreshold.shipping.reason, 'threshold');
  assert.equal(atThreshold.shipping.amount, 0);
  const below = await calculateCheckoutPricing(pricingDatabase({ variants: [{ ...v1Variant, price: 24999999, salePrice: null }] }), {
    items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'delivery',
  }, now);
  assert.equal(below.shipping.amount, 50000);
  const rewardShipping = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, price: 1000, salePrice: null }],
    milestones: [{ id: 'ship-1', amount: 1000, type: 'shipping', isActive: true }],
  }), { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'delivery' }, now);
  assert.equal(rewardShipping.shipping.reason, 'reward');

  const promo = { id: 'promo-ship', code: 'SHIPTEST', isActive: true, discountType: 'fixed', discountValue: 20000, minOrderValue: 0, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), usageLimit: 0, usedCount: 0 };
  const shippingRewardWins = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, price: 1000000, salePrice: null }], promo,
    milestones: [{ id: 'ship-1', amount: 1000000, type: 'shipping', isActive: true }],
  }), { items: [{ variantId: 'v1', quantity: 1 }], promoCode: 'SHIPTEST', deliveryMethod: 'delivery' }, now);
  assert.equal(shippingRewardWins.discountBreakdown.cartDiscountAmount, 0);
  assert.equal(shippingRewardWins.shipping.reason, 'reward');
  assert.equal(shippingRewardWins.promo?.applied, false);

  const promoWins = await calculateCheckoutPricing(pricingDatabase({
    variants: [{ ...v1Variant, price: 1000000, salePrice: null }], promo: { ...promo, discountValue: 60000 },
    milestones: [{ id: 'ship-1', amount: 1000000, type: 'shipping', isActive: true }],
  }), { items: [{ variantId: 'v1', quantity: 1 }], promoCode: 'SHIPTEST', deliveryMethod: 'delivery' }, now);
  assert.equal(promoWins.discountBreakdown.cartDiscountAmount, 60000);
  assert.equal(promoWins.shipping.amount, 50000);
});

test('Quotation V1 adapter shares catalog, discount, shipping rules and creates 24-hour validity', () => {
  const adapter = createV1QuotationPricingAdapter({
    campaigns: [{ id: 'campaign-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'percentage', discountValue: 10 }],
    promo: { id: 'promo-1', code: 'SAVE', isActive: true, discountType: 'fixed', discountValue: 8000, minOrderValue: 0, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), usageLimit: 0, usedCount: 0 },
    rewardMilestones: [{ id: 'reward-1', amount: 0, type: 'voucher', discount: 30, isActive: true }],
    deliveryMethod: 'pickup', generateQuoteNumber: () => 'QT-V1', now: () => now,
  });
  assert.equal(adapter.resolveVariantPrice({ ...v1Variant, product: v1Variant.product }).unitPrice, 90000);
  assert.deepEqual(adapter.calculateTotals(20000), { discountAmount: 8000, shippingFee: 0, totalAmount: 12000 });
  assert.equal(adapter.getAppliedPromoCodeId?.(20000), 'promo-1');
  assert.equal(getV1QuotationExpiry(now).getTime() - now.getTime(), PRICING_POLICY_V1.quotationValidityMs);
});

test('Quotation provider loads current backend campaign, promo, rewards, and pickup method in one V1 adapter', async () => {
  const database = pricingDatabase({
    campaigns: [{ id: 'campaign-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), appliesTo: 'product', targetIds: ['p1'], discountType: 'fixed', discountValue: 1000 }],
    promo: { id: 'promo-1', code: 'SAVE', isActive: true, discountType: 'fixed', discountValue: 1500, minOrderValue: 0, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'), usageLimit: 0, usedCount: 0 },
    milestones: [{ id: 'reward-1', amount: 0, type: 'voucher', discount: 10, isActive: true }],
  });
  const provider = createV1QuotationPricingProvider(database, () => 'QT-PROVIDER', () => now);
  const adapter = await provider({ body: { promoCode: 'SAVE', deliveryMethod: 'pickup' } });
  assert.equal(adapter.resolveVariantPrice(v1Variant).unitPrice, 90000);
  assert.deepEqual(adapter.calculateTotals(10000), { discountAmount: 1500, shippingFee: 0, totalAmount: 8500 });
  assert.equal(adapter.getAppliedPromoCodeId?.(10000), 'promo-1');
});

test('Checkout price confirmation is bound to customer, cart, promo, delivery, exact snapshot, and expiry', async () => {
  const request = { items: [{ variantId: 'v1', quantity: 1 }], promoCode: null, deliveryMethod: 'pickup' as const };
  const pricing = await calculateCheckoutPricing(pricingDatabase({ variants: [{ ...v1Variant, price: 1000, salePrice: null }] }), request, now);
  const token = createCheckoutPricingConfirmation('customer-1', request, pricing, 'test-secret', now);
  assert.equal(verifyCheckoutPricingConfirmation(token, 'customer-1', request, pricing, 'test-secret', now), true);
  assert.equal(verifyCheckoutPricingConfirmation(token, 'customer-2', request, pricing, 'test-secret', now), false);
  assert.equal(verifyCheckoutPricingConfirmation(token, 'customer-1', { ...request, deliveryMethod: 'delivery' }, pricing, 'test-secret', now), false);
  assert.equal(verifyCheckoutPricingConfirmation(token, 'customer-1', request, { ...pricing, grandTotal: 999 }, 'test-secret', now), false);
  assert.equal(verifyCheckoutPricingConfirmation(token, 'customer-1', request, pricing, 'test-secret', new Date(now.getTime() + PRICING_POLICY_V1.checkoutConfirmationValidityMs + 1)), false);
});
