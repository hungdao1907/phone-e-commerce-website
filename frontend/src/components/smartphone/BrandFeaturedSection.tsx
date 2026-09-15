import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Battery, Camera, Smartphone, Sparkles, Check, Flame } from 'lucide-react';
import type { BrandConfig, BrandModel } from '@/types/smartphone';

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

  // Select top featured products (up to 3)
  const featuredModels = (
    products.filter((product) => product.featured).length > 0
      ? products.filter((product) => product.featured)
      : products
  ).slice(0, 3);

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

        {/* Bento Grid Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* Main Flagship Hero Card (#1 Model) */}
          {topHeroModel && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-12 xl:col-span-7 group relative flex flex-col md:flex-row bg-gradient-to-br from-neutral-50 to-white rounded-3xl border border-neutral-200/90 hover:border-neutral-300 shadow-[0_10px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-500"
            >
              {/* Card Ambient Glow on Hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 50%, ${topHeroModel.accentColor || config.accent}, transparent 70%)` }}
              />

              {/* Left Side: Product Image with Floating Elements */}
              <div className="relative w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-neutral-100/60 border-b md:border-b-0 md:border-r border-neutral-200/70 overflow-hidden">
                {/* Badge */}
                <div className="absolute top-5 left-5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-neutral-900 text-white shadow-md">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {topHeroModel.badge || 'Siêu Phẩm Đỉnh Cao'}
                  </span>
                </div>

                <div className="relative w-full aspect-[4/3] md:aspect-square flex items-center justify-center">
                  <img
                    src={topHeroModel.image}
                    alt={topHeroModel.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </div>

                {/* Interactive Color Switcher */}
                <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-200/70 z-10">
                  <div className="flex items-center gap-2">
                    {topHeroModel.colors.map((c) => {
                      const isSelected = (selectedColors[topHeroModel.id] || topHeroModel.colors[0]?.name) === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleColorChange(topHeroModel.id, c.name)}
                          title={c.name}
                          aria-label={c.name}
                          className={`w-6 h-6 rounded-full border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110 border-neutral-400'
                              : 'border-black/20 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">
                    {selectedColors[topHeroModel.id] || topHeroModel.colors[0]?.name}
                  </span>
                </div>
              </div>

              {/* Right Side: Detailed Specs & Pricing */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {topHeroModel.series}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-1">
                      {topHeroModel.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: topHeroModel.accentColor || config.accent }}>
                      {topHeroModel.tagline}
                    </p>
                  </div>

                  <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                    {topHeroModel.description}
                  </p>

                  {/* High-end Specs Matrix */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-neutral-100/80 border border-neutral-200/60">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mb-1">
                        <Smartphone className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Màn hình</span>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 line-clamp-1">{topHeroModel.specs.display}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-100/80 border border-neutral-200/60">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mb-1">
                        <Cpu className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Vi xử lý</span>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 line-clamp-1">{topHeroModel.specs.chipset}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-100/80 border border-neutral-200/60">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mb-1">
                        <Camera className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Camera</span>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 line-clamp-1">{topHeroModel.specs.camera}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-100/80 border border-neutral-200/60">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mb-1">
                        <Battery className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Pin & Sạc</span>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 line-clamp-1">{topHeroModel.specs.battery}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-medium text-neutral-400">Giá khuyến mãi</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-neutral-950">
                        {topHeroModel.price}
                      </span>
                      {topHeroModel.originalPrice && (
                        <span className="text-xs sm:text-sm text-neutral-400 line-through">
                          {topHeroModel.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/product/${topHeroModel.slug ?? topHeroModel.id}`)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-black transition-all duration-200 hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  >
                    <span>Khám Phá Chi Tiết</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Companion Flagship Cards (#2 and #3) */}
          <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
            {companionModels.map((model, idx) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group relative flex flex-col sm:flex-row bg-white rounded-3xl border border-neutral-200/90 hover:border-neutral-300 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] p-6 overflow-hidden transition-all duration-300"
              >
                {/* Product Image Area */}
                <div className="relative w-full sm:w-2/5 aspect-[4/3] sm:aspect-square flex items-center justify-center p-2">
                  <img
                    src={model.image}
                    alt={model.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>

                {/* Product Info */}
                <div className="w-full sm:w-3/5 flex flex-col justify-between pt-4 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {model.series}
                      </span>
                      {model.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {model.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-neutral-900 mt-1">
                      {model.name}
                    </h4>
                    <p className="text-xs font-semibold" style={{ color: model.accentColor || config.accent }}>
                      {model.tagline}
                    </p>

                    {/* Quick Specs Pill */}
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                        <Cpu className="w-3 h-3" />
                        {model.specs.chipset.split(' ')[0]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                        <Camera className="w-3 h-3" />
                        {model.specs.camera.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Colors & Price */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-400">Giá từ</span>
                      <span className="text-base font-extrabold text-neutral-900">
                        {model.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/product/${model.slug ?? model.id}`)}
                      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-900 hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                      Khám Phá
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
