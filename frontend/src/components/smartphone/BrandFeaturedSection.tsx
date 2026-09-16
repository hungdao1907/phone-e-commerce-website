import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Battery, Camera, Smartphone } from 'lucide-react';
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

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

  const featuredModels = (
    products.filter((product) => product.featured).length > 0
      ? products.filter((product) => product.featured)
      : products
  ).slice(0, 3);

  const scrollToAllProducts = () => {
    const el = document.getElementById(`${config.id}-all-products`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id={`${config.id}-featured-products`}
      ref={containerRef}
      className="relative w-full min-h-screen py-24 bg-white text-neutral-900 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-[120px] rounded-full pointer-events-none"
        style={{ backgroundColor: `${config.accent}18` }}
      />

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center"
      >
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium"
            style={{
              backgroundColor: `${config.accent}0D`,
              borderColor: `${config.accent}25`,
              color: config.accent,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.accent }} />
            {config.featuredBadgeText}
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {config.featuredHeadlinePrefix}{' '}
            <span className={config.gradientAI}>{config.featuredHeadlineHighlight}</span>
          </h2>
          <p className="text-neutral-600 max-w-2xl mx-auto text-lg">
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

        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={scrollToAllProducts}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-neutral-900 border border-neutral-900 hover:bg-black transition-all text-white font-medium shadow-lg hover:shadow-xl cursor-pointer"
          >
            Xem Tất Cả Sản Phẩm
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}

export default BrandFeaturedSection;
