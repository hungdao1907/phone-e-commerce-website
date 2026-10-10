import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import { FilteredProductCardSkeleton } from '@/components/store/FilteredProductCardSkeleton';
import { FilterDropdowns } from '@/components/store/FilterDropdowns';
import { Pagination } from '@/components/store/Pagination';
import { CategoryCards } from '@/components/category/CategoryCards';
import { CATEGORY_CONFIGS } from './CategoryConfig';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchActiveBannerCampaign, formatVND, resolveImageUrl } from '@/services/bannerCampaign.api';
import type { BannerCampaignProductItem } from '@/services/bannerCampaign.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MAIN_CATEGORIES = [
  { id: 'phone', label: 'Điện thoại', path: '/phone', image: '/images/cat_allproduct_phone.png' },
  { id: 'tablet', label: 'Máy tính bảng', path: '/tablet', image: '/images/cat_AllProduct_ipad.png' },
  { id: 'laptop', label: 'Laptop', path: '/laptop', image: '/images/cat_allproduct_laptop.png' },
  { id: 'watch', label: 'Đồng hồ', path: '/watch', image: '/images/cat_Allproduct_watch.png' }
];

/** Number of columns of the product grid (mirrors grid-cols-2 md:grid-cols-3 lg:grid-cols-5). */
function getGridColumns(): number {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth >= 1024) return 5;
  if (window.innerWidth >= 768) return 3;
  return 2;
}

