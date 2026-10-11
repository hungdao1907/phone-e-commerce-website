import type { QuotationPricing } from './quotation-workflow.service';

export type PriceOfferSource = 'sale_price' | 'campaign';
export type DiscountSource = 'promo' | 'reward';
export type DiscountType = 'fixed' | 'percentage';
export type CatalogPriceStrategy = 'regular' | 'lowest_valid_offer';
export type DiscountStackingStrategy = 'subtotal' | 'sequential' | 'best_of';
export type ZeroUsageLimitPolicy = 'unlimited' | 'exhausted';

export type PriceOffer = {
  source: PriceOfferSource;
  /** A fixed unit selling price, used by sale_price offers. */
  price?: number;
  /** A discount applied to the original unit price, used by campaign offers. */
  discountType?: DiscountType;
  discountValue?: number;
  isActive?: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

export type PricingLineInput = {
  variantId: string;
  quantity: number;
  /** Read from the persisted ProductVariant by trusted backend code. */
  price: number;
  salePrice?: number | null;
  /** Offers must be resolved from trusted backend campaign/catalog data. */
  offers?: PriceOffer[];
};

export type CartDiscountRule = {
  id: string;
  source: DiscountSource;
  type: DiscountType;
  value: number;
  isActive?: boolean;
  minimumSubtotal?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  /** Omit usageLimit when this rule has no usage cap. */
  usageLimit?: number | null;
  usedCount?: number;
};

export type ShippingPolicy = {
  method: 'delivery' | 'pickup';
  deliveryFee: number;
  freeShippingThreshold?: number | null;
  rewardFreeShipping?: boolean;
};

export type PricingPolicy = {
  catalogPriceStrategy: CatalogPriceStrategy;
  discountStacking: DiscountStackingStrategy;
  zeroUsageLimitPolicy: ZeroUsageLimitPolicy;
  discounts: CartDiscountRule[];
  shipping: ShippingPolicy;
};

export type PriceSnapshot = {
  unitPrice: number;
  originalUnitPrice: number | null;
  saleUnitPrice: number | null;
};

export class PricingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingInputError';
  }
}

function assertMoney(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new PricingInputError(`${label} must be a non-negative safe integer amount in VND.`);
  }
}

function parsePolicyDate(value: Date | string | null | undefined, label: string): number | null {
  if (value === undefined || value === null) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) throw new PricingInputError(`${label} is not a valid date.`);
  return timestamp;
}

function assertPercentage(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100) {
    throw new PricingInputError(`${label} must be an integer from 0 to 100.`);
  }
}

function discountAmount(base: number, type: DiscountType, value: number, label: string): number {
  assertMoney(value, `${label} value`);
  if (type === 'percentage') {
    assertPercentage(value, `${label} percentage`);
    return Math.floor(base / 100) * value + Math.floor(((base % 100) * value) / 100);
  }
  if (type !== 'fixed') throw new PricingInputError(`${label} has an unsupported discount type.`);
  return value;
}

function isOfferActive(offer: PriceOffer, now: number): boolean {
  if (offer.isActive === false) return false;
  const startsAt = parsePolicyDate(offer.startDate, 'Price offer startDate');
  const endsAt = parsePolicyDate(offer.endDate, 'Price offer endDate');
  return (startsAt === null || startsAt <= now) && (endsAt === null || endsAt >= now);
}

function resolveOfferPrice(originalPrice: number, offer: PriceOffer): number {
  if (offer.source !== 'sale_price' && offer.source !== 'campaign') {
    throw new PricingInputError('Price offer source is invalid.');
  }
  if (offer.source === 'sale_price') {
    assertMoney(offer.price, 'Sale price');
    if (offer.price > originalPrice) {
      throw new PricingInputError('Sale price cannot exceed the original unit price.');
    }
    return offer.price;
  }

  if (!offer.discountType || offer.discountValue === undefined) {
    throw new PricingInputError('Campaign offers require a discount type and value.');
  }
  const amount = discountAmount(originalPrice, offer.discountType, offer.discountValue, 'Campaign discount');
  return Math.max(0, originalPrice - amount);
}

