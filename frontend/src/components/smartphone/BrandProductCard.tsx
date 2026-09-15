import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Cpu, Camera, Battery, ArrowRight, ShoppingCart, Check } from 'lucide-react';
import type { BrandModel } from '@/types/smartphone';

interface BrandProductCardProps {
  product: BrandModel;
  index?: number;
  accentColor?: string;
}

export function BrandProductCard({ product, index = 0, accentColor }: BrandProductCardProps) {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const brandAccent = product.accentColor || accentColor || '#2563eb';

  // Calculate discount percentage if original price is available
  const getDiscountPercent = () => {
    if (!product.originalPrice) return null;
    const currentNum = parseInt(product.price.replace(/\D/g, ''), 10);
    const origNum = parseInt(product.originalPrice.replace(/\D/g, ''), 10);
    if (origNum > currentNum) {
      const pct = Math.round(((origNum - currentNum) / origNum) * 100);
      return `-${pct}%`;
    }
    return null;
  };

  const discountBadge = getDiscountPercent();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddedToCart(true);
    // Dispatches custom event or timeout reset
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.08 }}
      className="group relative flex flex-col h-full bg-white rounded-3xl border border-neutral-200/90 hover:border-neutral-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
    >
      {/* Top Badges Bar */}
      <div className="p-5 pb-1 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5">
          {product.badge && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide text-white shadow-sm"
              style={{ backgroundColor: brandAccent }}
            >
              {product.badge}
            </span>
          )}
          {discountBadge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
              {discountBadge}
            </span>
          )}
        </div>

        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
          {product.series}
        </span>
      </div>

      {/* Product Image Area */}
      <div
        onClick={() => navigate(`/product/${product.slug ?? product.id}`)}
        className="relative w-full aspect-[4/3] px-6 py-4 flex items-center justify-center overflow-hidden bg-white cursor-pointer"
      >
        {/* Ambient radial glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${brandAccent}, transparent 65%)` }}
        />
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain max-h-52 mix-blend-multiply group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Card Content Body */}
      <div className="flex flex-col flex-grow p-6 pt-2">
        {/* Title & Tagline */}
        <div className="mb-3">
          <h4
            onClick={() => navigate(`/product/${product.slug ?? product.id}`)}
            className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight cursor-pointer transition-colors duration-200 hover:opacity-80"
          >
            {product.name}
          </h4>
          <p className="text-xs font-semibold text-neutral-500 mt-1 line-clamp-1">
            {product.tagline}
          </p>
        </div>

        {/* Micro Specs Grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-neutral-100 mb-4 bg-neutral-50/50 rounded-xl px-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <Smartphone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-[11px]">{product.specs.display.split(' ')[0]} {product.specs.display.split(' ')[1] || ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <Cpu className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-[11px]">{product.specs.chipset.split('(')[0].trim()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <Camera className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-[11px]">{product.specs.camera.split('+')[0].trim()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <Battery className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-[11px]">{product.specs.battery.split('•')[0].trim()}</span>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            {product.colors.map((color) => {
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
          <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[120px] text-right">
            {selectedColor}
          </span>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-neutral-400">Giá từ</span>
            {product.originalPrice && (
              <span className="text-xs text-neutral-400 line-through -mb-0.5">
                {product.originalPrice}
              </span>
            )}
            <span className={`text-base sm:text-lg font-extrabold tracking-tight ${product.originalPrice ? 'text-red-600' : 'text-neutral-950'}`}>
              {product.price}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/product/${product.slug ?? product.id}`)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-full bg-neutral-950 text-white hover:bg-black transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
            >
              <span>Khám Phá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default BrandProductCard;
