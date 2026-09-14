import type { PurchaseProduct } from '@/types/product';

export const mockPurchaseProducts: PurchaseProduct[] = [];

export function getPurchaseProductBySlug(slug?: string) {
  return mockPurchaseProducts.find((product) => product.slug === slug);
}

export const formatPurchasePrice = (price: number) => (
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
);
