import { useState, useEffect } from 'react';
import { getSmartphoneBrandConfig, getSmartphoneProductsByBrand } from '@/data/smartphoneData';
import type { SmartphoneBrandId } from '@/types/smartphone';
import { SmartphoneCatalogPage } from './SmartphoneCatalogPage';
import type { BrandModel } from '@/types/smartphone';

interface SmartphonePageProps {
  brand: SmartphoneBrandId;
}

export function SmartphonePage({ brand }: SmartphonePageProps) {
  const config = getSmartphoneBrandConfig(brand);
  const fallbackProducts = getSmartphoneProductsByBrand(brand);
  
  const [products, setProducts] = useState<BrandModel[]>(fallbackProducts);

  useEffect(() => {
    // Fetch products from API and merge or override
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/products');
        if (res.ok) {
          const data = await res.json();
          // Filter by brand (assuming category name contains brand or brand field exists)
          const apiProducts = data.filter((p: any) => 
            p.category?.name?.toLowerCase().includes(brand) || 
            p.name.toLowerCase().includes(brand)
          );
          
          if (apiProducts.length > 0) {
            // Map API product to BrandModel
            const mappedProducts: BrandModel[] = apiProducts.map((ap: any) => {
              // 1. Get minimum price across all variants for base price
              const prices = ap.variants?.map((v: any) => v.price).filter((p: any) => p != null && p > 0) || [];
              const basePrice = prices.length > 0 ? Math.min(...prices) : (ap.basePrice || 0);
              
              let finalPrice = basePrice;
              let originalPrice = undefined;

              if (ap.activeCampaign) {
                originalPrice = basePrice.toLocaleString('vi-VN') + 'đ';
                if (ap.activeCampaign.discountType === 'percentage') {
                  finalPrice = Math.max(0, basePrice - (basePrice * ap.activeCampaign.discountValue / 100));
                } else {
                  finalPrice = Math.max(0, basePrice - ap.activeCampaign.discountValue);
                }
              }
              
              // 2. Extract specific specifications
              const getSpec = (keyword: string) => {
                const spec = ap.specifications?.find((s: any) => s.key.toLowerCase().includes(keyword));
                return spec ? spec.value : '';
              };
              
              // 3. Deduplicate colors
              const colorMap = new Map();
              ap.variants?.forEach((v: any) => {
                const cName = v.attributes?.['Màu sắc'];
                if (cName && !colorMap.has(cName)) {
                  colorMap.set(cName, {
                    name: cName,
                    hex: v.colorCode || (cName.toLowerCase().includes('đen') ? '#000000' : '#FFFFFF')
                  });
                }
              });
              const colors = Array.from(colorMap.values());
              
              return {
                id: ap.id,
                slug: ap.id,
                brand: brand,
                name: ap.name,
                series: 'Dòng Mới',
                tagline: 'Sức mạnh từ API',
                description: ap.description || 'Sản phẩm tuyệt vời.',
                price: finalPrice.toLocaleString('vi-VN') + 'đ',
                originalPrice: originalPrice,
                image: ap.image || 'https://via.placeholder.com/300',
                accentColor: config.accent,
                specs: {
                  display: getSpec('màn hình') || '6.1" OLED',
                  chipset: getSpec('chip') || 'Chipset API',
                  camera: getSpec('camera') || '12MP',
                  battery: getSpec('pin') || 'Cả ngày'
                },
                colors: colors.length > 0 ? colors : [{ name: 'Trắng', hex: '#FFFFFF' }]
              };
            });
            setProducts(mappedProducts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch products for", brand, error);
      }
    };
    fetchProducts();
  }, [brand, config.accent]);

  return <SmartphoneCatalogPage config={config} products={products} />;
}