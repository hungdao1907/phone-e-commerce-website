import { useState, useEffect } from 'react';
import { getSmartphoneBrandConfig, getSmartphoneProductsByBrand } from '@/data/smartphoneData';
import type { SmartphoneBrandId, BrandModel } from '@/types/smartphone';
import { SmartphoneCatalogPage } from './SmartphoneCatalogPage';

interface SmartphonePageProps {
  brand: SmartphoneBrandId;
}

export function SmartphonePage({ brand }: SmartphonePageProps) {
  const config = getSmartphoneBrandConfig(brand);
  const fallbackProducts = getSmartphoneProductsByBrand(brand);

  const [products, setProducts] = useState<BrandModel[]>(fallbackProducts);

  useEffect(() => {
    // Reset products to the new brand's fallbacks immediately on brand change
    setProducts(getSmartphoneProductsByBrand(brand));

    // Fetch products from API and merge or override
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
        if (res.ok) {
          const data = await res.json();
          // Filter by brand (category name contains brand or product name contains brand)
          const apiProducts = data.filter((p: any) =>
            p.category?.name?.toLowerCase().includes(brand.toLowerCase()) ||
            p.name?.toLowerCase().includes(brand.toLowerCase())
          );

          if (apiProducts.length > 0) {
            // Map API product to BrandModel
            const mappedProducts: BrandModel[] = apiProducts.map((ap: any, idx: number) => {
              // 1. Get minimum price across all variants for base price
              const prices = ap.variants?.map((v: any) => v.price).filter((p: any) => p != null && p > 0) || [];
              const basePrice = prices.length > 0 ? Math.min(...prices) : (ap.basePrice || 0);

              let finalPrice = basePrice;
              let originalPrice = undefined;

              if (ap.activeCampaign) {
                originalPrice = basePrice.toLocaleString('vi-VN') + '₫';
                if (ap.activeCampaign.discountType === 'percentage') {
                  finalPrice = Math.max(0, basePrice - (basePrice * ap.activeCampaign.discountValue / 100));
                } else {
                  finalPrice = Math.max(0, basePrice - ap.activeCampaign.discountValue);
                }
              }

              // 2. Extract specific specifications
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

              // 3. Deduplicate colors
              const colorMap = new Map();
              ap.variants?.forEach((v: any) => {
                const cName = v.attributes?.['Màu sắc'];
                if (cName) {
                  if (!colorMap.has(cName)) {
                    colorMap.set(cName, {
                      name: cName,
                      hex: v.colorCode || (cName.toLowerCase().includes('đen') || cName.toLowerCase().includes('black') ? '#000000' : '#FFFFFF'),
                      image: v.image && v.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${v.image}` : v.image
                    });
                  } else if (v.image && !colorMap.get(cName).image) {
                    colorMap.get(cName).image = v.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${v.image}` : v.image;
                  }
                }
              });
              const colors = Array.from(colorMap.values());

              // 4. Derive smart series based on product name
              const nameLower = (ap.name || '').toLowerCase();
              let series = 'Dòng Mới';
              if (brand === 'iphone') {
                series = nameLower.includes('pro') ? 'iPhone Pro' : 'iPhone';
              } else if (brand === 'samsung') {
                if (nameLower.includes('fold') || nameLower.includes('flip')) series = 'Galaxy Z Series';
                else if (nameLower.includes('s2') || nameLower.includes('ultra')) series = 'Galaxy S Series';
                else series = 'Galaxy Series';
              } else if (brand === 'xiaomi') {
                if (nameLower.includes('redmi')) series = 'Redmi Series';
                else if (nameLower.includes('ultra') || nameLower.includes('pro')) series = 'Xiaomi Flagship';
                else series = 'Xiaomi Series';
              } else if (brand === 'oppo') {
                if (nameLower.includes('find')) series = 'Find Series';
                else if (nameLower.includes('reno')) series = 'Reno Series';
                else series = 'Oppo Series';
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
                name: ap.name,
                series: series,
                tagline: '',
                description: ap.description || 'Sản phẩm chính hãng với công nghệ tiên tiến nhất.',
                price: finalPrice.toLocaleString('vi-VN') + '₫',
                originalPrice: originalPrice,
                badge: idx === 0 ? 'MỚI RA MẮT' : (ap.badge || undefined),
                image: resolveImageUrl(ap.image) || resolveImageUrl(ap.images?.[0]) || '/images/hero.png',
                accentColor: config.accent,
                featured: idx < 4,
                reviewCount: ap.reviewCount || 0,
                ratingAverage: ap.ratingAverage || 0,
                specs: {
                  display: getSpec('màn hình') || '6.7" OLED 120Hz',
                  chipset: getSpec('chip') || 'Vi xử lý thế hệ mới',
                  camera: getSpec('camera') || 'Cụm camera chuyên nghiệp',
                  battery: getSpec('pin') || 'Pin dùng cả ngày',
                },
                colors: colors.length > 0 ? colors : [{ name: 'Mặc định', hex: '#24262A' }],
              };
            });

            if (mappedProducts.length > 0) {
              setProducts(mappedProducts);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch products for', brand, error);
      }
    };

    fetchProducts();
  }, [brand, config.accent]);

  return <SmartphoneCatalogPage config={config} products={products} />;
}

export default SmartphonePage;