function resolveLinePrice(
  line: PricingLineInput,
  strategy: CatalogPriceStrategy,
  now: number,
): { unitPrice: number; source: PriceOfferSource | null } {
  assertMoney(line.price, 'Original unit price');
  if (line.salePrice !== undefined && line.salePrice !== null) {
    assertMoney(line.salePrice, 'Sale price');
    if (line.salePrice > line.price) throw new PricingInputError('Sale price cannot exceed the original unit price.');
  }
  if (line.offers !== undefined && !Array.isArray(line.offers)) {
    throw new PricingInputError('Price offers must be an array.');
  }
  const offers = [...(line.offers || [])];
  if (line.salePrice !== undefined && line.salePrice !== null) {
    offers.push({ source: 'sale_price', price: line.salePrice });
  }

  if (strategy === 'regular') return { unitPrice: line.price, source: null };
  const activeOffers = offers.filter(offer => isOfferActive(offer, now));
  let selected = { unitPrice: line.price, source: null as PriceOfferSource | null };
  for (const offer of activeOffers) {
    const candidate = resolveOfferPrice(line.price, offer);
    if (candidate < selected.unitPrice) selected = { unitPrice: candidate, source: offer.source };
  }
  return selected;
}

function validateDiscountRule(rule: CartDiscountRule): void {
  if (!rule.id || (rule.source !== 'promo' && rule.source !== 'reward')) {
    throw new PricingInputError('Discount rule id and source are required.');
  }
  if (rule.type !== 'fixed' && rule.type !== 'percentage') {
    throw new PricingInputError(`Discount ${rule.id} has an unsupported discount type.`);
  }
  assertMoney(rule.value, `Discount ${rule.id}`);
  if (rule.type === 'percentage') assertPercentage(rule.value, `Discount ${rule.id} percentage`);
  if (rule.minimumSubtotal !== undefined) assertMoney(rule.minimumSubtotal, `Discount ${rule.id} minimumSubtotal`);
  if (rule.usageLimit !== undefined && rule.usageLimit !== null) {
    if (!Number.isSafeInteger(rule.usageLimit) || rule.usageLimit < 0) {
      throw new PricingInputError(`Discount ${rule.id} usageLimit must be a non-negative integer.`);
    }
    const usedCount = rule.usedCount ?? 0;
    if (!Number.isSafeInteger(usedCount) || usedCount < 0) {
      throw new PricingInputError(`Discount ${rule.id} usedCount must be a non-negative integer.`);
    }
  }
}

export type DiscountBreakdownItem = {
  id: string;
  source: DiscountSource;
  requestedAmount: number;
  appliedAmount: number;
  eligible: boolean;
  reason?: 'inactive' | 'not_started' | 'expired' | 'minimum_subtotal' | 'usage_limit';
};

