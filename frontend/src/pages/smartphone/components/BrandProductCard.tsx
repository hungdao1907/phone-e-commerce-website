import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Cpu, Camera, Battery } from 'lucide-react';
import type { BrandModel } from '../types';

interface BrandProductCardProps {
  product: BrandModel;
  index?: number;
  accentColor?: string;
}

export function BrandProductCard({ product, index = 0, accentColor }: BrandProductCardProps) {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
      className="group relative flex flex-col h-full bg-white rounded-3xl border border-neutral-200/80 hover:border-neutral-300/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
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
          {product.series}
        </span>
      </div>

      {/* Product Image Area */}
      <div className="relative w-full aspect-[4/3] px-6 py-2 flex items-center justify-center overflow-hidden bg-white">
        {/* Ambient glow behind product */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${product.accentColor || accentColor || '#6366f1'}, transparent 70%)` }}
        />
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain max-h-52 mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-6 pt-2">
        {/* Title & Tagline */}
        <div className="mb-4">
          <h4
            className="text-xl font-bold text-neutral-900 tracking-tight transition-colors duration-200"
            style={{ ['--tw-text-opacity' as string]: 1 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = accentColor || product.accentColor || '#2563eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '';
            }}
          >
            {product.name}
          </h4>
          <p className="text-xs font-medium text-neutral-500 mt-1 line-clamp-1">
            {product.tagline}
          </p>
        </div>

        {/* Specs List */}
        <div className="space-y-2.5 py-4 border-y border-neutral-100 mb-4 flex-grow">
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Smartphone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product.specs.display}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Cpu className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product.specs.chipset}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Camera className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product.specs.camera}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-600">
            <Battery className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{product.specs.battery}</span>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center justify-between gap-2 mb-6">
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
                {product.price}
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-neutral-400 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/product/' + (product.slug ?? product.id))}
            className="inline-flex items-center px-6 py-2 text-xs font-semibold rounded-full bg-neutral-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer shrink-0"
          >
            Khám Phá
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default BrandProductCard;
