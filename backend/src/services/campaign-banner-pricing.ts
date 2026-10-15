import { calculateSharedPricing } from './pricing.service';
import { resolveV1Campaign } from './checkout-pricing.service';

/** Catalog display uses the same approved offers as checkout, never salePrice + banner discount. */
export function getBannerDisplayPricing(product: any, variantId: string | null, campaigns: any[], now = new Date()) {
  const variants = (product.variants || []).filter((v: any) => !variantId || v.id === variantId);
  const prices = variants.map((variant: any) => {
    const campaign = resolveV1Campaign(product, campaigns, variant.price, now);
    const priced = calculateSharedPricing([{ variantId: variant.id, quantity: 1, price: variant.price, salePrice: variant.salePrice,
      offers: campaign ? [{ source: 'campaign', discountType: campaign.discountType, discountValue: campaign.discountValue }] : [],
    }], { catalogPriceStrategy: 'lowest_valid_offer', discountStacking: 'best_of', zeroUsageLimitPolicy: 'unlimited', discounts: [], shipping: { method: 'pickup', deliveryFee: 0 } }, now).lines[0];
    return { variantId: variant.id, originalPrice: priced.originalUnitPrice, salePrice: priced.effectiveUnitPrice,
      discountAmount: priced.originalUnitPrice - priced.effectiveUnitPrice };
  });
  prices.sort((a: any,b: any) => a.salePrice-b.salePrice);
  return prices[0] || null;
}
