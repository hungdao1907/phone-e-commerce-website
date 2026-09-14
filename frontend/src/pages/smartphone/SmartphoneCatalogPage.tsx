import React, { useEffect } from 'react';
import { useLenis } from 'lenis/react';
import {
  BrandHeroSection,
  BrandFeaturedSection,
  BrandAllProductsSection,
  BrandWhySection,
  BrandFinalCTASection,
} from './sections';
import type { BrandConfig, BrandModel } from './types';
import '@/css/smartphone.css';

interface SmartphoneCatalogPageProps {
  config: BrandConfig;
  products: BrandModel[];
}

export function SmartphoneCatalogPage({ config, products }: SmartphoneCatalogPageProps) {
  const lenis = useLenis();

  useEffect(() => {
    document.title = config.pageTitle;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [lenis, config.pageTitle]);

  return (
    <div
      className={`brand-page ${config.cssClass} w-full min-h-screen bg-black text-white`}
      style={{
        ['--brand-accent' as string]: config.accent,
        ['--brand-accent-soft' as string]: config.accentSoft,
        ['--brand-dark' as string]: config.dark,
      }}
    >
      <main className="w-full">
        {/* SECTION 1: HERO */}
        <BrandHeroSection config={config} />

        {/* SECTION 2: FEATURED PRODUCTS */}
        <BrandFeaturedSection config={config} products={products} />

        {/* SECTION 3: ALL PRODUCTS */}
        <BrandAllProductsSection config={config} products={products} />

        {/* SECTION 4: WHY BRAND */}
        <BrandWhySection config={config} />

        {/* SECTION 5: FINAL CTA */}
        <BrandFinalCTASection config={config} />
      </main>
    </div>
  );
}

export default SmartphoneCatalogPage;
