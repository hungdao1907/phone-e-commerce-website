import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Battery, Camera, Smartphone, Sparkles, Check, Flame } from 'lucide-react';
import type { BrandConfig, BrandModel } from '@/types/smartphone';
import { BrandProductCard } from '../product-cards/SmartphoneProductCard';

interface BrandFeaturedSectionProps {
  config: BrandConfig;
  products: BrandModel[];
}

export function BrandFeaturedSection({ config, products }: BrandFeaturedSectionProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15], [80, 0]);

  // Select top featured products (up to 4)
  const featuredModels = (
    products.filter((product) => product.featured).length > 0
      ? products.filter((product) => product.featured)
      : products
  ).slice(0, 4);

  // State to track selected color for each featured card
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    featuredModels.forEach((m) => {
      initial[m.id] = m.colors[0]?.name || '';
    });
    return initial;
  });

  const handleColorChange = (productId: string, colorName: string) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: colorName }));
  };

  const scrollToAllProducts = () => {
    const el = document.getElementById(`${config.id}-all-products`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (featuredModels.length === 0) return null;

  const topHeroModel = featuredModels[0];
  const companionModels = featuredModels.slice(1, 3);

  return (
    <section
      id={`${config.id}-featured-products`}
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 bg-white text-neutral-900 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Dynamic Background Glows */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] blur-[140px] rounded-full pointer-events-none opacity-40"
        style={{ backgroundColor: `${config.accent}20` }}
      />

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center"
      >
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-20 space-y-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold tracking-wide"
            style={{
              backgroundColor: `${config.accent}0F`,
              borderColor: `${config.accent}33`,
              color: config.accent,
            }}
          >
            <Flame className="w-4 h-4 animate-bounce" style={{ color: config.accent }} />
            <span>{config.featuredBadgeText || 'FLAGSHIP SPOTLIGHT'}</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950">
            {config.featuredHeadlinePrefix}{' '}
            <span className={config.gradientAI || config.gradientText}>{config.featuredHeadlineHighlight}</span>
          </h2>

          <p className="text-neutral-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            {config.featuredDescription}
          </p>
        </div>


        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full justify-center">
          {featuredModels.map((model, idx) => (
            <BrandProductCard
              key={model.id}
              product={model}
              index={idx}
              accentColor={config.accent}
            />
          ))}
        </div>

        {/* Action Anchor to All Products */}
        <div className="mt-14 sm:mt-16 text-center">
          <button
            type="button"
            onClick={scrollToAllProducts}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-neutral-950 text-white font-bold text-sm sm:text-base hover:bg-black transition-all shadow-lg hover:shadow-xl cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Khám Phá Toàn Bộ Bộ Sưu Tập {config.brand}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}

export default BrandFeaturedSection;
