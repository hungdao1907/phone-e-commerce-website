import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface FilteredProductCardProps {
  product: any;
  categorySlug: string;
}

export function FilteredProductCard({ product, categorySlug }: FilteredProductCardProps) {
  // Use minimum variant price as base price
  const prices = product.variants?.map((v: any) => v.salePrice || v.price).filter((p: number) => p > 0) || [];
  const basePrice = prices.length > 0 ? Math.min(...prices) : (product.price || 0);

  let finalPrice = basePrice;
  let originalPrice = undefined;

  // Apply active campaign discount
  if (product.activeCampaign) {
    originalPrice = basePrice.toLocaleString('vi-VN') + '₫';
    if (product.activeCampaign.discountType === 'percentage') {
      finalPrice = Math.max(0, basePrice - (basePrice * product.activeCampaign.discountValue / 100));
    } else {
      finalPrice = Math.max(0, basePrice - product.activeCampaign.discountValue);
    }
  }

  // Helper to safely fetch normalized spec
  const getSpec = (key: string) => {
    if (!product.specifications || !Array.isArray(product.specifications)) return null;
    const spec = product.specifications.find((s: any) => s.key.toLowerCase().includes(key.toLowerCase()));
    return spec ? spec.value : null;
  };

  // Determine key specs to display based on category
  const isPhone = ['iphone', 'samsung', 'xiaomi', 'oppo', 'phone'].includes(categorySlug);
  const isLaptop = ['macbook', 'asus', 'lenovo', 'laptop'].includes(categorySlug);
  const isWatch = ['watch', 'apple-watch', 'samsung-watch'].includes(categorySlug);
  const isTablet = ['ipad', 'tablet', 'samsung-tablet'].includes(categorySlug);

  const displaySpecs: string[] = [];
  
  if (isPhone || isTablet) {
    const screen = getSpec('màn hình');
    const ram = getSpec('ram');
    const chip = getSpec('chip') || getSpec('cpu');
    if (screen) displaySpecs.push(screen);
    if (ram) displaySpecs.push(ram);
    if (chip) displaySpecs.push(chip);
  } else if (isLaptop) {
    const screen = getSpec('màn hình');
    const ram = getSpec('ram');
    const cpu = getSpec('cpu');
    if (screen) displaySpecs.push(screen);
    if (ram) displaySpecs.push(ram);
    if (cpu) displaySpecs.push(cpu);
  } else if (isWatch) {
    const screen = getSpec('màn hình');
    const battery = getSpec('pin');
    if (screen) displaySpecs.push(screen);
    if (battery) displaySpecs.push(battery);
  } else {
    // Fallback: Just grab first two specs
    if (product.specifications && product.specifications.length > 0) {
      displaySpecs.push(product.specifications[0].value);
      if (product.specifications[1]) displaySpecs.push(product.specifications[1].value);
    }
  }

  // Determine product url
  const productUrl = `/product/${product.slug || product.id}`;
  
  // Resolve image URL
  const imageUrl = product.image 
    ? (product.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${product.image}` : product.image)
    : '/images/hero.png';

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 h-full">
      {product.activeCampaign && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          Giảm giá
        </div>
      )}

      {/* Image Area */}
      <Link to={productUrl} className="relative block aspect-[4/3] bg-neutral-50 overflow-hidden p-6 flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        {/* Brand & Name */}
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">{product.brand || 'Thương hiệu khác'}</div>
        <Link to={productUrl} className="block group-hover:text-blue-500 transition-colors">
          <h3 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2 min-h-[40px] mb-2">
            {product.name}
          </h3>
        </Link>
        {product.reviewCount ? (
          <div className="flex items-center gap-1.5 mb-3 -mt-1">
            <span className="text-yellow-500 text-[10px]">★</span>
            <span className="text-[11px] font-bold text-neutral-900">{product.ratingAverage}</span>
            <span className="text-[10px] text-neutral-500">({product.reviewCount})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-3 -mt-1 opacity-0">
            <span className="text-[10px] text-neutral-500">_</span>
          </div>
        )}

        {/* Dynamic Specifications */}
        <div className="flex flex-wrap gap-1 mb-4 min-h-[44px]">
          {displaySpecs.map((spec, idx) => (
            <span key={idx} className="bg-neutral-100 text-neutral-600 text-[10px] px-2 py-1 rounded">
              {spec}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-4 border-t border-neutral-100 flex items-end justify-between">
          <div>
            {originalPrice && (
              <div className="text-xs text-neutral-400 line-through mb-0.5">{originalPrice}</div>
            )}
            <div className="text-base font-bold text-neutral-900">
              {finalPrice.toLocaleString('vi-VN')}₫
            </div>
          </div>
          <Link 
            to={productUrl}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-blue-500 group-hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
