export type LaptopBrandId = 'macbook' | 'asus' | 'lenovo';

export interface LaptopColor {
  name: string;
  hex: string;
}

export interface LaptopSpecs {
  display: string;
  processor: string;
  ram: string;
  storage: string;
  gpu?: string;
  battery: string;
}

export interface LaptopModel {
  id: string;
  slug: string;
  brand: LaptopBrandId;
  family: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  colors: LaptopColor[];
  specs: LaptopSpecs;
  featured?: boolean;
}

export interface LaptopBrandConfig {
  id: LaptopBrandId;
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
