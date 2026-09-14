import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Battery, Camera, Smartphone } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {featuredModels.map((model, idx) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group relative flex flex-col bg-white border border-neutral-200 hover:border-neutral-300 shadow-xl shadow-neutral-200/50 hover:shadow-2xl hover:shadow-neutral-300/50 rounded-[2rem] overflow-hidden transition-all duration-500"
            >
              {/* Card Ambient Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${model.accentColor}, transparent 70%)` }}
              />

              {/* Product Image */}
              <div className="relative w-full aspect-[16/9] overflow-hidden bg-white flex items-center justify-center p-4">
                <img
                  src={model.image}
                  alt={model.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-grow p-6 lg:p-8 relative z-10">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-1">{model.name}</h3>
                  <p className="text-sm font-medium" style={{ color: model.accentColor }}>{model.tagline}</p>
                </div>

                <p className="text-neutral-600 text-sm mb-6 flex-grow">{model.description}</p>

                {/* Specs */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-neutral-700">
                    <Smartphone className="w-4 h-4 text-neutral-500" />
                    <span>{model.specs.display}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-700">
                    <Cpu className="w-4 h-4 text-neutral-500" />
                    <span>{model.specs.chipset}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-700">
                    <Camera className="w-4 h-4 text-neutral-500" />
                    <span>{model.specs.camera}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-700">
                    <Battery className="w-4 h-4 text-neutral-500" />
                    <span>{model.specs.battery}</span>
                  </div>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-2 mb-8">
                  {model.colors.map((color) => (
                    <div
                      key={color.name}
                      title={color.name}
                      className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Giá từ</p>
                    <p className="text-xl font-bold">{model.price}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/product/' + (model.slug ?? model.id))}
                    className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-full bg-neutral-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer"
                  >
                    Khám Phá
                  </button>
                </div>
              </div>
            </motion.div>
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
