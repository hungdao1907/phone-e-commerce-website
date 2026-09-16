export type TabletBrandId = 'ipad' | 'samsung' | 'xiaomi';

export interface TabletColor {
  name: string;
  hex: string;
}

export interface TabletModel {
  id: string;
  slug: string;
  brand: TabletBrandId;
  family: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  colors: TabletColor[];
  specs: {
    display: string;
    chipset: string;
    battery: string;
    storage: string;
  };
  featured?: boolean;
}

export interface TabletBrandConfig {
  id: TabletBrandId;
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