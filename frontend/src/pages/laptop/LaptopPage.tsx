import { useEffect, useState, type CSSProperties } from 'react';
import { getLaptopBrandConfig, getLaptopProductsByBrand } from '../../data/laptop/data/index';
import {
  LaptopAllProductsSection,
  LaptopBrandExperienceSection,
  LaptopFeaturedSection,
  LaptopFinalCTASection,
  LaptopHeroSection,
  LaptopWhySection,
} from '../../components/laptop/sections/index';
import type { LaptopBrandId, LaptopModel } from '../../types/laptop/types/index';
import '@/css/laptop.css';

interface LaptopPageProps {
  brand: LaptopBrandId;
}

export function LaptopPage({ brand }: LaptopPageProps) {
  const config = getLaptopBrandConfig(brand);
  const fallbackProducts = getLaptopProductsByBrand(brand);
  
  const [products, setProducts] = useState<LaptopModel[]>(fallbackProducts);

  useEffect(() => {
    document.title = config.label + ' - Cửa Hàng Công Nghệ';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [config]);

  useEffect(() => {
    setProducts(getLaptopProductsByBrand(brand));

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
        if (res.ok) {
          const data = await res.json();
          const apiProducts = data.filter((p: any) =>
            p.category?.name?.toLowerCase().includes(brand.toLowerCase()) ||
            p.category?.parent?.name?.toLowerCase().includes('laptop') ||
            p.name?.toLowerCase().includes(brand.toLowerCase())
          );

          if (apiProducts.length > 0) {
            const mappedProducts: LaptopModel[] = apiProducts.map((ap: any, idx: number) => {
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
                    const groupTitle = (s.title || s.group || '').toLowerCase();
                    if (groupTitle.includes(kw)) {
                      const firstVal = s.items.find((i: any) => i?.value !== undefined && i?.value !== null)?.value;
                      if (firstVal !== undefined && firstVal !== null) return String(firstVal);
                    }
                  }
                }
                return '';
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
              let family = 'Laptop Mới';
              if (brand === 'macbook') {
                if (nameLower.includes('pro')) family = 'MacBook Pro';
                else if (nameLower.includes('air')) family = 'MacBook Air';
                else family = 'MacBook';
              } else if (brand === 'asus') {
                if (nameLower.includes('rog')) family = 'ROG Series';
                else if (nameLower.includes('zenbook')) family = 'Zenbook';
                else if (nameLower.includes('vivobook')) family = 'Vivobook';
                else family = 'ASUS Laptop';
              } else if (brand === 'lenovo') {
                if (nameLower.includes('thinkpad')) family = 'ThinkPad';
                else if (nameLower.includes('ideapad')) family = 'IdeaPad';
                else if (nameLower.includes('legion')) family = 'Legion Series';
                else family = 'Lenovo Laptop';
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
                tagline: ap.tagline || ap.description || 'Hiệu năng bứt phá.',
                description: ap.description || 'Thiết kế tinh tế với sức mạnh vượt trội.',
                image: resolveImageUrl(ap.image) || resolveImageUrl(ap.images?.[0]) || '/images/hero.png',
                badge: idx === 0 ? 'MỚI' : (ap.badge || undefined),
                price: finalPrice,
                originalPrice: originalPrice,
                reviewCount: ap.reviewCount || 0,
                ratingAverage: ap.ratingAverage || 0,
                colors: colors.length > 0 ? colors : [{ name: 'Space Gray', hex: '#4b5563' }],
                specs: {
                  display: getSpec('màn hình') || 'Màn hình sắc nét',
                  processor: getSpec('cpu') || getSpec('chip') || 'Bộ xử lý đa nhân',
                  gpu: getSpec('gpu') || getSpec('vga') || undefined,
                  ram: getSpec('ram') || '8GB RAM',
                  storage: getSpec('ssd') || getSpec('hdd') || getSpec('ổ cứng') || getSpec('lưu trữ') || '256GB SSD',
                  battery: getSpec('pin') || 'Pin cả ngày dài',
                },
                featured: idx < 3,
              };
            });

            const brandMappedProducts = mappedProducts.filter(mp => mp.brand.toLowerCase() === brand.toLowerCase() || mp.name.toLowerCase().includes(brand.toLowerCase()));
            
            if (brandMappedProducts.length > 0) {
               setProducts(brandMappedProducts);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch laptop products for', brand, error);
      }
    };

    fetchProducts();
  }, [brand]);

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
