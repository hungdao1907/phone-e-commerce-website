import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface HomeFeaturedVariant {
  id: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string | null;
}

export interface HomeFeaturedProductData {
  id: string;
  name: string;
  status: string;
  description: string | null;
  brand: string | null;
  image: string | null;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
  variants: HomeFeaturedVariant[];
}

export interface HomeFeaturedProduct {
  id: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  product: HomeFeaturedProductData;
}

export async function fetchHomeFeaturedProducts(signal?: AbortSignal): Promise<HomeFeaturedProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/home-featured-products`, { signal });
  if (!response.ok) throw new Error('Khong the tai san pham noi bat.');

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { featuredProducts?: unknown }).featuredProducts)) {
    return [];
  }

  return (payload as { featuredProducts: HomeFeaturedProduct[] }).featuredProducts;
}

export function getFeaturedProductImage(product: HomeFeaturedProductData): string {
  const source = product.image
    || product.images.find((image) => Boolean(image))
    || product.variants.find((variant) => Boolean(variant.image))?.image
    || '';

  return resolveMediaUrl(source);
}

export function getFeaturedProductPrice(product: HomeFeaturedProductData): number | null {
  const prices = product.variants
    .map((variant) => variant.price)
    .filter((price): price is number => typeof price === 'number' && price > 0);
  const salePrices = product.variants
    .map((variant) => variant.salePrice)
    .filter((price): price is number => typeof price === 'number' && price > 0);

  if (salePrices.length > 0) return Math.min(...salePrices);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function formatFeaturedProductPrice(product: HomeFeaturedProductData): string {
  const price = getFeaturedProductPrice(product);
  if (price === null) return 'Lien he';

  return `Tu ${new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)}`;
}
