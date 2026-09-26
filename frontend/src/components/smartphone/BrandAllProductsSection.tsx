import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BadgePercent,
  Layers,
  Sparkles,
  Star,
  Search,
  X,
  PhoneCall,
  RefreshCw,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SidebarFilter } from '@/components/store/SidebarFilter';
import { ActiveFilterChips } from '@/components/store/ActiveFilterChips';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import type { BrandConfig, BrandModel } from '@/types/smartphone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface BrandAllProductsSectionProps {
  config: BrandConfig;
  products: BrandModel[]; // We keep this for series extraction
}

const PRODUCT_FILTERS = [
  { id: 'popular', label: 'Phổ biến', icon: Star, sortValue: 'newest' },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent, sortValue: 'promotion' },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide, sortValue: 'price_asc' },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide, sortValue: 'price_desc' },
] as const;

export function BrandAllProductsSection({ config, products }: BrandAllProductsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.12], [60, 0]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Mappings
  const categorySlug = 'phone';
  let brandSlug = config.id.toLowerCase();
  if (brandSlug === 'iphone') brandSlug = 'apple';

  // Extract all distinct series from the initial 'products' prop to render the Series Tabs
  const availableSeries = useMemo(() => {
    const seriesSet = new Set<string>();
    products.forEach((p) => {
      if (p.series) seriesSet.add(p.series);
    });
    return Array.from(seriesSet);
  }, [products]);

  const activeSeries = searchParams.get('series') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';

  const fetchFilters = async () => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    params.delete('limit');
    params.delete('sort');
    params.delete('series');
    params.delete('q');
    params.set('category', categorySlug);
    params.set('brand', brandSlug);
    
    const res = await fetch(`${API_URL}/api/products/filters?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filters');
    return res.json();
  };

  const fetchProducts = async () => {
    const params = new URLSearchParams(searchParams);
    params.set('category', categorySlug);
    params.set('brand', brandSlug);

    const res = await fetch(`${API_URL}/api/products/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const { data: filtersData, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['productsFilters', categorySlug, brandSlug, searchParams.toString()],
    queryFn: fetchFilters,
    placeholderData: keepPreviousData,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsSearch', categorySlug, brandSlug, searchParams.toString()],
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
  });

  const handleSortChange = (sortValue: string) => {
    searchParams.set('sort', sortValue);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleSeriesChange = (series: string) => {
    if (series === 'all') {
      searchParams.delete('series');
    } else {
      searchParams.set('series', series);
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleSearch = (q: string) => {
    if (q) searchParams.set('q', q);
    else searchParams.delete('q');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString());
    if (containerRef.current) {
       const topPos = containerRef.current.getBoundingClientRect().top + window.scrollY - 100;
       window.scrollTo({ top: topPos, behavior: 'smooth' });
    }
    setSearchParams(searchParams);
  };

  useEffect(() => {
    if (isMobileSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileSidebarOpen]);

  // Group products by series if we want to show the grouped layout 
  // (only if no deep filters/search/sort are active, otherwise flatten)
  const isDefaultView = !searchQuery && activeSeries === 'all' && activeSort === 'newest' && Array.from(searchParams.keys()).filter(k => !['category','brand','page','sort','series','q'].includes(k)).length === 0;

  return (
    <section
      id={`${config.id}-all-products`}
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 bg-[#f8f9fc] text-neutral-900 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div
        className="absolute top-20 left-1/4 w-[450px] h-[450px] blur-[150px] rounded-full pointer-events-none opacity-25"
        style={{ backgroundColor: config.accent }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-[450px] h-[450px] blur-[150px] rounded-full pointer-events-none opacity-20"
        style={{ backgroundColor: config.accentSoft || '#60a5fa' }}
      />

      <motion.div style={{ opacity, y }} className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col">
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

        {/* Search Bar & Series Navigation Tabs (Restored) */}
        <div className="w-full mb-10 space-y-4 max-w-7xl mx-auto">
          {/* Real-time Search Input */}
          <div className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Tìm kiếm điện thoại ${config.brand} (vd: Pro Max, Ultra, 512GB, 48MP...)`}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-neutral-200/90 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-all duration-200 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
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
                onClick={() => handleSeriesChange('all')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeSeries === 'all'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                }`}
              >
                Tất Cả
              </button>
              {availableSeries.map((series) => {
                const isSelected = activeSeries === series;
                return (
                  <button
                    key={series}
                    type="button"
                    onClick={() => handleSeriesChange(series)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                    }`}
                  >
                    {series}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sorter & Quick Filter Chips */}
          <div className="flex overflow-x-auto no-scrollbar justify-start sm:justify-center gap-2 pt-1 pb-1">
            <button
              className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-neutral-200 text-sm font-semibold shadow-sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
            
            {PRODUCT_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeSort === filter.sortValue;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleSortChange(filter.sortValue)}
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

        {/* Dynamic Filter Layout - Sidebar + Grid */}
        <div className="flex flex-col md:flex-row gap-8 max-w-[1400px] mx-auto w-full">
          
          {/* Sidebar Area */}
          <div className={`
            fixed inset-0 z-50 bg-black/50 md:bg-transparent md:static md:w-64 md:flex-shrink-0 transition-opacity duration-300
            ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
          `}>
            <div className={`
              absolute md:static inset-y-0 left-0 w-[85%] max-w-sm bg-[#f5f5f7] md:bg-transparent h-full md:h-auto md:w-full transition-transform duration-300 transform overflow-y-auto md:overflow-visible
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200 sticky top-0 z-10">
                <h2 className="font-bold text-lg">Bộ lọc sản phẩm</h2>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-neutral-100 rounded-full">
                  <span className="sr-only">Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 md:p-0 sidebar-filter-wrapper">
                <SidebarFilter 
                  filters={filtersData} 
                  isLoading={isLoadingFilters} 
                  hideCategoryAndBrand={true} 
                  categorySlug={categorySlug}
                />
              </div>
              <div className="md:hidden sticky bottom-0 p-4 bg-white border-t border-neutral-200">
                <button onClick={() => setIsMobileSidebarOpen(false)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            <ActiveFilterChips />
            
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-neutral-600">
                {isLoadingProducts ? 'Đang tải...' : `Tìm thấy ${productsData?.total || 0} sản phẩm phù hợp`}
              </span>
              {Array.from(searchParams.keys()).length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="text-xs font-bold text-neutral-900 hover:underline cursor-pointer"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              )}
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-neutral-100"></div>
                ))}
              </div>
            ) : productsData?.data?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  Rất tiếc, không có sản phẩm nào khớp với các bộ lọc bạn đã chọn.
                </p>
                <button 
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="bg-neutral-900 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <>
                {isDefaultView && config.productGroups ? (
                  // Render grouped by series if default view
                  <div className="space-y-16 sm:space-y-20">
                    {(() => {
                      const getProductSeries = (p: any) => {
                        if (p.series) return p.series;
                        const name = (p.name || '').toLowerCase();
                        if (brandSlug === 'apple' || brandSlug === 'iphone') {
                          return name.includes('pro') ? 'iPhone Pro' : 'iPhone';
                        }
                        if (brandSlug === 'samsung') {
                          if (name.includes('fold') || name.includes('flip')) return 'Galaxy Z Series';
                          if (name.includes('s2') || name.includes('ultra')) return 'Galaxy S Series';
                          return 'Galaxy Series';
                        }
                        if (brandSlug === 'xiaomi') {
                          if (name.includes('redmi')) return 'Redmi Series';
                          if (name.includes('ultra') || name.includes('pro')) return 'Xiaomi Flagship';
                          return 'Xiaomi Series';
                        }
                        if (brandSlug === 'oppo') {
                          if (name.includes('find')) return 'Find Series';
                          if (name.includes('reno')) return 'Reno Series';
                          return 'Oppo Series';
                        }
                        return 'Dòng Mới';
                      };

                      const assignedIds = new Set<string>();
                      const productsList: any[] = productsData?.data || [];
                      const renderedGroups = config.productGroups.map((groupDef) => {
                        const matching = productsList.filter((p: any) => {
                          const pSeries = getProductSeries(p);
                          return (
                            pSeries?.toLowerCase() === groupDef.series?.toLowerCase() ||
                            pSeries?.toLowerCase() === groupDef.title?.toLowerCase()
                          );
                        });
                        if (matching.length === 0) return null;
                        
                        matching.forEach((p: any) => assignedIds.add(p.id));
                        
                        return (
                          <div key={groupDef.id} className="scroll-mt-24">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5 }}
                              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-200"
                            >
                              <div className="space-y-1 max-w-2xl">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${groupDef.tagColor || 'text-neutral-700 bg-neutral-100 border-neutral-200'}`}>
                                  {groupDef.label || 'DÒNG SẢN PHẨM'}
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                                  {groupDef.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-neutral-600 leading-normal">
                                  {groupDef.description}
                                </p>
                              </div>
                              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-neutral-500">
                                <Layers className="w-4 h-4" />
                                <span>{matching.length} sản phẩm</span>
                              </div>
                            </motion.div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                              {matching.map((product: any) => (
                                <FilteredProductCard 
                                  key={product.id} 
                                  product={product} 
                                  categorySlug={categorySlug} 
                                />
                              ))}
                            </div>
                          </div>
                        );
                      });

                      const unassigned = productsList.filter((p: any) => !assignedIds.has(p.id));
                      
                      return (
                        <>
                          {renderedGroups}
                          {unassigned.length > 0 && (
                            <div key="unassigned" className="scroll-mt-24">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-neutral-200"
                              >
                                <div className="space-y-1 max-w-2xl">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border text-blue-700 bg-blue-50 border-blue-200">
                                    DANH MỤC SẢN PHẨM
                                  </span>
                                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                                    Bộ Sưu Tập {config.brand}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-neutral-600 leading-normal">
                                    Đầy đủ các thiết bị {config.brand} chính hãng với nhiều tùy chọn hấp dẫn.
                                  </p>
                                </div>
                                <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-neutral-500">
                                  <Layers className="w-4 h-4" />
                                  <span>{unassigned.length} sản phẩm</span>
                                </div>
                              </motion.div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                {unassigned.map((product: any) => (
                                  <FilteredProductCard 
                                    key={product.id} 
                                    product={product} 
                                    categorySlug={categorySlug} 
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  // Flattened grid
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {(productsData?.data || []).map((product: any) => (
                      <FilteredProductCard 
                        key={product.id} 
                        product={product} 
                        categorySlug={categorySlug} 
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {productsData?.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button 
                      disabled={productsData.page === 1}
                      onClick={() => handlePageChange(productsData.page - 1)}
                      className="px-4 py-2 border border-neutral-200 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    >
                      Trước
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: productsData.totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePageChange(idx + 1)}
                          className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                            productsData.page === idx + 1 
                              ? 'bg-neutral-900 text-white' 
                              : 'bg-transparent text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={productsData.page === productsData.totalPages}
                      onClick={() => handlePageChange(productsData.page + 1)}
                      className="px-4 py-2 border border-neutral-200 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