function calculateCartDiscounts(
  subtotal: number,
  policy: Pick<PricingPolicy, 'discounts' | 'discountStacking' | 'zeroUsageLimitPolicy'>,
  now: number,
): { items: DiscountBreakdownItem[]; discountAmount: number } {
  if (policy.discountStacking === 'best_of') {
    const candidates: Array<{ index: number; amount: number }> = [];
    const items: DiscountBreakdownItem[] = [];
    for (const rule of policy.discounts) {
      validateDiscountRule(rule);
      let reason: DiscountBreakdownItem['reason'];
      const startsAt = parsePolicyDate(rule.startDate, `Discount ${rule.id} startDate`);
      const endsAt = parsePolicyDate(rule.endDate, `Discount ${rule.id} endDate`);
      if (rule.isActive === false) reason = 'inactive';
      else if (startsAt !== null && startsAt > now) reason = 'not_started';
      else if (endsAt !== null && endsAt < now) reason = 'expired';
      else if (subtotal < (rule.minimumSubtotal || 0)) reason = 'minimum_subtotal';
      else if (rule.usageLimit !== undefined && rule.usageLimit !== null) {
        const usedCount = rule.usedCount ?? 0;
        const limitReached = rule.usageLimit === 0
          ? policy.zeroUsageLimitPolicy === 'exhausted'
          : usedCount >= rule.usageLimit;
        if (limitReached) reason = 'usage_limit';
      }

      if (reason) {
        items.push({ id: rule.id, source: rule.source, requestedAmount: 0, appliedAmount: 0, eligible: false, reason });
        continue;
      }
      const requestedAmount = discountAmount(subtotal, rule.type, rule.value, `Discount ${rule.id}`);
      const appliedAmount = Math.min(subtotal, requestedAmount);
      items.push({ id: rule.id, source: rule.source, requestedAmount, appliedAmount: 0, eligible: true });
      candidates.push({ index: items.length - 1, amount: appliedAmount });
    }

    // Stable tie-break: the first eligible rule wins. The V1 adapter orders Promo
    // before Reward, so equal savings preserve the customer's explicitly entered code.
    const winner = candidates.reduce<{ index: number; amount: number } | null>(
      (best, candidate) => !best || candidate.amount > best.amount ? candidate : best,
      null,
    );
    if (winner && winner.amount > 0) items[winner.index].appliedAmount = winner.amount;
    return { items, discountAmount: winner?.amount || 0 };
  }

  let remaining = subtotal;
  const items: DiscountBreakdownItem[] = [];

  for (const rule of policy.discounts) {
    validateDiscountRule(rule);
    let reason: DiscountBreakdownItem['reason'];
    const startsAt = parsePolicyDate(rule.startDate, `Discount ${rule.id} startDate`);
    const endsAt = parsePolicyDate(rule.endDate, `Discount ${rule.id} endDate`);
    if (rule.isActive === false) reason = 'inactive';
    else if (startsAt !== null && startsAt > now) reason = 'not_started';
    else if (endsAt !== null && endsAt < now) reason = 'expired';
    else if (subtotal < (rule.minimumSubtotal || 0)) reason = 'minimum_subtotal';
    else if (rule.usageLimit !== undefined && rule.usageLimit !== null) {
      const usedCount = rule.usedCount ?? 0;
      const limitReached = rule.usageLimit === 0
        ? policy.zeroUsageLimitPolicy === 'exhausted'
        : usedCount >= rule.usageLimit;
      if (limitReached) reason = 'usage_limit';
    }

    if (reason) {
      items.push({ id: rule.id, source: rule.source, requestedAmount: 0, appliedAmount: 0, eligible: false, reason });
      continue;
    }

    const calculationBase = policy.discountStacking === 'subtotal' ? subtotal : remaining;
    const requestedAmount = discountAmount(calculationBase, rule.type, rule.value, `Discount ${rule.id}`);
    const appliedAmount = Math.min(remaining, requestedAmount);
    remaining -= appliedAmount;
    items.push({ id: rule.id, source: rule.source, requestedAmount, appliedAmount, eligible: true });
  }

  return { items, discountAmount: subtotal - remaining };
}

