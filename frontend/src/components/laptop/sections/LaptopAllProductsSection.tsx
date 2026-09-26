import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BadgePercent,
  Sparkles,
  Star,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SidebarFilter } from '@/components/store/SidebarFilter';
import { ActiveFilterChips } from '@/components/store/ActiveFilterChips';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import type { LaptopBrandConfig, LaptopModel } from '../../../types/laptop/types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LaptopAllProductsSectionProps {
  config: LaptopBrandConfig;
  products: LaptopModel[];
}

const PRODUCT_FILTERS = [
  { id: 'popular', label: 'Phổ biến', icon: Star, sortValue: 'newest' },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent, sortValue: 'promotion' },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide, sortValue: 'price_asc' },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide, sortValue: 'price_desc' },
] as const;

export function LaptopAllProductsSection({ config }: LaptopAllProductsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const categorySlug = 'laptop';
  let brandSlug = config.id.toLowerCase();
  if (brandSlug === 'macbook') brandSlug = 'apple';

  const activeSort = searchParams.get('sort') || 'newest';

  const fetchFilters = async () => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    params.delete('limit');
    params.delete('sort');
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

  return (
    <section
      id="laptop-all-products"
      ref={containerRef}
      aria-labelledby="laptop-all-products-title"
      className="scroll-mt-16 bg-[#f6f7f9] px-4 py-24 sm:px-6 sm:py-32 lg:px-8 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Section Header */}
        <header className="mx-auto max-w-3xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
            <Sparkles className="h-3.5 w-3.5 text-[var(--laptop-accent)]" />
            TẤT CẢ SẢN PHẨM
          </span>
          <h2 id="laptop-all-products-title" className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Danh sách {config.label} chính hãng
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">{config.allProductsDescription}</p>
        </header>

        {/* Quick Filter Chips (Restored) */}
        <div className="mt-12 mb-10 overflow-x-auto pb-2 no-scrollbar">
          <div
            className="flex w-max min-w-full justify-start gap-3 sm:justify-center items-center"
            role="group"
            aria-label={'Lọc sản phẩm ' + config.label}
          >
            <button
              className="md:hidden flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-neutral-200 text-base font-medium shadow-sm transition-all hover:border-neutral-300"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Filter className="w-5 h-5" />
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
                  className={
                    'inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-3 text-base font-medium transition-all ' +
                    (isActive
                      ? 'border-[var(--laptop-accent)] bg-white text-[var(--laptop-accent)] shadow-[0_4px_14px_rgba(15,23,42,0.08)] font-bold'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300')
                  }
                >
                  <Icon className="h-5 w-5" />
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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
                <button onClick={() => setIsMobileSidebarOpen(false)} className="w-full bg-[var(--laptop-accent)] text-white font-bold py-3 rounded-xl">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
                  Rất tiếc, không có sản phẩm nào khớp với các bộ lọc bạn đã chọn. Vui lòng thử xóa bớt bộ lọc để xem thêm kết quả.
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {productsData?.data?.map((product: any) => (
                    <FilteredProductCard 
                      key={product.id} 
                      product={product} 
                      categorySlug={categorySlug} 
                    />
                  ))}
                </div>

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
                              ? 'bg-[var(--laptop-accent)] text-white' 
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
      </div>
    </section>
  );
}
