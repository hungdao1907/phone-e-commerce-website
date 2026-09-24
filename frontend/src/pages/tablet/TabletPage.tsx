import { useEffect, useState, type CSSProperties } from 'react';
import { getTabletBrandConfig, getTabletProductsByBrand } from '../../data/tablet/data/index';
import {
  TabletAllProductsSection,
  TabletBrandExperienceSection,
  TabletFeaturedProductsSection,
  TabletFinalCTASection,
  TabletHeroSection,
  TabletWhyBrandSection,
} from '../../components/tablet/sections/index';
import type { TabletBrandId, TabletModel } from '../../types/tablet/types/index';
import '@/css/tablet.css';

interface TabletPageProps {
  brand: TabletBrandId;
}

export function TabletPage({ brand }: TabletPageProps) {
  const config = getTabletBrandConfig(brand);
  const fallbackProducts = getTabletProductsByBrand(brand);
  
  const [products, setProducts] = useState<TabletModel[]>(fallbackProducts);

  useEffect(() => {
    document.title = config.label + ' - Cửa Hàng Công Nghệ';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [config]);

  useEffect(() => {
    setProducts(getTabletProductsByBrand(brand));

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
        if (res.ok) {
          const data = await res.json();
          // Filter by brand (category name or product name)
          const apiProducts = data.filter((p: any) =>
            p.category?.name?.toLowerCase().includes(brand.toLowerCase()) ||
            p.name?.toLowerCase().includes(brand.toLowerCase())
          );

          if (apiProducts.length > 0) {
            const mappedProducts: TabletModel[] = apiProducts.map((ap: any, idx: number) => {
              // 1. Price
              const prices = ap.variants?.map((v: any) => v.price).filter((p: any) => p != null && p > 0) || [];
              const basePrice = prices.length > 0 ? Math.min(...prices) : (ap.basePrice || 0);
              let finalPrice = basePrice;
              let originalPrice = undefined;

              if (ap.activeCampaign) {
                originalPrice = basePrice;
                if (ap.activeCampaign.discountType === 'percentage') {
                  finalPrice = Math.max(0, basePrice - (basePrice * ap.activeCampaign.discountValue / 100));
                } else {
                  finalPrice = Math.max(0, basePrice - ap.activeCampaign.discountValue);
                }
              }

              // 2. Specifications
              const getSpec = (keyword: string) => {
                const spec = ap.specifications?.find((s: any) => s.key.toLowerCase().includes(keyword));
                return spec ? spec.value : '';
              };

              // 3. Colors
              const colorMap = new Map();
              ap.variants?.forEach((v: any) => {
                const cName = v.attributes?.['Màu sắc'];
                if (cName) {
                  if (!colorMap.has(cName)) {
                    colorMap.set(cName, {
                      name: cName,
                      hex: v.colorCode || (cName.toLowerCase().includes('đen') || cName.toLowerCase().includes('black') || cName.toLowerCase().includes('gray') ? '#4b5563' : '#e5e7eb'),
                      image: v.image && v.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${v.image}` : v.image
                    });
                  } else if (v.image && !colorMap.get(cName).image) {
                    colorMap.get(cName).image = v.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${v.image}` : v.image;
                  }
                }
              });
              const colors = Array.from(colorMap.values());

              // 4. Series/Family
              const nameLower = (ap.name || '').toLowerCase();
              let family = 'Mẫu Mới';
              if (brand === 'ipad') {
                if (nameLower.includes('pro')) family = 'iPad Pro';
                else if (nameLower.includes('air')) family = 'iPad Air';
                else if (nameLower.includes('mini')) family = 'iPad mini';
                else family = 'iPad';
              } else if (brand === 'samsung') {
                family = nameLower.includes('tab s') ? 'Galaxy Tab S Series' : 'Galaxy Tab A Series';
              } else if (brand === 'xiaomi') {
                family = 'Xiaomi Pad Series';
              }

              const resolveImageUrl = (url: string) => {
                if (!url) return undefined;
                if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
                return url;
              };

              return {
                id: ap.id,
                slug: ap.slug || ap.id,
                brand: brand,
                family: family,
                name: ap.name,
                tagline: ap.tagline || ap.description || 'Sức mạnh vượt trội.',
                description: ap.description || 'Thiết kế tinh tế với màn hình sắc nét.',
                image: resolveImageUrl(ap.image) || resolveImageUrl(ap.images?.[0]) || '/images/hero.png',
                badge: idx === 0 ? 'MỚI' : (ap.badge || undefined),
                price: finalPrice,
                originalPrice: originalPrice,
                reviewCount: ap.reviewCount || 0,
                ratingAverage: ap.ratingAverage || 0,
                colors: colors.length > 0 ? colors : [{ name: 'Space Gray', hex: '#4b5563' }],
                specs: {
                  display: getSpec('màn hình') || 'Màn hình Liquid Retina',
                  chipset: getSpec('chip') || 'Chip thế hệ mới',
                  battery: getSpec('pin') || 'Pin cả ngày',
                  storage: getSpec('lưu trữ') || getSpec('dung lượng') || getSpec('rom') || 'Từ 64GB',
                },
                featured: idx < 3,
              };
            });

            setProducts(mappedProducts);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tablet products for', brand, error);
      }
    };

    fetchProducts();
  }, [brand]);

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