function calculateShipping(subtotal: number, policy: ShippingPolicy): {
  amount: number;
  method: ShippingPolicy['method'];
  free: boolean;
  reason: 'pickup' | 'reward' | 'threshold' | 'standard';
} {
  if (policy.method !== 'delivery' && policy.method !== 'pickup') {
    throw new PricingInputError('Shipping method must be delivery or pickup.');
  }
  assertMoney(policy.deliveryFee, 'Delivery fee');
  if (policy.freeShippingThreshold !== undefined && policy.freeShippingThreshold !== null) {
    assertMoney(policy.freeShippingThreshold, 'Free shipping threshold');
  }
  if (policy.method === 'pickup') return { amount: 0, method: 'pickup', free: true, reason: 'pickup' };
  if (policy.rewardFreeShipping) return { amount: 0, method: 'delivery', free: true, reason: 'reward' };
  if (policy.freeShippingThreshold !== undefined && policy.freeShippingThreshold !== null
    && subtotal >= policy.freeShippingThreshold) {
    return { amount: 0, method: 'delivery', free: true, reason: 'threshold' };
  }
  return { amount: policy.deliveryFee, method: 'delivery', free: policy.deliveryFee === 0, reason: 'standard' };
}

export function calculateSharedPricing(
  lines: PricingLineInput[],
  policy: PricingPolicy,
  now = new Date(),
) {
  if (!Array.isArray(lines) || lines.length === 0) throw new PricingInputError('At least one pricing line is required.');
  if (policy.catalogPriceStrategy !== 'regular' && policy.catalogPriceStrategy !== 'lowest_valid_offer') {
    throw new PricingInputError('A valid catalog price strategy is required.');
  }
  if (policy.discountStacking !== 'subtotal' && policy.discountStacking !== 'sequential' && policy.discountStacking !== 'best_of') {
    throw new PricingInputError('A valid discount stacking strategy is required.');
  }
  if (policy.zeroUsageLimitPolicy !== 'unlimited' && policy.zeroUsageLimitPolicy !== 'exhausted') {
    throw new PricingInputError('A valid zero usage limit policy is required.');
  }
  if (!Number.isFinite(now.getTime())) throw new PricingInputError('Pricing evaluation time is invalid.');

  const nowTimestamp = now.getTime();
  let originalSubtotal = 0;
  let subtotal = 0;
  const catalogDiscountBySource: Record<PriceOfferSource, number> = { sale_price: 0, campaign: 0 };
  const pricedLines = lines.map(line => {
    if (!line || typeof line.variantId !== 'string' || !line.variantId.trim()) {
      throw new PricingInputError('Each pricing line requires a variant id.');
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new PricingInputError('Each quantity must be a positive safe integer.');
    }

    const resolved = resolveLinePrice(line, policy.catalogPriceStrategy, nowTimestamp);
    const originalLineTotal = line.price * line.quantity;
    const lineSubtotal = resolved.unitPrice * line.quantity;
    if (!Number.isSafeInteger(originalLineTotal) || !Number.isSafeInteger(lineSubtotal)) {
      throw new PricingInputError('Pricing line total exceeds the safe integer range.');
    }
    originalSubtotal += originalLineTotal;
    subtotal += lineSubtotal;
    if (!Number.isSafeInteger(originalSubtotal) || !Number.isSafeInteger(subtotal)) {
      throw new PricingInputError('Pricing subtotal exceeds the safe integer range.');
    }
    const catalogDiscountAmount = originalLineTotal - lineSubtotal;
    if (resolved.source) catalogDiscountBySource[resolved.source] += catalogDiscountAmount;

    return {
      variantId: line.variantId,
      quantity: line.quantity,
      originalUnitPrice: line.price,
      effectiveUnitPrice: resolved.unitPrice,
      originalLineTotal,
      lineSubtotal,
      catalogDiscountSource: resolved.source,
      catalogDiscountAmount,
    };
  });

  const cartDiscounts = calculateCartDiscounts(subtotal, policy, nowTimestamp);
  const shipping = calculateShipping(subtotal, policy.shipping);
  const grandTotal = Math.max(0, subtotal - cartDiscounts.discountAmount) + shipping.amount;
  if (!Number.isSafeInteger(grandTotal)) throw new PricingInputError('Grand total exceeds the safe integer range.');

  const catalogDiscountAmount = originalSubtotal - subtotal;
  return {
    lines: pricedLines,
    originalSubtotal,
    subtotal,
    discountBreakdown: {
      catalogBySource: catalogDiscountBySource,
      catalogDiscountAmount,
      cart: cartDiscounts.items,
      cartDiscountAmount: cartDiscounts.discountAmount,
      totalSavingsAmount: catalogDiscountAmount + cartDiscounts.discountAmount,
    },
    shipping,
    grandTotal,
  };
}

