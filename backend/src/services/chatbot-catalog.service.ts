import { calculateV1EffectiveUnitPrice } from './checkout-pricing.service';

export const MAX_CHATBOT_CATALOG_PRODUCTS = 12;

export class ChatbotCatalogInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatbotCatalogInputError';
  }
}

export type ChatbotCatalogDatabase = {
  product: { findMany(args: any): Promise<any[]> };
  campaign: { findMany(args: any): Promise<any[]> };
};

function safeVariantAttributes(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean> = {};
  for (const [key, attribute] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    if (!/^[\p{L}\p{N}_ -]{1,40}$/u.test(key)) continue;
    if (typeof attribute === 'string' && attribute.length <= 100) result[key] = attribute;
    else if (typeof attribute === 'boolean' || (typeof attribute === 'number' && Number.isFinite(attribute))) {
      result[key] = attribute;
    }
  }
  return result;
}

/** The chatbot may suggest IDs only; Backend resolves all customer-visible product data. */
export function parseChatbotCatalogIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CHATBOT_CATALOG_PRODUCTS) {
    throw new ChatbotCatalogInputError(`Provide between 1 and ${MAX_CHATBOT_CATALOG_PRODUCTS} product IDs.`);
  }

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(item)) {
      throw new ChatbotCatalogInputError('Product IDs are invalid.');
    }
    if (!ids.includes(item)) ids.push(item);
  }
  return ids;
}

export async function resolveChatbotCatalogProducts(
  database: ChatbotCatalogDatabase,
  rawIds: unknown,
  now = new Date(),
) {
  const ids = parseChatbotCatalogIds(rawIds);
  const [products, campaigns] = await Promise.all([
    database.product.findMany({
      where: { id: { in: ids }, status: 'active' },
      select: {
        id: true,
        name: true,
        brand: true,
        description: true,
        image: true,
        categoryId: true,
        status: true,
        variants: { select: { id: true, sku: true, attributes: true, price: true, salePrice: true, stock: true } },
      },
    }),
    database.campaign.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    }),
  ]);

  return products.map(product => {
    const variants = (Array.isArray(product.variants) ? product.variants : []).map((variant: any) => {
      const originalPrice = Number.isSafeInteger(variant.price) && variant.price >= 0 ? variant.price : null;
      let effectivePrice: number | null = null;
      if (originalPrice !== null) {
        effectivePrice = calculateV1EffectiveUnitPrice({ ...variant, product }, campaigns, now);
        if (!Number.isSafeInteger(effectivePrice) || effectivePrice < 0) effectivePrice = null;
      }
      const stock = Number.isSafeInteger(variant.stock) && variant.stock > 0 ? variant.stock : 0;
      return {
        id: variant.id,
        ...(typeof variant.sku === 'string' && variant.sku.trim() ? { sku: variant.sku.trim().slice(0, 100) } : {}),
        attributes: safeVariantAttributes(variant.attributes),
        stock,
        price: effectivePrice,
        original_price: originalPrice,
        availability: stock > 0 && effectivePrice !== null ? 'in_stock' : 'out_of_stock',
      };
    });
    const priceOptions = variants
      .filter((variant: any) => variant.price !== null && variant.original_price !== null)
      .map((variant: any) => ({
        originalPrice: variant.original_price,
        effectivePrice: variant.price,
      }))
      .sort((left: any, right: any) => left.effectivePrice - right.effectivePrice
        || left.originalPrice - right.originalPrice);
    const lowestPrice = priceOptions[0];
    const stock = variants.reduce((sum: number, variant: any) => sum + variant.stock, 0);

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      image_url: product.image,
      ...(lowestPrice ? { price: lowestPrice.effectivePrice, original_price: lowestPrice.originalPrice } : {}),
      variants,
      stock,
      availability: stock > 0 ? 'in_stock' : 'out_of_stock',
    };
  });
}
