import crypto from 'crypto';
import {
  calculateSharedPricing,
  CartDiscountRule,
  createQuotationPricingAdapter,
  DiscountType,
  PriceOffer,
  PricingLineInput,
  PricingPolicy,
  QuotationPricingAdapterOptions,
} from './pricing.service';

// Verified in the existing Direct Checkout and storefront sources before V1:
// delivery is 50,000 VND, free at 25,000,000 VND, and store pickup is free.
export const PRICING_POLICY_V1 = Object.freeze({
  deliveryFee: 50_000,
  freeShippingThreshold: 25_000_000,
  quotationValidityMs: 24 * 60 * 60 * 1000,
  checkoutConfirmationValidityMs: 15 * 60 * 1000,
});

export type DeliveryMethod = 'delivery' | 'pickup';
export type CheckoutPricingDatabase = {
  productVariant: { findMany(args: any): Promise<any[]> };
  campaign: { findMany(args: any): Promise<any[]> };
  promoCode: { findUnique(args: any): Promise<any | null>; findFirst?(args: any): Promise<any | null> };
  rewardMilestone: { findMany(args: any): Promise<any[]> };
};

export type CheckoutPricingRequest = {
  items: Array<{ variantId: string; quantity: number }>;
  promoCode?: string | null;
  deliveryMethod: DeliveryMethod;
};

export type CheckoutPricingSnapshot = ReturnType<typeof calculateSharedPricing> & {
  promo: null | {
    code: string;
    applied: boolean;
    reason?: string;
  };
};

export class CheckoutPricingError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = 'CheckoutPricingError';
  }
}

async function findPromoByCode(database: CheckoutPricingDatabase, code: string): Promise<any | null> {
  if (database.promoCode.findFirst) {
    return database.promoCode.findFirst({ where: { code: { equals: code, mode: 'insensitive' } } });
  }
  return database.promoCode.findUnique({ where: { code } });
}

function amountForCampaign(price: number, campaign: any): number {
  const value = campaign?.discountValue;
  if (!Number.isSafeInteger(value) || value < 0
    || (campaign.discountType !== 'percentage' && campaign.discountType !== 'fixed')
    || (campaign.discountType === 'percentage' && value > 100)) {
    throw new CheckoutPricingError('INVALID_CAMPAIGN_POLICY', 'An active campaign has an invalid discount policy.', 503);
  }
  const requested = campaign.discountType === 'percentage'
    ? Math.floor((price * value) / 100)
    : value;
  return Math.min(price, requested);
}

/** Select the greatest eligible campaign saving; specificity and id only break equal-savings ties. */
export function resolveV1Campaign(product: any, campaigns: any[], variantPrice: number, now = new Date()): any | null {
  const matching = campaigns.filter(campaign => {
    const startsAt = new Date(campaign?.startDate).getTime();
    const endsAt = new Date(campaign?.endDate).getTime();
    if (!campaign?.isActive || !Number.isFinite(startsAt) || !Number.isFinite(endsAt)
      || startsAt > now.getTime() || endsAt < now.getTime()) return false;
    return (campaign.appliesTo === 'product' && campaign.targetIds?.includes(product?.id))
      || (campaign.appliesTo === 'category' && campaign.targetIds?.includes(product?.categoryId || ''))
      || campaign.appliesTo === 'all';
  });
  const priority = (appliesTo: string) => appliesTo === 'product' ? 3 : appliesTo === 'category' ? 2 : 1;
  matching.sort((a, b) => amountForCampaign(variantPrice, b) - amountForCampaign(variantPrice, a)
    || priority(b.appliesTo) - priority(a.appliesTo)
    || String(a.id || '').localeCompare(String(b.id || '')));
  const selected = matching[0] || null;
  return selected && amountForCampaign(variantPrice, selected) > 0 ? selected : null;
}

export function resolveV1CampaignOffers(product: any, campaigns: any[], variantPrice: number, now: Date): PriceOffer[] {
  const selected = resolveV1Campaign(product, campaigns, variantPrice, now);
  if (!selected) return [];
  return [{
    source: 'campaign',
    discountType: selected.discountType as DiscountType,
    discountValue: selected.discountValue,
    isActive: selected.isActive,
    startDate: selected.startDate,
    endDate: selected.endDate,
  }];
}

