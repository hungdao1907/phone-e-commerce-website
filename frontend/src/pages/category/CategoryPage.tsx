import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import { CategoryCards } from '@/components/category/CategoryCards';
import { CATEGORY_CONFIGS } from './CategoryConfig';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

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
        
        {/* Banner Section */}
        <section 
          className="bg-white border border-neutral-200 rounded-[20px] p-6 md:p-12 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-sm overflow-hidden relative"
          aria-label="Khuyến mãi"
        >
          <div className="flex-1 z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 leading-tight">
              {config.banner.title}
            </h1>
            <p className="text-neutral-500 mb-8 max-w-md text-base md:text-lg">
              {config.banner.description}
            </p>
            <button 
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition-colors focus:ring-4 focus:ring-blue-100 outline-none"
            >
              {config.banner.buttonText}
            </button>
          </div>
          
          <div className="flex-1 relative w-full h-[200px] md:h-[300px] z-10 flex items-center justify-center">
            {/* The badge */}
            <div className="absolute top-0 right-4 bg-yellow-400 text-yellow-900 font-bold text-xs md:text-sm px-3 py-1.5 rounded-full shadow-sm z-20">
              {config.banner.badge}
            </div>
            {/* Decorative background circle */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-emerald-50 rounded-full scale-[0.8] md:scale-100 blur-2xl opacity-60"></div>
            <img 
              src={config.banner.image} 
              alt={config.banner.title} 
              className="w-full h-full object-contain relative z-10 scale-110 drop-shadow-2xl"
              onError={(e) => {
                // Fallback icon if image is missing
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
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
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 outline-none ${
                  selectedBrand === brand 
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
