import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import cardBagAnimation from '../../../public/lottie/cardBag.json';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { buildSpecChipsFromRaw } from '@/utils/specParser';

interface FilteredProductCardProps {
  product: any;
  categorySlug: string;
}

export function FilteredProductCard({ product, categorySlug }: FilteredProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state: any) => state.addItem);
  const { setCartDrawerOpen } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);

  // Extract unique colors from variants
  const colors: { name: string, hex: string, image: string }[] = [];
  if (product.variants && Array.isArray(product.variants)) {
    const colorMap = new Map();
    product.variants.forEach((v: any) => {
      const cName = v.attributes?.['Màu sắc'] || v.attributes?.['Color'];
      if (cName && !colorMap.has(cName)) {
        colorMap.set(cName, {
          name: cName,
          hex: v.colorCode || '#cccccc',
          image: v.image || product.image // Use variant specific image if available
        });
      }
    });
    colorMap.forEach(v => colors.push(v));
  }

  const safeColor = colors[0]?.name || '';
  const [selectedColor, setSelectedColor] = useState(safeColor);

  useEffect(() => {
    if (colors.length > 0 && !colors.find(c => c.name === selectedColor)) {
      setSelectedColor(colors[0].name);
    }
  }, [colors, selectedColor]);

  const activeColorObj = colors.find(c => c.name === selectedColor);
  
  // Try resolving local vs remote image
  const resolveImage = (img: string) => {
    if (!img) return '/images/hero.png';
    return img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img;
  };
  
  const activeImage = resolveImage(activeColorObj?.image || product.image);

  // Use minimum variant price as base price
  const prices = product.variants?.map((v: any) => v.salePrice || v.price).filter((p: number) => p > 0) || [];
  const basePrice = prices.length > 0 ? Math.min(...prices) : (product.price || 0);

  let finalPrice = basePrice;
  let originalPrice: string | undefined = undefined;
  let discountBadge = '';

  // Apply active campaign discount
  if (product.activeCampaign) {
    originalPrice = basePrice.toLocaleString('vi-VN') + '₫';
    if (product.activeCampaign.discountType === 'percentage') {
      discountBadge = `-${product.activeCampaign.discountValue}%`;
      finalPrice = Math.max(0, basePrice - (basePrice * product.activeCampaign.discountValue / 100));
    } else {
      finalPrice = Math.max(0, basePrice - product.activeCampaign.discountValue);
      if (basePrice > 0) {
        discountBadge = `-${Math.round((product.activeCampaign.discountValue / basePrice) * 100)}%`;
      }
    }
  }

  // Fallback rating data
  const ratingAverage = product.ratingAverage || 0;
  const reviewCount = product.reviewCount || 0;

  // Build short spec chips
  const specChips = buildSpecChipsFromRaw(product.specifications, product.variants);

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    
    setIsAdding(true);
    const button = e.currentTarget;
    const card = button.closest('.group');
    
    try {
      // Find matching variant
      let variant = product.variants?.find((v: any) => v.attributes?.['Màu sắc'] === selectedColor);
      if (!variant && product.variants?.length > 0) {
        variant = product.variants[0]; // fallback
      }
      
      if (!variant) {
        alert("Sản phẩm chưa được cấu hình biến thể trong hệ thống.");
        setIsAdding(false);
        return;
      }
      
      const imageEl = card?.querySelector('.product-image') as HTMLImageElement;
      const targetEl = document.getElementById('floating-cart-btn');
      
      const finalStorageLabel = variant.attributes?.['Dung lượng'] || 'Tiêu chuẩn';
      // Recalculate variant specific price
      let vPrice = variant.salePrice || variant.price;
      if (product.activeCampaign) {
        if (product.activeCampaign.discountType === 'percentage') {
          vPrice = Math.max(0, vPrice - (vPrice * product.activeCampaign.discountValue / 100));
        } else {
          vPrice = Math.max(0, vPrice - product.activeCampaign.discountValue);
        }
      }
      
      const performAdd = () => {
        addItem({
          productId: product.id,
          productSlug: product.slug || product.id,
          brand: product.brand || 'Khác',
          name: product.name,
          image: activeImage,
          variantId: variant.id,
          sku: variant.sku || product.id,
          colorName: selectedColor,
          storageLabel: finalStorageLabel,
          price: vPrice,
          stock: variant.stock || 10,
          quantity: 1
        });
        setCartDrawerOpen(true);
      };

      performAdd();
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi thêm vào giỏ hàng: " + err.message);
      setIsAdding(false);
    }
  };

  const productUrl = `/product/${product.slug || product.id}`;
  const accentColor = '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col h-full bg-white rounded-3xl border border-neutral-200/80 hover:border-neutral-300/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
    >
      {/* Top Badge & Series */}
      <div className="p-4 pb-2 flex items-start justify-between gap-2 z-10">
        {discountBadge ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-red-500 text-white shadow-sm transition-colors duration-300">
            {discountBadge}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          {product.brand || 'APPLE'}
        </span>
      </div>

      {/* Product Image Area */}
      <div 
        className="relative w-full aspect-[4/3] px-4 py-2 flex items-center justify-center overflow-hidden bg-white cursor-pointer"
        onClick={() => navigate(productUrl)}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${accentColor}, transparent 70%)` }}
        />
        {colors.length > 0 ? colors.map((c) => {
          const imgUrl = resolveImage(c.image);
          const isSelected = c.name === selectedColor;
          return (
            <img
              key={c.name}
              src={imgUrl}
              alt={product.name + ' ' + c.name}
              loading="lazy"
              className={`${isSelected ? 'product-image z-10 opacity-100' : 'z-0 opacity-0'} absolute inset-0 m-auto w-full h-full object-contain max-h-44 mix-blend-multiply group-hover:scale-105 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}
            />
          );
        }) : (
          <img
            src={activeImage}
            alt={product.name}
            loading="lazy"
            className="product-image absolute inset-0 m-auto w-full h-full object-contain max-h-44 mix-blend-multiply group-hover:scale-105 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-4 pt-2">
        {/* Title & Tagline */}
        <div className="mb-3">
          <h4
            className="text-lg font-bold text-neutral-900 tracking-tight transition-colors duration-200 cursor-pointer line-clamp-1"
            onClick={() => navigate(productUrl)}
            style={{ ['--tw-text-opacity' as string]: 1 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = accentColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '';
            }}
          >
            {product.name}
          </h4>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs font-bold text-neutral-900">{ratingAverage}</span>
              <span className="text-[11px] text-neutral-500">({reviewCount} lượt đánh giá)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-neutral-300 text-xs">☆</span>
              <span className="text-[11px] text-neutral-500">Chưa có đánh giá</span>
            </div>
          )}
        </div>

        {/* Short Spec Chips instead of long specs */}
        <div className="flex flex-wrap gap-1.5 py-4 border-y border-neutral-100 mb-4 flex-grow content-start">
          {specChips.map((chip, idx) => (
            <span key={idx} className="inline-flex items-center bg-neutral-100 text-neutral-600 text-[11px] font-semibold px-2.5 py-1 rounded-md">
              {chip}
            </span>
          ))}
        </div>

        {/* Color Swatches */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            {colors.map((color) => {
              const isSelected = selectedColor === color.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  title={color.name}
                  aria-label={color.name}
                  className={`w-5 h-5 rounded-full border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-1 ring-neutral-900 scale-110 border-black/20'
                      : 'border-black/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[110px] text-right">
            {selectedColor}
          </span>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-neutral-400">Giá từ</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-neutral-900 tracking-tight">
                {finalPrice.toLocaleString('vi-VN')}₫
              </span>
            </div>
            {originalPrice && (
              <span className="text-[11px] text-neutral-400 line-through">
                {originalPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              onMouseEnter={(e) => {
                const lottie = (e.currentTarget.querySelector('.lottie-container') as any)?._lottie;
                if (lottie) {
                  lottie.setDirection(1);
                  lottie.play();
                }
              }}
              onMouseLeave={(e) => {
                const lottie = (e.currentTarget.querySelector('.lottie-container') as any)?._lottie;
                if (lottie) {
                  lottie.stop();
                }
              }}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isAdding ? 'bg-neutral-200 text-neutral-400' : 'bg-neutral-100 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-600'} transition-colors duration-200 cursor-pointer shrink-0 overflow-hidden relative`}
              aria-label="Thêm vào giỏ hàng"
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="lottie-container w-full h-full flex items-center justify-center pointer-events-none absolute inset-0 pt-0.5">
                  <Lottie
                    animationData={cardBagAnimation}
                    loop={false}
                    autoplay={false}
                    style={{ width: '150%', height: '150%' }}
                    lottieRef={(ref) => {
                      if (ref && (ref as any).wrapper) {
                        const container = (ref as any).wrapper.closest('.lottie-container');
                        if (container) container._lottie = ref;
                      }
                    }}
                  />
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(productUrl)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer shrink-0"
              aria-label="Chi tiết"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