function v1Policy(
  discounts: CartDiscountRule[],
  deliveryMethod: DeliveryMethod,
  rewardFreeShipping: boolean,
): PricingPolicy {
  return {
    catalogPriceStrategy: 'lowest_valid_offer',
    discountStacking: 'best_of',
    zeroUsageLimitPolicy: 'unlimited',
    discounts,
    shipping: {
      method: deliveryMethod,
      deliveryFee: PRICING_POLICY_V1.deliveryFee,
      freeShippingThreshold: PRICING_POLICY_V1.freeShippingThreshold,
      rewardFreeShipping,
    },
  };
}

export function calculateV1EffectiveUnitPrice(variant: any, campaigns: any[], now = new Date()): number {
  const result = calculateSharedPricing([{
    variantId: String(variant?.id || ''),
    quantity: 1,
    price: variant?.price,
    salePrice: variant?.salePrice ?? null,
    offers: resolveV1CampaignOffers(variant?.product, campaigns, variant?.price, now),
  }], v1Policy([], 'pickup', false), now);
  return result.lines[0].effectiveUnitPrice;
}

function rewardRules(milestones: any[], subtotal: number): CartDiscountRule[] {
  return milestones
    .filter(milestone => milestone.isActive !== false && milestone.type === 'voucher'
      && milestone.discount !== null && milestone.discount !== undefined)
    .map(milestone => ({
      id: String(milestone.id),
      source: 'reward' as const,
      type: 'percentage' as const,
      value: milestone.discount,
      minimumSubtotal: milestone.amount,
    }))
    .filter(rule => subtotal >= (rule.minimumSubtotal || 0))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function calculateV1PricingResult(
  lines: PricingLineInput[],
  discounts: CartDiscountRule[],
  milestones: any[],
  deliveryMethod: DeliveryMethod,
  now: Date,
) {
  const beforeShippingReward = calculateSharedPricing(lines, v1Policy(discounts, deliveryMethod, false), now);
  const eligibleShippingReward = deliveryMethod === 'delivery'
    && milestones.some(milestone => milestone.isActive !== false && milestone.type === 'shipping'
      && Number.isSafeInteger(milestone.amount) && milestone.amount >= 0
      && beforeShippingReward.subtotal >= milestone.amount);
  const shippingRewardSavings = eligibleShippingReward ? beforeShippingReward.shipping.amount : 0;
  if (shippingRewardSavings <= beforeShippingReward.discountBreakdown.cartDiscountAmount || shippingRewardSavings <= 0) {
    return beforeShippingReward;
  }

  const withShippingReward = calculateSharedPricing(lines, v1Policy([], deliveryMethod, true), now);
  return {
    ...withShippingReward,
    discountBreakdown: {
      ...withShippingReward.discountBreakdown,
      cart: beforeShippingReward.discountBreakdown.cart.map(item => ({ ...item, appliedAmount: 0 })),
      cartDiscountAmount: 0,
      totalSavingsAmount: withShippingReward.discountBreakdown.catalogDiscountAmount,
    },
  };
}

function eligiblePromoRule(promo: any): CartDiscountRule | null {
  if (!promo) return null;
  if (promo.discountType !== 'percentage' && promo.discountType !== 'fixed') {
    throw new CheckoutPricingError('INVALID_PROMO_POLICY', 'Promo discount type is invalid.', 503);
  }
  return {
    id: String(promo.id),
    source: 'promo',
    type: promo.discountType,
    value: promo.discountValue,
    isActive: promo.isActive,
    minimumSubtotal: promo.minOrderValue,
    startDate: promo.startDate,
    endDate: promo.endDate,
    usageLimit: promo.usageLimit,
    usedCount: promo.usedCount,
  };
}

export async function calculateCheckoutPricing(
  database: CheckoutPricingDatabase,
  request: CheckoutPricingRequest,
  now = new Date(),
): Promise<CheckoutPricingSnapshot> {
  if (!Array.isArray(request.items) || request.items.length === 0
    || request.items.some(item => !item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
    throw new CheckoutPricingError('INVALID_ITEMS', 'Checkout items are invalid.');
  }
  if (request.deliveryMethod !== 'delivery' && request.deliveryMethod !== 'pickup') {
    throw new CheckoutPricingError('INVALID_DELIVERY_METHOD', 'Delivery method is invalid.');
  }
  const uniqueIds = [...new Set(request.items.map(item => item.variantId))];
  const [variants, campaigns, milestones, promo] = await Promise.all([
    database.productVariant.findMany({ where: { id: { in: uniqueIds } }, include: { product: true } }),
    database.campaign.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    }),
    database.rewardMilestone.findMany({ where: { isActive: true } }),
    request.promoCode?.trim()
      ? findPromoByCode(database, request.promoCode.trim())
      : Promise.resolve(null),
  ]);
  const byId = new Map(variants.map(variant => [variant.id, variant]));
  const lines: PricingLineInput[] = request.items.map(item => {
    const variant = byId.get(item.variantId);
    if (!variant || variant.product?.status !== 'active') {
      throw new CheckoutPricingError('VARIANT_UNAVAILABLE', `Product variant ${item.variantId} is unavailable.`, 409);
    }
    return {
      variantId: variant.id,
      quantity: item.quantity,
      price: variant.price,
      salePrice: variant.salePrice,
      offers: resolveV1CampaignOffers(variant.product, campaigns, variant.price, now),
    };
  });

  const bare = calculateSharedPricing(lines, v1Policy([], request.deliveryMethod, false), now);
  const discountRules = [
    ...(eligiblePromoRule(promo) ? [eligiblePromoRule(promo)!] : []),
    ...rewardRules(milestones, bare.subtotal),
  ];
  const result = calculateV1PricingResult(lines, discountRules, milestones, request.deliveryMethod, now);
  const promoDiscount = result.discountBreakdown.cart.find(item => item.source === 'promo');
  let promoStatus: CheckoutPricingSnapshot['promo'] = null;
  if (request.promoCode?.trim()) {
    promoStatus = {
      code: request.promoCode.trim(),
      applied: Boolean(promoDiscount?.appliedAmount),
      ...(!promo ? { reason: 'not_found' }
        : promoDiscount?.reason ? { reason: promoDiscount.reason }
          : promoDiscount?.eligible && !promoDiscount.appliedAmount ? { reason: 'another_offer_is_better' }
            : undefined),
    };
  }
  return { ...result, promo: promoStatus };
}