const ROWS_PER_PAGE = 2;

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'newest', label: 'Mới nhất' }
];

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Validate slug
  const config = categorySlug ? CATEGORY_CONFIGS[categorySlug] : null;
  if (!config) {
    return <Navigate to="/" replace />;
  }

  const sortOption = searchParams.get('sort') || '';

  // Page size = columns x 2 rows, so every page is exactly 2 rows at any breakpoint
  const [columns, setColumns] = useState(getGridColumns);
  useEffect(() => {
    const onResize = () => setColumns(getGridColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const pageSize = columns * ROWS_PER_PAGE;
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  // Fetch products (server-side filtering + pagination)
  const fetchProducts = async () => {
    const params = new URLSearchParams(searchParams);
    // Overwrite category filter
    params.set('category', config.slug);
    // Convert 'Tất cả' to empty brand for API
    if (params.get('brand') === 'Tất cả') {
      params.delete('brand');
    }
    params.set('page', String(currentPage));
    params.set('limit', String(pageSize));
    const res = await fetch(`${API_URL}/api/products/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const { data: productsData, isFetching, isError, refetch } = useQuery({
    queryKey: ['categoryProducts', config.slug, searchParams.toString(), pageSize],
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000, // reuse cached results: re-clicking a brand shows products instantly
    gcTime: 15 * 60_000,
  });

  // Extract unique brands from data (or rely on API filters if needed, here we extract for simplicity)
  // Actually, standard API should provide filters, but for UI sake, we can map brands from `productsData.products`
  // or use a predefined list if API doesn't return aggregated brands.
  // Wait, let's fetch available filters as well
  const fetchFilters = async () => {
    const params = new URLSearchParams();
    params.set('category', config.slug);
    const res = await fetch(`${API_URL}/api/products/filters?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filters');
    return res.json();
  };

  const { data: filtersData } = useQuery({
    queryKey: ['categoryFilters', config.slug],
    queryFn: fetchFilters,
  });

  const totalPages: number = productsData?.totalPages || 1;
  const handlePageChange = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setSearchParams(next);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // If page no longer exists (e.g. window resized → bigger pages), fall back to the last page
  useEffect(() => {
    if (productsData && !isFetching && currentPage > totalPages) handlePageChange(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsData, isFetching, currentPage, totalPages]);

  const handleResetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Fetch active banner campaign for this category
  const { data: bannerCampaignData } = useQuery({
    queryKey: ['activeBannerCampaign', config.slug],
    queryFn: () => fetchActiveBannerCampaign(config.slug),
    staleTime: 60_000, // revalidate every 60s
  });

  const bannerProducts: BannerCampaignProductItem[] = bannerCampaignData?.products || [];
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  // Reset active product index when category changes
  useEffect(() => {
    setActiveProductIndex(0);
  }, [config.slug]);

  const activeProduct = bannerProducts[activeProductIndex] ?? null;

  const handleSortChange = (val: string) => {
    if (val) {
      searchParams.set('sort', val);
    } else {
      searchParams.delete('sort');
    }
    searchParams.delete('page');
    setSearchParams(searchParams);
    setIsSortOpen(false);
  };

  const handleCategoryCardClick = (card: any) => {
    navigate(card.path);
  };

  // Tùy chỉnh kích thước ảnh banner động cho từng danh mục
  const getBannerImageSizeClass = (slug: string) => {
    switch (slug) {
      case 'tablet':
        return "w-[120%] md:w-[150%] max-w-none h-auto object-contain drop-shadow-2xl md:-ml-10";
      case 'laptop':
        return "w-[150%] md:w-[160%] max-w-none h-auto object-contain drop-shadow-2xl md:-ml-10";
      case 'watch':
        return "w-[160%] md:w-[180%] max-w-none h-auto object-contain drop-shadow-2xl md:-ml-10";
      case 'phone':
      default:
        return "w-[200%] md:w-[210%] max-w-none h-auto object-contain drop-shadow-2xl md:-ml-30";
    }
  };

  // Tùy chỉnh kích thước ảnh banner tĩnh cho từng danh mục
  const getStaticBannerImageSizeClass = (slug: string) => {
    switch (slug) {
      case 'tablet':
        return "w-[90%] h-[90%] object-contain relative z-10 drop-shadow-2xl";
      case 'phone':
      default:
        return "w-[80%] h-[80%] object-contain relative z-10 drop-shadow-2xl";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-16 md:pt-[45px] pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* Banner Section — Campaign-powered or static fallback. Scales uniformly via cqw units. */}
        <section
          className="bg-[#F0F0F0] mb-8 relative flex flex-col md:grid md:grid-cols-4 md:items-stretch overflow-hidden group h-[500px] md:h-auto md:aspect-[1200/500] md:[container-type:inline-size] md:w-[min(96vw,1680px)] md:left-1/2 md:-translate-x-1/2 md:rounded-3xl"
          aria-label="Khuyến mãi"
        >
          {/* LEFT: Banner Title & Description (Col 1-2) */}
          <div className="md:col-span-2 p-8 md:p-[4cqw] z-10 flex flex-col justify-center">
            <h1 className="text-3xl md:text-[3.67cqw] font-extrabold tracking-tight text-neutral-900 mb-4 md:mb-[1.33cqw] leading-tight">
              {config.banner.title}
            </h1>
            <p className="text-neutral-600 mb-8 md:mb-[2.67cqw] md:max-w-[80%] text-base md:text-[1.5cqw]">
              {config.banner.description}
            </p>
            <div>
              <button
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white font-semibold py-2 px-6 md:py-[0.67cqw] md:px-[2cqw] md:text-[1.2cqw] rounded-full transition-colors outline-none"
              >
                {config.banner.buttonText}
              </button>
            </div>


          </div>

          {/* RIGHT: Product Info Card (Col 3) + Cutout Image (Col 4) */}
          {activeProduct ? (
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 relative flex flex-col md:flex-row items-center py-8 md:py-[4cqw] pr-4 md:pr-0"
            >
              {/* Product Info Card (Aligns with Col 3) */}
              <div className="z-20 bg-white rounded-none border border-[#F0F0F0] p-6 md:p-[2cqw] w-[85%] md:w-1/2 flex flex-col justify-center min-h-[100px] mt-40 md:mt-[13.3cqw]">
                {/* Tags */}
                {activeProduct.tags && activeProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 md:gap-[0.5cqw] md:mb-[0.67cqw]">
                    {activeProduct.tags.map((tag, idx) => {
                      const colors = [
                        'bg-red-500 text-white',
                        'bg-amber-500 text-white',
                        'bg-emerald-500 text-white',
                        'bg-blue-500 text-white',
                        'bg-purple-500 text-white',
                      ];
                      const colorClass = tag.color ? '' : colors[idx % colors.length];
                      return (
                        <span
                          key={tag.id}
                          className={`text-[10px] md:text-[0.83cqw] font-bold px-2.5 md:px-[0.9cqw] py-0.5 rounded uppercase tracking-wider ${colorClass}`}
                          style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Tên sản phẩm */}
                <h3 className="font-semibold text-base md:text-[1.5cqw] text-neutral-800 mb-2 md:mb-[0.67cqw] leading-snug pr-4">
                  {activeProduct.productName}
                </h3>



                {/* Khối Giá */}
                <div className="flex flex-col mb-4 md:mb-[1.33cqw]">
                  {activeProduct.discountPercent > 0 && (
                    <span className="text-sm md:text-[1.17cqw] text-neutral-400 line-through mb-1">
                      {formatVND(activeProduct.originalPrice)}
                    </span>
                  )}
                  <span className="text-[24px] md:text-[2cqw] font-extrabold text-neutral-900 leading-none">
                    {formatVND(activeProduct.salePrice)}
                  </span>
                </div>

                {/* Nút Xem ngay */}
                <button className="text-xs md:text-[1cqw] font-medium text-neutral-500 flex items-center gap-2 hover:text-neutral-800 transition-colors mt-auto w-max group/btn">
                  Xem ngay <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                </button>
              </div>

              {/* Cutout Image (Aligns with Col 4 + Overlaps) */}
              <div className="z-30 relative md:absolute md:top-0 md:bottom-0 md:right-0 md:w-[60%] flex items-center justify-center mt-[-40px] md:mt-0 pointer-events-none">
                <motion.img
                  key={activeProduct.id + '-img'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={resolveImageUrl(activeProduct.bannerImage) || config.banner.image}
                  alt={activeProduct.productName}
                  className={getBannerImageSizeClass(config.slug)}
                  onError={(e) => { e.currentTarget.src = config.banner.image; }}
                />
                {/* Floating Discount Badge */}
                {activeProduct.discountPercent > 0 && (
                  <div className="absolute top-4 md:top-[4cqw] right-4 md:right-[8cqw] w-12 h-12 md:w-[4.7cqw] md:h-[4.7cqw] bg-yellow-400 text-yellow-900 font-bold rounded-full flex items-center justify-center text-sm md:text-[1.33cqw] shadow-sm">
                    {activeProduct.discountPercent}%
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Fallback static banner Right side */
            <div className="md:col-span-2 relative flex items-center justify-center h-[250px] md:h-[400px]">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm z-20">
                {config.banner.badge}
              </div>
              <img
                src={config.banner.image}
                alt={config.banner.title}
                className={getStaticBannerImageSizeClass(config.slug)}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Right side Dot Navigation */}
          {activeProduct && bannerProducts.length > 1 && (
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-40" role="group" aria-label="Chọn sản phẩm">
              {bannerProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveProductIndex(i)}
                  aria-label={`Sản phẩm ${i + 1}`}
                  aria-pressed={i === activeProductIndex}
                  className={`transition-all duration-300 rounded-full focus:outline-none flex items-center justify-center ${i === activeProductIndex
                    ? 'w-7 h-7 border-2 border-neutral-400 p-0.5'
                    : 'w-7 h-7 p-0.5'
                    }`}
                >
                  <div className={`rounded-full transition-all duration-300 ${i === activeProductIndex ? 'w-2 h-2 bg-neutral-600' : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'}`} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Shortcuts */}
        {config.shortcuts && config.shortcuts.length > 0 && (
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-10">
            {config.shortcuts.map((sc, i) => {
              const Icon = sc.icon;
              return (
                <div key={i} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-neutral-200 shadow-sm text-sm font-medium text-neutral-700 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition-colors">
                  <Icon className="w-4 h-4" />
                  {sc.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Category Cards */}
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Danh mục</h2>
        <div className="mb-10">
          <CategoryCards
            items={MAIN_CATEGORIES}
            activeId={categorySlug || null}
            onSelect={handleCategoryCardClick}
          />
        </div>

        <div className="md:w-[min(96vw,1680px)] md:relative md:left-1/2 md:-translate-x-1/2">
          {/* Filter and Sort Bar */}
          <h2 id="products-section" className="text-xl font-bold text-neutral-900 mb-4 pt-4">Sản phẩm</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <FilterDropdowns
              categorySlug={config.slug}
              filtersData={filtersData}
            />

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-neutral-600 whitespace-nowrap">Sắp xếp</span>
              <div className="relative z-40">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center gap-2 bg-white px-4 py-2 rounded-full border text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 outline-none ${isSortOpen ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-700">{SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Mặc định'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="py-2">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleSortChange(opt.value)}
                            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center justify-between group"
                          >
                            <span className={sortOption === opt.value ? 'text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}>
                              {opt.label}
                            </span>
                            {sortOption === opt.value && <Check className="w-4 h-4 text-neutral-900" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Count & State */}
          <p className="text-sm text-neutral-500 mb-4" aria-live="polite">
            {isFetching ? 'Đang tải sản phẩm...' : `${productsData?.total || 0} sản phẩm`}
          </p>

          {isError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center flex flex-col items-center gap-2">
              <p>Đã xảy ra lỗi khi tải dữ liệu.</p>
              <button
                onClick={() => refetch()}
                className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 pb-12">
            {isFetching && Array.from({ length: pageSize }).map((_, i) => (
              <FilteredProductCardSkeleton key={i} />
            ))}

            {!isFetching && productsData?.data && productsData.data.length > 0 && (
              productsData.data.map((product: any) => (
                <FilteredProductCard
                  key={product.id}
                  product={product}
                  categorySlug={config.slug}
                />
              ))
            )}
          </div>

          {!isFetching && !isError && productsData?.data?.length > 0 && (
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}

          {!isFetching && (!productsData?.data || productsData.data.length === 0) && !isError && (
            <div className="text-center py-20 px-4 text-neutral-500 col-span-full bg-white rounded-3xl border border-neutral-200">
              <p className="text-lg font-semibold text-neutral-800">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-sm mt-1">Thử thay đổi khoảng giá hoặc bộ lọc của bạn.</p>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="mt-5 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
