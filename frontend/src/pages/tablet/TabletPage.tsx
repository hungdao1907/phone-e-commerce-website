import { useEffect, type CSSProperties } from 'react';
import { getTabletBrandConfig, getTabletProductsByBrand } from './data';
import {
  TabletAllProductsSection,
  TabletBrandExperienceSection,
  TabletFeaturedProductsSection,
  TabletFinalCTASection,
  TabletHeroSection,
  TabletWhyBrandSection,
} from './sections';
import type { TabletBrandId } from './types';
import '@/css/tablet.css';

interface TabletPageProps {
  brand: TabletBrandId;
}

export function TabletPage({ brand }: TabletPageProps) {
  const config = getTabletBrandConfig(brand);
  const products = getTabletProductsByBrand(brand);

  useEffect(() => {
    document.title = config.label + ' - Cửa Hàng Công Nghệ';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [config]);

  const style = {
    '--tablet-accent': config.accent,
    '--tablet-accent-soft': config.accentSoft,
    '--tablet-dark': config.dark,
  } as CSSProperties;

  return (
    <div className="tablet-page min-h-screen bg-white text-neutral-950" style={style}>
      <main>
        <TabletHeroSection config={config} />
        <TabletFeaturedProductsSection config={config} products={products} />
        <TabletAllProductsSection config={config} products={products} />
        <TabletBrandExperienceSection config={config} products={products} />
        <TabletWhyBrandSection config={config} />
        <TabletFinalCTASection config={config} />
      </main>
    </div>
  );
}

export default TabletPage;