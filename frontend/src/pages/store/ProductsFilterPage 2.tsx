import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SidebarFilter } from '@/components/store/SidebarFilter';
import { ActiveFilterChips } from '@/components/store/ActiveFilterChips';
import { FilteredProductCard } from '@/components/store/FilteredProductCard';
import { Filter, SlidersHorizontal, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ProductsFilterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchFilters = async () => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    params.delete('limit');
    params.delete('sort');
    
    const res = await fetch(`${API_URL}/api/products/filters?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filters');
    return res.json();
  };

  const fetchProducts = async () => {
    const res = await fetch(`${API_URL}/api/products/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const { data: filtersData, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['productsFilters', searchParams.toString()],
    queryFn: fetchFilters,
    placeholderData: keepPreviousData,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsSearch', searchParams.toString()],
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
  });

  // Handle Sort Change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    searchParams.set('sort', e.target.value);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  // Handle Pagination
  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams(searchParams);
  };

  const currentCategory = searchParams.get('category') || 'Tất cả sản phẩm';

  // Toggle mobile sidebar body scroll lock
  useEffect(() => {
    if (isMobileSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-8 border-b border-neutral-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 capitalize">
              {currentCategory.replace('-', ' ')}
            </h1>
            <p className="text-neutral-500 mt-2 text-sm">
              {productsData ? `Hiển thị ${productsData.total} sản phẩm` : 'Đang tải...'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-neutral-200 text-sm font-semibold shadow-sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <select 
                className="appearance-none bg-white border border-neutral-200 rounded-full pl-9 pr-10 py-2 text-sm font-semibold text-neutral-700 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
                value={searchParams.get('sort') || ''}
                onChange={handleSortChange}
              >
                <option value="">Sắp xếp mặc định</option>
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Area */}
          <div className={`
            fixed inset-0 z-50 bg-black/50 md:bg-transparent md:static md:w-64 md:flex-shrink-0 transition-opacity duration-300
            ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
          `}>
            <div className={`
              absolute inset-y-0 left-0 w-[85%] max-w-sm bg-[#f5f5f7] md:bg-transparent h-full md:w-full transition-transform duration-300 transform overflow-y-auto md:overflow-visible
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200 sticky top-0 z-10">
                <h2 className="font-bold text-lg">Bộ lọc sản phẩm</h2>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-neutral-100 rounded-full">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 md:p-0">
                <SidebarFilter filters={filtersData} isLoading={isLoadingFilters} />
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
            
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {productsData?.data?.map((product: any) => (
                    <FilteredProductCard 
                      key={product.id} 
                      product={product} 
                      categorySlug={searchParams.get('category') || ''} 
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
      </div>
    </div>
  );
}

export default ProductsFilterPage;
