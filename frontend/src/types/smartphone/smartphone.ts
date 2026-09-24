import React from 'react';
export type SmartphoneBrandId = 'iphone' | 'samsung' | 'xiaomi' | 'oppo';

export interface BrandColor {
  name: string;
  hex: string;
  image?: string;
}

export interface BrandModel {
  id: string;
  slug?: string;
  brand: SmartphoneBrandId | string;
  name: string;
  series: string;
  tagline: string;
  description: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  image: string;
  accentColor: string;
  specs: {
    display: string;
    chipset: string;
    camera: string;
    battery: string;
  };
  colors: BrandColor[];
  featured?: boolean;
  ratingAverage?: number;
  reviewCount?: number;
}

export type SmartphoneModel = BrandModel;

export interface BrandPillar {
  num: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  title: string;
  copy: string;
  accent: string;
}

export interface BrandProductGroupDefinition {
  id: string;
  series: string;
  label: string;
  title: string;
  description: string;
  badge: string;
  tagColor: string;
  accentGradient: string;
}

export type BrandProductGroup = BrandProductGroupDefinition;

export interface BrandConfig {
  /** Brand identifier */
  id: SmartphoneBrandId | string;
  /** Display name */
  brand: string;
  /** Page title for SEO */
  pageTitle: string;
  /** CSS class prefix for the page */
  cssClass: string;

  /* ─── Color System ─── */
  /** Primary accent color */
  accent: string;
  /** Secondary/soft accent */
  accentSoft: string;
  /** Dark background color */
  dark: string;
  /** Selection color */
  selectionColor: string;

  /* ─── Gradient Text Classes ─── */
  gradientText: string;
  gradientAI: string;

  /* ─── Featured Products (presentation metadata) ─── */
  featuredBadgeText: string;
  featuredHeadlinePrefix: string;
  featuredHeadlineHighlight: string;
  featuredDescription: string;

  /* ─── All Products (presentation metadata) ─── */
  allProductsHeadlinePrefix: string;
  allProductsHeadlineHighlight: string;
  allProductsDescription: string;
  productGroups: BrandProductGroupDefinition[];

  /* ─── Why Brand ─── */
  whyBrandEyebrow: string;
  whyBrandHeadline: string;
  whyBrandSubheadline: string;
  whyBrandDescription: string;
  whyBrandWatermark: string;
  pillars: BrandPillar[];

  /* ─── Final CTA ─── */
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaSubheadline: string;
  ctaDescription: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  ctaImages: { src: string; alt: string; position: 'left' | 'center' | 'right' }[];

  /* ─── Consultation Banner ─── */
  consultTitle: string;
  consultDescription: string;
}

export type SmartphoneBrandConfig = BrandConfig;
