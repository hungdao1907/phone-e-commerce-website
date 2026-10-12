import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BadgePercent,
  Sparkles,
  Star,
  Filter,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SidebarFilter } from '@/components/store/SidebarFilter';
import { ActiveFilterChips } from '@/components/store/ActiveFilterChips';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import { FilteredProductCardSkeleton } from '@/components/store/FilteredProductCardSkeleton';
import type { WatchBrandConfig, WatchBrandModel } from '../../../../types/watch/brand/types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WatchBrandAllProductsSectionProps {
  config: WatchBrandConfig;
  products: WatchBrandModel[]; // Used for series/family extraction
}

const BRAND_FILTER_MAPPING: Record<string, { categorySlug: string; brandName: string }> = {
  'apple-watch': { categorySlug: 'apple-watch', brandName: 'Apple' },
  'samsung': { categorySlug: 'samsung-watch', brandName: 'Samsung' },
  'xiaomi': { categorySlug: 'xiaomi-watch', brandName: 'Xiaomi' },
};

const PRODUCT_FILTERS = [
  { id: 'popular', label: 'Phổ biến', icon: Star, sortValue: 'newest' },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent, sortValue: 'promotion' },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide, sortValue: 'price_asc' },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide, sortValue: 'price_desc' },
] as const;

export function WatchBrandAllProductsSection({ config, products = [] }: WatchBrandAllProductsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const brandInfo = BRAND_FILTER_MAPPING[config.id] || { categorySlug: 'watch', brandName: config.label };
  const categorySlug = brandInfo.categorySlug;
  const brandName = brandInfo.brandName;

  // Extract all distinct families from the initial products to render Series Tabs
  const availableSeries = useMemo(() => {
    const seriesSet = new Set<string>();
    products.forEach((p) => {
      if (p.family) seriesSet.add(p.family);
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
    params.set('brand', brandName);
    
    const res = await fetch(`${API_URL}/api/products/filters?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filters');
    return res.json();
  };

  const fetchProducts = async () => {
    const params = new URLSearchParams(searchParams);
    params.set('category', categorySlug);
    params.set('brand', brandName);
    params.set('limit', '8');

    const res = await fetch(`${API_URL}/api/products/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const { data: filtersData, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['productsFilters', categorySlug, brandName, searchParams.toString()],
    queryFn: fetchFilters,
    placeholderData: keepPreviousData,
  });

  const { data: productsData, isLoading: isLoadingProducts, isFetching: isFetchingProducts } = useQuery({
    queryKey: ['productsSearch', categorySlug, brandName, searchParams.toString()],
    queryFn: fetchProducts,
  });

  const isProductsLoading = isLoadingProducts || isFetchingProducts;

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

  const handleResetFilters = () => {
    const params = new URLSearchParams();
    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);
    setSearchParams(params);
  };

  useEffect(() => {
    if (isMobileSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileSidebarOpen]);

  const totalPages = productsData?.totalPages || productsData?.pagination?.totalPages || 1;
  const currentPage = productsData?.page || productsData?.pagination?.page || 1;

  return (
    <section
      id="watch-all-products"
      ref={containerRef}
      aria-labelledby="watch-all-products-title"
      className="scroll-mt-16 bg-[#f6f7f9] px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        {/* Section Header */}
        <header className="mx-auto max-w-3xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
            <Sparkles className="h-3.5 w-3.5 text-[var(--watch-accent)]" />
            TẤT CẢ SẢN PHẨM
          </span>
          <h2 id="watch-all-products-title" className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Tìm {config.label} dành cho bạn
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">{config.allProductsDescription}</p>
        </header>

        {/* Search Bar & Series Navigation Tabs */}
        <div className="w-full mb-10 space-y-4 max-w-7xl mx-auto">
          {/* Real-time Search Input */}
          <div className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Tìm kiếm đồng hồ ${config.label} (vd: Ultra, Series 11, GPS, 46mm, Titan...)`}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-neutral-200/90 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-all duration-200 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="absolute right-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
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
              className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-neutral-200 text-sm font-semibold shadow-sm cursor-pointer"
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
                  aria-pressed={isActive}
                  onClick={() => handleSortChange(filter.sortValue)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'border-[var(--watch-accent)] bg-white text-[var(--watch-accent)] shadow-[0_2px_8px_rgba(15,23,42,0.08)] font-bold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Filter Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Area */}
          <div className={`
            fixed inset-0 z-50 bg-black/50 md:bg-transparent md:sticky md:top-24 md:h-[calc(100vh-120px)] md:w-64 md:flex-shrink-0 transition-opacity duration-300
            ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
          `}>
            <div 
              data-lenis-prevent="true"
              className={`
              absolute md:static inset-y-0 left-0 w-[85%] max-w-sm bg-[#f5f5f7] md:bg-transparent h-full md:w-full transition-transform duration-300 transform overflow-y-auto
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200 sticky top-0 z-10">
                <h2 className="font-bold text-lg">Bộ lọc sản phẩm</h2>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-neutral-100 rounded-full cursor-pointer">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 md:p-0 sidebar-filter-wrapper">
                <SidebarFilter 
                  filters={filtersData} 
                  isLoading={isLoadingFilters} 
                  hideCategoryAndBrand={true} 
                  categorySlug={categorySlug}
                  isWatch={true}
                  onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            <ActiveFilterChips />
            
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-neutral-600">
                {isProductsLoading ? 'Đang tải...' : `Tìm thấy ${productsData?.total || 0} sản phẩm phù hợp`}
              </span>
              {Array.from(searchParams.keys()).some(k => !['page', 'limit', 'sort'].includes(k)) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-neutral-900 hover:underline cursor-pointer"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              )}
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <FilteredProductCardSkeleton key={i} />
                ))}
              </div>
            ) : productsData?.data?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  Không có sản phẩm phù hợp với bộ lọc hiện tại. Vui lòng thử xóa bớt bộ lọc để xem thêm kết quả.
                </p>
                <button 
                  type="button"
                  onClick={handleResetFilters}
                  className="bg-[var(--watch-accent)] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {productsData?.data?.map((product: any) => (
                  <FilteredProductCard key={product.id} product={product} categorySlug={categorySlug} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition-all cursor-pointer ${
                      (currentPage === page)
                        ? 'bg-[var(--watch-accent)] text-white shadow-sm'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WatchBrandAllProductsSection;