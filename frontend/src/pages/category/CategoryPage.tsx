import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import { CategoryCards } from '@/components/category/CategoryCards';
import { CATEGORY_CONFIGS } from './CategoryConfig';
import { SlidersHorizontal } from 'lucide-react';
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

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Validate slug
  const config = categorySlug ? CATEGORY_CONFIGS[categorySlug] : null;
  if (!config) {
    return <Navigate to="/" replace />;
  }

  const selectedBrand = searchParams.get('brand') || 'Tất cả';
  const sortOption = searchParams.get('sort') || '';

  // Fetch products
  const fetchProducts = async () => {
    const params = new URLSearchParams(searchParams);
    // Overwrite category filter
    params.set('category', config.slug);
    // Convert 'Tất cả' to empty brand for API
    if (params.get('brand') === 'Tất cả') {
      params.delete('brand');
    }
    const res = await fetch(`${API_URL}/api/products/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['categoryProducts', config.slug, searchParams.toString()],
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
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

  const availableBrands = useMemo(() => {
    const apiBrands = filtersData?.brands || [];
    return ['Tất cả', ...apiBrands];
  }, [filtersData]);

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

  const handleBrandClick = (brand: string) => {
    if (brand === 'Tất cả') {
      searchParams.delete('brand');
    } else {
      searchParams.set('brand', brand);
    }
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      searchParams.set('sort', e.target.value);
    } else {
      searchParams.delete('sort');
    }
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const handleCategoryCardClick = (card: any) => {
    navigate(card.path);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* Banner Section — Campaign-powered or static fallback */}
        <section
          className="bg-[#F0F0F0] mb-8 relative flex flex-col md:grid md:grid-cols-4 md:items-stretch overflow-hidden group h-[500px]"
          aria-label="Khuyến mãi"
        >
          {/* LEFT: Banner Title & Description (Col 1-2) */}
          <div className="md:col-span-2 p-8 md:p-12 z-10 flex flex-col justify-center">
            <h1 className="text-3xl md:text-[2.75rem] font-extrabold tracking-tight text-neutral-900 mb-4 leading-tight">
              {config.banner.title}
            </h1>
            <p className="text-neutral-600 mb-8 max-w-md text-base md:text-lg">
              {config.banner.description}
            </p>
            <div>
              <button
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white font-semibold py-2 px-6 rounded-full transition-colors outline-none"
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
              className="md:col-span-2 relative flex flex-col md:flex-row items-center py-8 md:py-12 pr-4 md:pr-0"
            >
              {/* Product Info Card (Aligns with Col 3) */}
              <div className="z-20 bg-white rounded-none border border-[#F0F0F0] p-6 w-[85%] md:w-1/2 flex flex-col justify-center min-h-[100px] mt-40">
                {/* Tags */}
                {activeProduct.tags && activeProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
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
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${colorClass}`}
                          style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Tên sản phẩm */}
                <h3 className="font-semibold text-base md:text-lg text-neutral-800 mb-2 leading-snug pr-4">
                  {activeProduct.productName}
                </h3>



                {/* Khối Giá */}
                <div className="flex flex-col mb-4">
                  {activeProduct.discountPercent > 0 && (
                    <span className="text-sm text-neutral-400 line-through mb-1">
                      {formatVND(activeProduct.originalPrice)}
                    </span>
                  )}
                  <span className="text-[24px] font-extrabold text-neutral-900 leading-none">
                    {formatVND(activeProduct.salePrice)}
                  </span>
                </div>

                {/* Nút Xem ngay */}
                <button className="text-xs font-medium text-neutral-500 flex items-center gap-2 hover:text-neutral-800 transition-colors mt-auto w-max group/btn">
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
                  className="w-[200%] md:w-[240%] max-w-none h-auto object-contain drop-shadow-2xl md:-ml-30"
                  onError={(e) => { e.currentTarget.src = config.banner.image; }}
                />
                {/* Floating Discount Badge */}
                {activeProduct.discountPercent > 0 && (
                  <div className="absolute top-4 md:top-12 right-4 md:right-25 w-12 h-12 md:w-14 md:h-14 bg-yellow-400 text-yellow-900 font-bold rounded-full flex items-center justify-center text-sm md:text-base shadow-sm">
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
                className="w-[80%] h-[80%] object-contain relative z-10 drop-shadow-2xl"
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
                  className={`transition-all duration-300 rounded-full focus:outline-none flex items-center justify-center ${
                    i === activeProductIndex
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

        {/* Filter and Sort Bar */}
        <h2 id="products-section" className="text-xl font-bold text-neutral-900 mb-4 pt-4">Sản phẩm</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo hãng">
            {availableBrands.map(brand => (
              <button
                key={brand}
                aria-pressed={selectedBrand === brand}
                onClick={() => handleBrandClick(brand)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 outline-none ${selectedBrand === brand
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 whitespace-nowrap">Sắp xếp</span>
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="appearance-none bg-white border border-neutral-200 rounded-full pl-9 pr-10 py-2 text-sm font-semibold text-neutral-700 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none cursor-pointer"
              >
                <option value="">Mặc định</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="newest">Mới nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count & State */}
        <p className="text-sm text-neutral-500 mb-4" aria-live="polite">
          {isLoading ? 'Đang tải sản phẩm...' : `${productsData?.total || 0} sản phẩm`}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pb-12">
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-neutral-200 p-4 h-[350px] animate-pulse">
              <div className="w-full h-40 bg-neutral-100 rounded-xl mb-4"></div>
              <div className="w-3/4 h-5 bg-neutral-100 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-neutral-100 rounded mb-4"></div>
              <div className="w-full mt-auto h-8 bg-neutral-100 rounded"></div>
            </div>
          ))}

          {!isLoading && productsData?.data && productsData.data.length > 0 && (
            productsData.data.map((product: any) => (
              <FilteredProductCard
                key={product.id}
                product={product}
                categorySlug={config.slug}
              />
            ))
          )}
        </div>

        {!isLoading && (!productsData?.data || productsData.data.length === 0) && !isError && (
          <div className="text-center py-20 text-neutral-500 col-span-full bg-white rounded-3xl border border-neutral-200">
            <p className="text-lg">Không có sản phẩm phù hợp. Hãy thử đổi hãng hoặc danh mục.</p>
          </div>
        )}

      </div>
    </div>
  );
}
