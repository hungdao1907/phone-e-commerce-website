import React, { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ArrowUpRight, BadgePercent, Layers, Sparkles, Star } from 'lucide-react';
import { BrandProductCard } from '../components/BrandProductCard';
import type { BrandConfig, BrandModel } from '../types';

type BrandProductFilter = 'popular' | 'promotion' | 'price-asc' | 'price-desc';

const PRODUCT_FILTERS = [
  { id: 'popular', label: 'Phổ biến', icon: Star },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide },
] as const;

const toPriceValue = (price: string) => Number.parseInt(price.replace(/\D/g, ''), 10);

const getDiscountValue = (product: BrandModel) => (
  product.originalPrice ? toPriceValue(product.originalPrice) - toPriceValue(product.price) : 0
);

interface BrandAllProductsSectionProps {
  config: BrandConfig;
  products: BrandModel[];
}

export function BrandAllProductsSection({ config, products }: BrandAllProductsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15], [60, 0]);
  const [activeFilter, setActiveFilter] = useState<BrandProductFilter>('popular');

  const filteredGroups = useMemo(() => (
    config.productGroups
      .map((group) => {
        let groupProducts = products.filter((p) => p.series === group.series);

        if (activeFilter === 'promotion') {
          groupProducts = groupProducts
            .filter((product) => product.originalPrice)
            .sort((first, second) => getDiscountValue(second) - getDiscountValue(first));
        }

        if (activeFilter === 'price-asc') {
          groupProducts = [...groupProducts].sort((first, second) => toPriceValue(first.price) - toPriceValue(second.price));
        }

        if (activeFilter === 'price-desc') {
          groupProducts = [...groupProducts].sort((first, second) => toPriceValue(second.price) - toPriceValue(first.price));
        }

        return { ...group, products: groupProducts };
      })
      .filter((group) => group.products.length > 0)
  ), [activeFilter, config.productGroups, products]);

  return (
    <section
      id={`${config.id}-all-products`}
      ref={containerRef}
      className="relative w-full py-24 sm:py-32 bg-[#f6f7fb] text-neutral-900 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div
        className="absolute top-20 left-1/4 w-96 h-96 blur-[130px] rounded-full pointer-events-none"
        style={{ backgroundColor: `${config.accent}18` }}
      />
      <div
        className="absolute top-1/2 right-1/4 w-96 h-96 blur-[130px] rounded-full pointer-events-none"
        style={{ backgroundColor: `${config.accentSoft}18` }}
      />

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col"
      >
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-sm text-xs font-semibold text-neutral-800"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: config.accent }} />
            <span>TẤT CẢ SẢN PHẨM</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
            {config.allProductsHeadlinePrefix}{' '}
            <span className={config.gradientText}>{config.allProductsHeadlineHighlight}</span>
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            {config.allProductsDescription}
          </p>
        </div>

        {/* Product filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="w-full mb-14 sm:mb-16"
        >
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 no-scrollbar">
            <div
              className="flex w-max min-w-full justify-start gap-3 pb-1 sm:justify-center"
              role="group"
              aria-label={`Lọc và sắp xếp sản phẩm ${config.brand}`}
            >
              {PRODUCT_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-3 text-base font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-[0_3px_12px_rgba(0,0,0,0.08)]'
                        : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                    style={isActive ? {
                      borderColor: config.accent,
                      color: config.accent,
                      backgroundColor: `${config.accent}08`,
                    } : undefined}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Product Groups */}
        <div className="space-y-24">
          {filteredGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              id={`group-${group.id}`}
              className="scroll-mt-24"
            >
              {/* Group Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-200"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${group.tagColor}`}>
                      {group.label}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    {group.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-normal">
                    {group.description}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-neutral-500">
                  <Layers className="w-4 h-4" />
                  <span>{group.products.length} sản phẩm</span>
                </div>
              </motion.div>

              {/* Product Cards Grid */}
              <div className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                {group.products.map((product, idx) => (
                  <div
                    key={product.id}
                    className="w-[82vw] max-w-[310px] shrink-0 sm:w-auto sm:max-w-none snap-center flex flex-col"
                  >
                    <BrandProductCard
                      product={product}
                      index={groupIdx * 4 + idx}
                      accentColor={config.accent}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {config.consultTitle}
            </h4>
            <p className="text-sm text-neutral-500">
              {config.consultDescription}
            </p>
          </div>

          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg shrink-0 cursor-pointer">
            <span>Tư Vấn Miễn Phí</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default BrandAllProductsSection;
