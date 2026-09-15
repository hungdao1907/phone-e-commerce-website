import React, { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowUpRight,
  BadgePercent,
  Layers,
  Sparkles,
  Star,
  Search,
  X,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';
import { BrandProductCard } from '@/components/smartphone/BrandProductCard';
import type { BrandConfig, BrandModel } from '@/types/smartphone';

type BrandProductFilter = 'popular' | 'promotion' | 'price-asc' | 'price-desc';

const PRODUCT_FILTERS = [
  { id: 'popular', label: 'Phổ biến', icon: Star },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide },
] as const;

const toPriceValue = (price: string) => Number.parseInt(price.replace(/\D/g, ''), 10) || 0;

const getDiscountValue = (product: BrandModel) =>
  product.originalPrice ? toPriceValue(product.originalPrice) - toPriceValue(product.price) : 0;

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

  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.12], [60, 0]);

  const [activeFilter, setActiveFilter] = useState<BrandProductFilter>('popular');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all distinct series from products
  const availableSeries = useMemo(() => {
    const seriesSet = new Set<string>();
    products.forEach((p) => {
      if (p.series) seriesSet.add(p.series);
    });
    return Array.from(seriesSet);
  }, [products]);

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let list = [...products];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.series?.toLowerCase().includes(q) ||
          p.specs?.chipset?.toLowerCase().includes(q) ||
          p.specs?.camera?.toLowerCase().includes(q)
      );
    }

    // 2. Series Tab Filter
    if (selectedSeries !== 'all') {
      list = list.filter((p) => p.series === selectedSeries);
    }

    // 3. Sorting / Filters
    if (activeFilter === 'promotion') {
      list = list
        .filter((p) => Boolean(p.originalPrice))
        .sort((a, b) => getDiscountValue(b) - getDiscountValue(a));
    } else if (activeFilter === 'price-asc') {
      list = list.sort((a, b) => toPriceValue(a.price) - toPriceValue(b.price));
    } else if (activeFilter === 'price-desc') {
      list = list.sort((a, b) => toPriceValue(b.price) - toPriceValue(a.price));
    }

    return list;
  }, [products, searchQuery, selectedSeries, activeFilter]);

  // Group products by series if "all" series and no search query
  const groupedSections = useMemo(() => {
    if (searchQuery.trim() || selectedSeries !== 'all') {
      return null;
    }

    // Use predefined groups from config, plus collect any remaining products
    const assignedIds = new Set<string>();
    const groups: {
      id: string;
      label: string;
      title: string;
      description: string;
      tagColor: string;
      products: BrandModel[];
    }[] = [];

    // Match with config.productGroups
    if (config.productGroups && config.productGroups.length > 0) {
      config.productGroups.forEach((groupDef) => {
        let matching = products.filter(
          (p) => p.series?.toLowerCase() === groupDef.series?.toLowerCase() || p.series?.toLowerCase() === groupDef.title?.toLowerCase()
        );

        if (activeFilter === 'promotion') {
          matching = matching
            .filter((p) => Boolean(p.originalPrice))
            .sort((a, b) => getDiscountValue(b) - getDiscountValue(a));
        } else if (activeFilter === 'price-asc') {
          matching = matching.sort((a, b) => toPriceValue(a.price) - toPriceValue(b.price));
        } else if (activeFilter === 'price-desc') {
          matching = matching.sort((a, b) => toPriceValue(b.price) - toPriceValue(a.price));
        }

        if (matching.length > 0) {
          matching.forEach((p) => assignedIds.add(p.id));
          groups.push({
            id: groupDef.id,
            label: groupDef.label || 'DÒNG SẢN PHẨM',
            title: groupDef.title,
            description: groupDef.description,
            tagColor: groupDef.tagColor || 'text-neutral-700 bg-neutral-100 border-neutral-200',
            products: matching,
          });
        }
      });
    }

    // Unassigned products fallback group (ensures 100% data visibility)
    const unassigned = products.filter((p) => !assignedIds.has(p.id));
    if (unassigned.length > 0) {
      let matching = [...unassigned];
      if (activeFilter === 'promotion') {
        matching = matching
          .filter((p) => Boolean(p.originalPrice))
          .sort((a, b) => getDiscountValue(b) - getDiscountValue(a));
      } else if (activeFilter === 'price-asc') {
        matching = matching.sort((a, b) => toPriceValue(a.price) - toPriceValue(b.price));
      } else if (activeFilter === 'price-desc') {
        matching = matching.sort((a, b) => toPriceValue(b.price) - toPriceValue(a.price));
      }

      if (matching.length > 0) {
        groups.push({
          id: 'other-products',
          label: 'DANH MỤC SẢN PHẨM',
          title: `Bộ Sưu Tập ${config.brand}`,
          description: `Đầy đủ các thiết bị ${config.brand} chính hãng với nhiều tùy chọn hấp dẫn.`,
          tagColor: 'text-blue-700 bg-blue-50 border-blue-200',
          products: matching,
        });
      }
    }

    return groups.length > 0 ? groups : null;
  }, [config.productGroups, config.brand, products, searchQuery, selectedSeries, activeFilter]);

  return (
    <section
      id={`${config.id}-all-products`}
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 bg-[#f8f9fc] text-neutral-900 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Glows */}
      <div
        className="absolute top-20 left-1/4 w-[450px] h-[450px] blur-[150px] rounded-full pointer-events-none opacity-25"
        style={{ backgroundColor: config.accent }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-[450px] h-[450px] blur-[150px] rounded-full pointer-events-none opacity-20"
        style={{ backgroundColor: config.accentSoft || '#60a5fa' }}
      />

      <motion.div style={{ opacity, y }} className="relative z-10 w-full max-w-7xl mx-auto flex flex-col">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-sm text-xs font-bold uppercase tracking-wider text-neutral-800"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: config.accent }} />
            <span>DANH MỤC TOÀN BỘ SẢN PHẨM</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950">
            {config.allProductsHeadlinePrefix}{' '}
            <span className={config.gradientText}>{config.allProductsHeadlineHighlight}</span>
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base md:text-lg leading-relaxed">
            {config.allProductsDescription}
          </p>
        </div>

        {/* Search Bar & Series Navigation Tabs */}
        <div className="w-full mb-10 space-y-4">
          {/* Real-time Search Input */}
          <div className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm điện thoại ${config.brand} (vd: Pro Max, Ultra, 512GB, 48MP...)`}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-neutral-200/90 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-all duration-200 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Series Tabs Filter */}
          {availableSeries.length > 1 && (
            <div className="flex overflow-x-auto no-scrollbar justify-start sm:justify-center gap-2 pt-2 pb-1">
              <button
                type="button"
                onClick={() => setSelectedSeries('all')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedSeries === 'all'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                }`}
              >
                Tất Cả ({products.length})
              </button>
              {availableSeries.map((series) => {
                const count = products.filter((p) => p.series === series).length;
                const isSelected = selectedSeries === series;
                return (
                  <button
                    key={series}
                    type="button"
                    onClick={() => setSelectedSeries(series)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                    }`}
                  >
                    {series} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Sorter & Quick Filter Chips */}
          <div className="flex overflow-x-auto no-scrollbar justify-start sm:justify-center gap-2 pt-1 pb-1">
            {PRODUCT_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-sm border-neutral-900 text-neutral-950 font-bold'
                      : 'border-neutral-200 bg-white/80 text-neutral-600 hover:border-neutral-300 hover:bg-white'
                  }`}
                  style={isActive ? { borderColor: config.accent, color: config.accent } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Display */}
        {groupedSections && groupedSections.length > 0 ? (
          /* Render by Grouped Sections */
          <div className="space-y-16 sm:space-y-20">
            {groupedSections.map((group, groupIdx) => (
              <div key={group.id} id={`group-${group.id}`} className="scroll-mt-24">
                {/* Group Header Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-200"
                >
                  <div className="space-y-1 max-w-2xl">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${group.tagColor}`}>
                      {group.label}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                      {group.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-normal">
                      {group.description}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-neutral-500">
                    <Layers className="w-4 h-4" />
                    <span>{group.products.length} sản phẩm</span>
                  </div>
                </motion.div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.products.map((product, idx) => (
                    <BrandProductCard
                      key={product.id}
                      product={product}
                      index={groupIdx * 4 + idx}
                      accentColor={config.accent}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : processedProducts.length > 0 ? (
          /* Render Flattened / Filtered Grid */
          <div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-neutral-600">
                Tìm thấy {processedProducts.length} sản phẩm phù hợp
              </span>
              {(searchQuery || selectedSeries !== 'all' || activeFilter !== 'popular') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSeries('all');
                    setActiveFilter('popular');
                  }}
                  className="text-xs font-bold text-neutral-900 hover:underline cursor-pointer"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedProducts.map((product, idx) => (
                <BrandProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  accentColor={config.accent}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-neutral-200">
            <p className="text-lg font-bold text-neutral-800">Không tìm thấy sản phẩm nào</p>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Không có sản phẩm nào khớp với từ khóa "{searchQuery}" hoặc bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSeries('all');
                setActiveFilter('popular');
              }}
              className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-colors"
            >
              Xem Tất Cả Sản Phẩm
            </button>
          </div>
        )}

        {/* Bottom Consultation & Trade-in Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>THU CŨ ĐỔI MỚI - TRỢ GIÁ TỚI 4.000.000₫</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              {config.consultTitle || `Bạn Cần Tư Vấn Chọn Mẫu ${config.brand} Phù Hợp?`}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
              {config.consultDescription || 'Đội ngũ chuyên viên kỹ thuật luôn sẵn sàng hỗ trợ bạn so sánh cấu hình, lựa chọn phiên bản bộ nhớ và thủ tục trả góp 0% nhanh nhất.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:19008888"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-bold transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Hotline 1900 8888</span>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default BrandAllProductsSection;