export function createV1QuotationPricingAdapter(options: {
  campaigns?: any[];
  promo?: any | null;
  rewardMilestones?: any[];
  deliveryMethod?: DeliveryMethod;
  generateQuoteNumber: () => string;
  now?: () => Date;
}): ReturnType<typeof createQuotationPricingAdapter> {
  const now = options.now || (() => new Date());
  const campaigns = options.campaigns || [];
  const milestones = options.rewardMilestones || [];
  const deliveryMethod = options.deliveryMethod || 'delivery';
  const promoRule = eligiblePromoRule(options.promo);
  const adapterOptions: QuotationPricingAdapterOptions = {
    policy: v1Policy([], deliveryMethod, false),
    generateQuoteNumber: options.generateQuoteNumber,
    now,
    resolveCampaignOffers: variant => resolveV1CampaignOffers(variant.product, campaigns, variant.price, now()),
  };
  const catalogAdapter = createQuotationPricingAdapter(adapterOptions);
  const calculateQuoteResult = (subtotal: number) => {
    const discounts = [
      ...(promoRule ? [promoRule] : []),
      ...rewardRules(milestones, subtotal),
    ];
    const totals = calculateV1PricingResult(
      [{ variantId: '__quotation_subtotal__', quantity: 1, price: subtotal }],
      discounts,
      milestones,
      deliveryMethod,
      now(),
    );
    return { totals, promoApplied: Boolean(totals.discountBreakdown.cart.find(rule => rule.source === 'promo' && rule.appliedAmount > 0)) };
  };
  return {
    ...catalogAdapter,
    deliveryMethod,
    getAppliedPromoCodeId(subtotal: number) {
      return calculateQuoteResult(subtotal).promoApplied && options.promo?.id ? String(options.promo.id) : null;
    },
    calculateTotals(subtotal: number) {
      const { totals } = calculateQuoteResult(subtotal);
      return {
        discountAmount: totals.discountBreakdown.cartDiscountAmount,
        shippingFee: totals.shipping.amount,
        totalAmount: totals.grandTotal,
      };
    },
  };
}

