import { useEffect, useState, type CSSProperties } from 'react';
import { getWatchBrandConfig, getWatchBrandProductsByBrand } from '../../../data/watch/brand/data/index';
import {
  WatchBrandAllProductsSection,
  WatchBrandExperienceSection,
  WatchBrandFeaturedProductsSection,
  WatchBrandFinalCTASection,
  WatchBrandHeroSection,
  WatchWhyBrandSection,
} from '../../../components/watch/brand/sections/index';
import type { WatchBrandId, WatchBrandModel } from '../../../types/watch/brand/types/index';
import '@/css/watch.css';

interface WatchBrandPageProps {
  brand: WatchBrandId;
}

export function WatchBrandPage({ brand }: WatchBrandPageProps) {
  const config = getWatchBrandConfig(brand);
  const fallbackProducts = getWatchBrandProductsByBrand(brand);
  
  const [products, setProducts] = useState<WatchBrandModel[]>(fallbackProducts);

  useEffect(() => {
    document.title = config.label + ' - Cửa Hàng Công Nghệ';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [config]);

  useEffect(() => {
    setProducts(getWatchBrandProductsByBrand(brand));

    const fetchProducts = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`)
        ]);

        if (productsRes.ok && categoriesRes.ok) {
          const data = await productsRes.json();
          const categories = await categoriesRes.json();
          
          const watchCategory = categories.find((c: any) => 
            c.slug === 'ong-ho-thong-minh' || c.slug === 'dong-ho-thong-minh' || c.slug === 'watch'
          );
          
          const watchCategoryIds = watchCategory 
            ? [watchCategory.id, ...categories.filter((c: any) => c.parentId === watchCategory.id).map((c: any) => c.id)]
            : [];

          // Filter by brand (category name or product name) AND ensure it's a watch
          const searchBrand = brand.replace(/-/g, ' ').toLowerCase();
          const apiProducts = data.filter((p: any) =>
            watchCategoryIds.includes(p.categoryId) && 
            (p.category?.name?.toLowerCase().includes(searchBrand) ||
            p.name?.toLowerCase().includes(searchBrand))
          );

          if (apiProducts.length > 0) {
            const mappedProducts: WatchBrandModel[] = apiProducts.map((ap: any, idx: number) => {
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
                if (!ap.specifications) return '';
                if (ap.specifications.length > 0 && ap.specifications[0].title !== undefined) {
                  for (const group of ap.specifications) {
                    const item = group.items?.find((i: any) => (i.label || '').toLowerCase().includes(keyword));
                    if (item) return item.value;
                  }
                  return '';
                }
                const spec = ap.specifications.find((s: any) => (s.key || s.label || '').toLowerCase().includes(keyword));
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
        console.error('Failed to fetch watch products for', brand, error);
      }
    };

    fetchProducts();
  }, [brand]);

  const style = {
    '--watch-accent': config.accent,
    '--watch-accent-soft': config.accentSoft,
    '--watch-dark': config.dark,
  } as CSSProperties;

  return (
    <div className="watch-page min-h-screen bg-white text-neutral-950" style={style}>
      <main>
        <WatchBrandHeroSection config={config} />
        <WatchBrandFeaturedProductsSection config={config} products={products} />
        <WatchBrandAllProductsSection config={config} products={products} />
        <WatchBrandExperienceSection config={config} products={products} />
        <WatchWhyBrandSection config={config} />
        <WatchBrandFinalCTASection config={config} />
      </main>
    </div>
  );
}

export default WatchBrandPage;