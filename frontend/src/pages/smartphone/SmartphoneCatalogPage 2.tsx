import React, { useEffect } from 'react';
import { useLenis } from 'lenis/react';
import {
  BrandHeroSection,
  BrandFeaturedSection,
  BrandExperienceSection,
  BrandAllProductsSection,
  BrandWhySection,
  BrandFinalCTASection,
} from '@/components/smartphone';
import type { BrandConfig, BrandModel } from '@/types/smartphone';
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
      className={`brand-page ${config.cssClass} w-full min-h-screen bg-black text-white selection:bg-neutral-800 selection:text-white`}
      style={{
        ['--brand-accent' as string]: config.accent,
        ['--brand-accent-soft' as string]: config.accentSoft,
        ['--brand-dark' as string]: config.dark,
      }}
    >
      <main className="w-full">
        {/* SECTION 1: HERO SHOWCASE (Cinematic full-bleed slider with floating specs card) */}
        <BrandHeroSection config={config} />

        {/* SECTION 2: FLAGSHIP SPOTLIGHT (Bento grid highlighting the brand's top flagships) */}
        <BrandFeaturedSection config={config} products={products} />

        {/* SECTION 3: BRAND INNOVATION & ECOSYSTEM (Core technological edge, AI, camera & performance) */}
        <BrandExperienceSection config={config} products={products} />

        {/* SECTION 4: ALL PRODUCTS CATALOG (Smart series tabs, live search, sort filters & luxury cards) */}
        <BrandAllProductsSection config={config} products={products} />

        {/* SECTION 5: WHY CHOOSE BRAND & STORE GUARANTEES (Editorial brand values and trust commitments) */}
        <BrandWhySection config={config} />

        {/* SECTION 6: GRAND FINALE CTA (Multi-device composition, store support & inquiry hotline) */}
        <BrandFinalCTASection config={config} />
      </main>
    </div>
  );
}

export default SmartphoneCatalogPage;