/** Builds the same trusted pricing adapter for Quotation draft and approval transactions. */
export function createV1QuotationPricingProvider(
  database: any,
  generateQuoteNumber: () => string,
  now: () => Date = () => new Date(),
) {
  return async (request: any, context?: { transaction?: any; quotation?: any }) => {
    const client = context?.transaction || database;
    const currentTime = now();
    const quotation = context?.quotation;
    const body = request?.body || {};
    const promoCode = quotation?.promoCodeId
      ? await client.promoCode.findUnique({ where: { id: quotation.promoCodeId } })
      : typeof body.promoCode === 'string' && body.promoCode.trim()
        ? client.promoCode.findFirst
          ? await client.promoCode.findFirst({ where: { code: { equals: body.promoCode.trim(), mode: 'insensitive' } } })
          : await client.promoCode.findUnique({ where: { code: body.promoCode.trim() } })
        : null;
    const [campaigns, rewardMilestones] = await Promise.all([
      client.campaign.findMany({ where: { isActive: true, startDate: { lte: currentTime }, endDate: { gte: currentTime } } }),
      client.rewardMilestone.findMany({ where: { isActive: true } }),
    ]);
    const deliveryMethod = quotation?.deliveryMethod === 'pickup'
      ? 'pickup'
      : (body.deliveryMethod === 'pickup' || body.deliveryMethod === 'store_pickup' ? 'pickup' : 'delivery');
    return createV1QuotationPricingAdapter({
      campaigns,
      promo: promoCode,
      rewardMilestones,
      deliveryMethod,
      generateQuoteNumber,
      now,
    });
  };
}

type ConfirmationPayload = {
  v: 1;
  customerId: string;
  requestHash: string;
  priceHash: string;
  exp: number;
};

function hash(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('base64url');
}

function normalizedRequest(customerId: string, request: CheckoutPricingRequest) {
  return {
    customerId,
    items: [...request.items].sort((a, b) => a.variantId.localeCompare(b.variantId)),
    promoCode: request.promoCode?.trim() || null,
    deliveryMethod: request.deliveryMethod,
  };
}

export function createCheckoutPricingConfirmation(
  customerId: string,
  request: CheckoutPricingRequest,
  snapshot: CheckoutPricingSnapshot,
  secret: string,
  now = new Date(),
): string {
  if (!secret) throw new CheckoutPricingError('PRICING_CONFIRMATION_UNAVAILABLE', 'Checkout price confirmation is not configured.', 503);
  const payload: ConfirmationPayload = {
    v: 1,
    customerId,
    requestHash: hash(normalizedRequest(customerId, request)),
    priceHash: hash(snapshot),
    exp: now.getTime() + PRICING_POLICY_V1.checkoutConfirmationValidityMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyCheckoutPricingConfirmation(
  token: unknown,
  customerId: string,
  request: CheckoutPricingRequest,
  snapshot: CheckoutPricingSnapshot,
  secret: string,
  now = new Date(),
): boolean {
  if (typeof token !== 'string' || !secret) return false;
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra !== undefined) return false;
  const expectedSignature = crypto.createHmac('sha256', secret).update(encoded).digest();
  let actualSignature: Buffer;
  try { actualSignature = Buffer.from(suppliedSignature, 'base64url'); } catch { return false; }
  if (actualSignature.length !== expectedSignature.length
    || !crypto.timingSafeEqual(actualSignature, expectedSignature)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ConfirmationPayload;
    return payload.v === 1
      && payload.customerId === customerId
      && payload.exp > now.getTime()
      && payload.requestHash === hash(normalizedRequest(customerId, request))
      && payload.priceHash === hash(snapshot);
  } catch {
    return false;
  }
}

export function getV1QuotationExpiry(now: Date): Date {
  return new Date(now.getTime() + PRICING_POLICY_V1.quotationValidityMs);
}
