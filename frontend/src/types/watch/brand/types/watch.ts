export type WatchBrandId = 'apple-watch' | 'samsung' | 'xiaomi';

export interface WatchBrandColor {
  name: string;
  hex: string;
  image?: string;
}

export interface WatchBrandModel {
  id: string;
  slug: string;
  brand: WatchBrandId;
  family: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  colors: WatchBrandColor[];
  specs: {
    display: string;
    chipset: string;
    battery: string;
    storage: string;
  };
  featured?: boolean;
}

export interface WatchBrandConfig {
  id: WatchBrandId;
  label: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  accent: string;
  accentSoft: string;
  dark: string;
  allProductsDescription: string;
  experience: {
    eyebrow: string;
    title: string;
    copy: string;
    detail: string;
  };
  whyTitle: string;
  whyPillars: {
    title: string;
    copy: string;
  }[];
  finalTitle: string;
  finalCopy: string;
}