export interface PurchaseProductColor {
  id: string;
  name: string;
  hex: string;
  images?: string[];
}

export interface PurchaseProductOption {
  id: string;
  label: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorId: string;
  storageId: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images?: string[];
}

export interface PurchaseProduct {
  id: string;
  slug: string;
  category?: 'phone' | 'tablet' | 'laptop';
  brand: string;
  name: string;
  tagline: string;
  badge?: string;
  defaultImage: string;
  galleryImages: string[];
  colors: PurchaseProductColor[];
  storageOptions: PurchaseProductOption[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
}