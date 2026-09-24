import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Monitor, Cpu, HardDrive, Battery, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import type { TabletModel } from '@/pages/tablet/types';

interface TabletProductCardProps {
  key?: string | number;
  product: TabletModel;
  priority?: boolean;
  index?: number;
}

const formatTabletPrice = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value);

export function TabletProductCard({ product, priority = false, index = 0 }: TabletProductCardProps) {
  const navigate = useNavigate();
  
  const colors = product?.colors || [];
  const safeColor = colors[0]?.name || '';
  const [selectedColor, setSelectedColor] = useState(safeColor);
  const addItem = useCartStore((state: any) => state.addItem);
  const { setCartDrawerOpen } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);

  // Update selected color if the current one is no longer in the list
  useEffect(() => {
    if (colors.length > 0 && !colors.find(c => c.name === selectedColor)) {
      setSelectedColor(colors[0].name);
    }
  }, [colors, selectedColor]);
  
  const activeColorObj = colors.find(c => c.name === selectedColor);
  const activeImage = activeColorObj?.image || product?.image || '';
  
  const numericPrice = typeof product.price === 'number' ? product.price : 0;

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    
    setIsAdding(true);
    
    const button = e.currentTarget;
    const card = button.closest('.group');
    
    try {
      // Use sync-mock endpoint to find or dynamically create the real DB product
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/sync-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      
      if (!res.ok) {
        console.error("Sync-mock failed");
        alert("Có lỗi xảy ra khi tạo sản phẩm.");
        setIsAdding(false);
        return;
      }
      
      const dbProduct = await res.json();
      
      let variant = dbProduct.variants?.find((v: any) => v.attributes?.['Màu sắc'] === selectedColor);
      if (!variant && dbProduct.variants?.length > 0) {
        variant = dbProduct.variants[0];
      }
      
      if (!variant) {
        alert("Sản phẩm chưa được cấu hình biến thể trong hệ thống.");
        setIsAdding(false);
        return;
      }
      
      if (!card) {
        setIsAdding(false);
        return;
      }
      
      const imageEl = card.querySelector('.product-image') as HTMLImageElement;
      const targetEl = document.getElementById('floating-cart-btn');
      
      const finalStorageLabel = variant.attributes?.['Lưu trữ'] || variant.attributes?.['Dung lượng'] || 'Tiêu chuẩn';
      const finalPrice = variant.price || dbProduct.price || numericPrice;
      const finalColorName = variant.attributes?.['Màu sắc'] || selectedColor;

      const performAdd = () => {
        addItem({
          productId: dbProduct.id,
          productSlug: dbProduct.id,
          brand: dbProduct.category?.name || product.brand,
          name: dbProduct.name,
          image: activeImage,
          variantId: variant.id,
          sku: variant.sku || dbProduct.id,
          colorName: finalColorName,
          storageLabel: finalStorageLabel,
          price: finalPrice,
          stock: variant.stock || 10,
          quantity: 1
        });
        setCartDrawerOpen(true);
      };
      
      if (imageEl && targetEl) {
        const rect = imageEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const clone = imageEl.cloneNode(true) as HTMLImageElement;
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '9999';
        clone.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
        clone.style.borderRadius = '20px';
        
        document.body.appendChild(clone);
        
        setTimeout(() => {
          clone.style.top = `${targetRect.top + 10}px`;
          clone.style.left = `${targetRect.left + 10}px`;
          clone.style.width = '20px';
          clone.style.height = '20px';
          clone.style.opacity = '0.5';
          clone.style.transform = 'scale(0.5)';
        }, 50);
        
        setTimeout(() => {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone);
          }
          performAdd();
          if (targetEl) {
            targetEl.classList.add('scale-125');
            setTimeout(() => targetEl.classList.remove('scale-125'), 300);
          }
          setIsAdding(false);
        }, 800);
      } else {
        performAdd();
        setIsAdding(false);
      }
      
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi thêm vào giỏ hàng: " + err.message);
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
      className="tablet-product-card group relative flex flex-col h-full bg-white rounded-3xl border border-neutral-200/80 hover:border-neutral-300/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
    >
      {/* Top Badge & Series */}
      <div className="p-6 pb-2 flex items-start justify-between gap-2 z-10">
        {product.badge ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-neutral-100 text-neutral-800 border border-neutral-200/60 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-300">
            {product.badge}
          </span>
        ) : (
          <span />
        )}

        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          {product.family}
        </span>
      </div>

      {/* Product Image Area */}
      <div className="relative w-full aspect-[4/3] px-6 py-2 flex items-center justify-center overflow-hidden bg-white">
        {/* Ambient glow behind product */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, var(--tablet-accent, #6366f1), transparent 70%)` }}
        />
        {colors.length > 0 ? colors.map((c) => {
          const imgUrl = c.image || product.image || '';
          const isSelected = c.name === selectedColor;
          return (
            <img
              key={c.name}
              src={imgUrl}
              alt={product.name + ' ' + c.name}
              loading={priority ? 'eager' : 'lazy'}
              className={`${isSelected ? 'product-image z-10 opacity-100' : 'z-0 opacity-0'} absolute inset-0 m-auto w-full h-full object-contain max-h-52 mix-blend-multiply group-hover:scale-105 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}
            />
          );
        }) : (
          <img
            src={activeImage}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            className="product-image absolute inset-0 m-auto w-full h-full object-contain max-h-52 mix-blend-multiply group-hover:scale-105 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-6 pt-2">
        {/* Title */}
        <div className="mb-4">
          <h4
            className="text-xl font-bold text-neutral-900 tracking-tight transition-colors duration-200 hover:text-[var(--tablet-accent)]"
          >
            {product.name}
          </h4>
        </div>

        {/* Specs List */}
        <div className="space-y-2.5 py-4 border-y border-neutral-100 mb-4 flex-grow">
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Monitor className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product?.specs?.display}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Cpu className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product?.specs?.chipset}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Battery className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product?.specs?.battery}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product?.specs?.storage}</span>
          </div>
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
                {formatTabletPrice(product.price)}
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatTabletPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isAdding ? 'bg-neutral-200 text-neutral-400' : 'bg-neutral-100 hover:bg-[var(--tablet-accent-soft)] text-neutral-600 hover:text-[var(--tablet-accent)]'} transition-colors duration-200 cursor-pointer shrink-0`}
              aria-label="Thêm vào giỏ hàng"
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/product/' + product.slug)}
              className="inline-flex items-center px-6 py-2 text-xs font-semibold rounded-full bg-neutral-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer shrink-0"
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}