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

const BRAND_CATEGORY_SLUG_MAP: Record<WatchBrandId, string> = {
  'apple-watch': 'apple-watch',
  'samsung': 'samsung-watch',
  'xiaomi': 'xiaomi-watch',
};

const BRAND_SEARCH_KEYWORDS: Record<WatchBrandId, string[]> = {
  'apple-watch': ['apple', 'apple-watch', 'apple watch'],
  'samsung': ['samsung', 'galaxy watch', 'samsung-watch', 'galaxy-watch'],
  'xiaomi': ['xiaomi', 'xiaomi-watch', 'redmi watch', 'redmi-watch'],
};

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
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`),
        ]);

        if (productsRes.ok && categoriesRes.ok) {
          const data = await productsRes.json();
          const categories = await categoriesRes.json();
          
          const watchCategory = categories.find((c: any) => 
            c.slug === 'ong-ho-thong-minh' || c.slug === 'dong-ho-thong-minh' || c.slug === 'watch'
          );
          
          const watchCategoryIds: string[] = watchCategory
            ? [watchCategory.id, ...categories.filter((c: any) => c.parentId === watchCategory.id).map((c: any) => c.id)]
            : [];

          const targetSubcategorySlug = BRAND_CATEGORY_SLUG_MAP[brand];
          const brandCategory = categories.find((c: any) => c.slug === targetSubcategorySlug);
          const searchKeywords = BRAND_SEARCH_KEYWORDS[brand] || [brand];

          const apiProducts = data.filter((p: any) => {
            if (p.status && p.status !== 'active') return false;

            // Direct category match
            if (p.category?.slug === targetSubcategorySlug) return true;
            if (brandCategory && p.categoryId === brandCategory.id) return true;

            // Root watch category tree + brand keyword match
            const isUnderWatchTree = watchCategoryIds.includes(p.categoryId) ||
              (p.category?.parentId === watchCategory?.id) ||
              (p.category?.slug?.includes('watch') || p.category?.slug?.includes('ong-ho'));

            if (isUnderWatchTree) {
              const brandLower = (p.brand || '').toLowerCase();
              const catNameLower = (p.category?.name || '').toLowerCase();
              const prodNameLower = (p.name || '').toLowerCase();

              return searchKeywords.some((kw) =>
                brandLower.includes(kw) || catNameLower.includes(kw) || prodNameLower.includes(kw)
              );
            }

            return false;
          });

          if (apiProducts.length > 0) {
            const mappedProducts: WatchBrandModel[] = apiProducts.map((ap: any, idx: number) => {
              // 1. Price resolution
              const variantPrices = ap.variants
                ?.map((v: any) => Number(v.price))
                .filter((p: number) => !isNaN(p) && p > 0) || [];
              const basePrice = variantPrices.length > 0 ? Math.min(...variantPrices) : (Number(ap.basePrice) || 0);

              const variantSalePrices = ap.variants
                ?.map((v: any) => Number(v.salePrice))
                .filter((p: number) => !isNaN(p) && p > 0) || [];
              const minSalePrice = variantSalePrices.length > 0 ? Math.min(...variantSalePrices) : undefined;

              let finalPrice = basePrice;
              let originalPrice: number | undefined = undefined;

              if (ap.activeCampaign) {
                originalPrice = basePrice;
                if (ap.activeCampaign.discountType === 'percentage') {
                  finalPrice = Math.max(0, basePrice - (basePrice * ap.activeCampaign.discountValue / 100));
                } else {
                  finalPrice = Math.max(0, basePrice - ap.activeCampaign.discountValue);
                }
              } else if (minSalePrice !== undefined && minSalePrice < basePrice) {
                finalPrice = minSalePrice;
                originalPrice = basePrice;
              }

              // 2. Specifications resolution
              const getSpec = (keyword: string) => {
                if (!ap.specifications || !Array.isArray(ap.specifications)) return '';
                const kw = keyword.toLowerCase();

                // Check Hùng's grouped specifications first (group.items)
                for (const group of ap.specifications) {
                  if (!group || typeof group !== 'object') continue;
                  if (Array.isArray(group.items)) {
                    const item = group.items.find((i: any) => {
                      const itemLabel = (i?.label || i?.name || i?.key || '').toLowerCase();
                      return itemLabel.includes(kw);
                    });
                    if (item && item.value !== undefined && item.value !== null) return String(item.value);
                  }
                }

                // Check flat specifications (key/label/name) or group title fallback
                for (const s of ap.specifications) {
                  if (!s || typeof s !== 'object') continue;
                  const keyStr = (s.key || s.label || s.name || '').toLowerCase();
                  if (keyStr.includes(kw) && s.value !== undefined && s.value !== null) {
                    return String(s.value);
                  }
                  if (Array.isArray(s.items)) {
                    for (const item of s.items) {
                      if (!item || typeof item !== 'object') continue;
                      const itemKey = (item.label || item.name || item.key || '').toLowerCase();
                      if (itemKey.includes(kw) && item.value !== undefined && item.value !== null) {
                        return String(item.value);
                      }
                    }
                    const groupTitle = (s.title || s.group || '').toLowerCase();
                    if (groupTitle.includes(kw)) {
                      const firstVal = s.items.find((i: any) => i?.value !== undefined && i?.value !== null)?.value;
                      if (firstVal !== undefined && firstVal !== null) return String(firstVal);
                    }
                  }
                }
                return '';
              };

              // 3. Image URL helper
              const resolveImageUrl = (url?: string | null) => {
                if (!url) return undefined;
                if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
                return url;
              };

              // 4. Color variations
              const colorMap = new Map<string, { name: string; hex: string; image?: string }>();
              ap.variants?.forEach((v: any) => {
                const cName = v.attributes?.['Màu sắc'];
                if (cName && typeof cName === 'string') {
                  const trimmedName = cName.trim();
                  if (!colorMap.has(trimmedName)) {
                    colorMap.set(trimmedName, {
                      name: trimmedName,
                      hex: v.colorCode || (trimmedName.toLowerCase().includes('đen') || trimmedName.toLowerCase().includes('black') || trimmedName.toLowerCase().includes('gray') || trimmedName.toLowerCase().includes('xám') ? '#333333' : '#E5E7EB'),
                      image: v.image ? resolveImageUrl(v.image) : undefined,
                    });
                  } else if (v.image && !colorMap.get(trimmedName)?.image) {
                    const existing = colorMap.get(trimmedName)!;
                    existing.image = resolveImageUrl(v.image);
                  }
                }
              });
              const colors = Array.from(colorMap.values());

              // 5. Smart family naming
              const nameLower = (ap.name || '').toLowerCase();
              let family = 'Mẫu Mới';
              if (brand === 'apple-watch') {
                if (nameLower.includes('ultra')) family = 'Apple Watch Ultra';
                else if (nameLower.includes('series') || nameLower.includes('s10') || nameLower.includes('s11')) family = 'Apple Watch Series';
                else if (nameLower.includes('se')) family = 'Apple Watch SE';
                else family = 'Apple Watch';
              } else if (brand === 'samsung') {
                family = nameLower.includes('ultra') ? 'Galaxy Watch Ultra' : (nameLower.includes('classic') ? 'Galaxy Watch Classic' : 'Galaxy Watch');
              } else if (brand === 'xiaomi') {
                family = nameLower.includes('s3') || nameLower.includes('s4') ? 'Xiaomi Watch S Series' : 'Redmi Watch';
              }

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
                  display: getSpec('màn hình') || 'Màn hình OLED Always-On',
                  chipset: getSpec('chip') || 'Vi xử lý thông minh thế hệ mới',
                  battery: getSpec('pin') || 'Pin bền bỉ cho ngày dài',
                  storage: getSpec('lưu trữ') || getSpec('dung lượng') || getSpec('rom') || getSpec('kích thước') || 'Thiết kế tinh xảo',
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
  }, [brand, config.accent]);

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