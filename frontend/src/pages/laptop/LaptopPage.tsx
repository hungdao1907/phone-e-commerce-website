import { useEffect, type CSSProperties } from 'react';
import { getLaptopBrandConfig, getLaptopProductsByBrand } from './data';
import {
  LaptopAllProductsSection,
  LaptopBrandExperienceSection,
  LaptopFeaturedSection,
  LaptopFinalCTASection,
  LaptopHeroSection,
  LaptopWhySection,
} from './sections';
import type { LaptopBrandId } from './types';
import './laptop.css';

interface LaptopPageProps {
  brand: LaptopBrandId;
}

export function LaptopPage({ brand }: LaptopPageProps) {
  const config = getLaptopBrandConfig(brand);
  const products = getLaptopProductsByBrand(brand);

  useEffect(() => {
    document.title = config.label + ' - Cửa Hàng Công Nghệ';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [config]);

  const style = {
    '--laptop-accent': config.accent,
    '--laptop-accent-soft': config.accentSoft,
    '--laptop-dark': config.dark,
  } as CSSProperties;

  return (
    <div className="laptop-page min-h-screen bg-white text-neutral-950" style={style}>
      <main>
        <LaptopHeroSection config={config} />
        <LaptopFeaturedSection config={config} products={products} />
        <LaptopAllProductsSection config={config} products={products} />
        <LaptopBrandExperienceSection config={config} products={products} />
        <LaptopWhySection config={config} />
        <LaptopFinalCTASection config={config} />
      </main>
    </div>
  );
}

export default LaptopPage;