export function calculateSharedTotals(
  subtotal: number,
  policy: Pick<PricingPolicy, 'discounts' | 'discountStacking' | 'zeroUsageLimitPolicy' | 'shipping'>,
  now = new Date(),
) {
  assertMoney(subtotal, 'Subtotal');
  if (!Number.isFinite(now.getTime())) throw new PricingInputError('Pricing evaluation time is invalid.');
  const cartDiscounts = calculateCartDiscounts(subtotal, policy, now.getTime());
  const shipping = calculateShipping(subtotal, policy.shipping);
  const grandTotal = Math.max(0, subtotal - cartDiscounts.discountAmount) + shipping.amount;
  if (!Number.isSafeInteger(grandTotal)) throw new PricingInputError('Grand total exceeds the safe integer range.');
  return {
    discountBreakdown: cartDiscounts.items,
    discountAmount: cartDiscounts.discountAmount,
    shipping,
    grandTotal,
  };
}

export function isValidPriceSnapshot(snapshot: PriceSnapshot): boolean {
  return Number.isSafeInteger(snapshot.unitPrice) && snapshot.unitPrice >= 0
    && (snapshot.originalUnitPrice === null
      || (Number.isSafeInteger(snapshot.originalUnitPrice) && snapshot.originalUnitPrice >= 0))
    && (snapshot.saleUnitPrice === null
      || (Number.isSafeInteger(snapshot.saleUnitPrice) && snapshot.saleUnitPrice >= 0));
}

/** Missing original-price fields identify legacy quote snapshots; compare their known unit price only. */
export function quotationPriceSnapshotMatches(expected: PriceSnapshot, current: PriceSnapshot): boolean {
  if (!isValidPriceSnapshot(expected) || !isValidPriceSnapshot(current) || expected.unitPrice !== current.unitPrice) {
    return false;
  }
  if (expected.originalUnitPrice === null) return true;
  return expected.originalUnitPrice === current.originalUnitPrice
    && expected.saleUnitPrice === current.saleUnitPrice;
}

export type QuotationPricingAdapterOptions = {
  policy: PricingPolicy;
  generateQuoteNumber: () => string;
  now?: () => Date;
  /** Resolve active, target-matched campaign offers from trusted backend data. */
  resolveCampaignOffers?: (variant: any) => PriceOffer[];
};

/** Adapter for createQuotationDraft/approveAndConvertQuotation. The caller supplies backend-loaded policy and variants. */
export function createQuotationPricingAdapter(options: QuotationPricingAdapterOptions): QuotationPricing {
  const now = options.now || (() => new Date());
  return {
    resolveVariantPrice(variant: any): PriceSnapshot {
      const line: PricingLineInput = {
        variantId: String(variant?.id || ''),
        quantity: 1,
        price: variant?.price,
        salePrice: variant?.salePrice ?? null,
        offers: options.resolveCampaignOffers?.(variant) || [],
      };
      const resolved = resolveLinePrice(line, options.policy.catalogPriceStrategy, now().getTime());
      return {
        unitPrice: resolved.unitPrice,
        originalUnitPrice: variant?.price,
        saleUnitPrice: variant?.salePrice ?? null,
      };
    },
    calculateTotals(subtotal: number) {
      const totals = calculateSharedTotals(subtotal, options.policy, now());
      return {
        discountAmount: totals.discountAmount,
        shippingFee: totals.shipping.amount,
        totalAmount: totals.grandTotal,
      };
    },
    generateQuoteNumber: options.generateQuoteNumber,
  };
}
