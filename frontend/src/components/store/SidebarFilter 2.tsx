import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PriceRangeSlider } from '@/components/ui/range-slider';

interface SidebarFilterProps {
  filters: any;
  isLoading: boolean;
  hideCategoryAndBrand?: boolean;
  categorySlug?: string;
}

export function SidebarFilter({ filters, isLoading, hideCategoryAndBrand, categorySlug }: SidebarFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    brand: true,
    price: true,
    ram: true,
    storage: true,
    cpu: true,
    gpu: true,
    screenSize: true,
    colors: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (key: string, value: string) => {
    const currentValues = searchParams.get(key)?.split(',') || [];
    let newValues = [...currentValues];
    
    // For single select items like category
    if (key === 'category') {
       if (currentValues.includes(value)) {
         searchParams.delete(key);
       } else {
         searchParams.set(key, value);
       }
       // Reset all other filters when category changes to prevent impossible combinations
       Array.from(searchParams.keys()).forEach(k => {
         if (k !== 'category') searchParams.delete(k);
       });
       setSearchParams(searchParams);
       return;
    }

    if (newValues.includes(value)) {
      newValues = newValues.filter(v => v !== value);
    } else {
      newValues.push(value);
    }

    if (newValues.length > 0) {
      searchParams.set(key, newValues.join(','));
    } else {
      searchParams.delete(key);
    }
    
    // Reset page to 1 on filter change
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePriceChange = (min: string, max: string) => {
    if (min) searchParams.set('minPrice', min);
    else searchParams.delete('minPrice');
    
    if (max) searchParams.set('maxPrice', max);
    else searchParams.delete('maxPrice');
    
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    // Keep category if it exists
    const cat = searchParams.get('category');
    searchParams.forEach((_, key) => searchParams.delete(key));
    if (cat) searchParams.set('category', cat);
    setSearchParams(searchParams);
  };

  const currentCategory = categorySlug || searchParams.get('category') || '';
  const isPhone = ['phone', 'iphone', 'samsung', 'xiaomi', 'oppo'].includes(currentCategory);
  const isLaptop = ['laptop', 'macbook', 'asus', 'lenovo'].includes(currentCategory);
  
  const FilterSection = ({ title, sectionKey, options }: { title: string, sectionKey: string, options: string[] }) => {
    if (!options || options.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];
    const selectedValues = searchParams.get(sectionKey)?.split(',') || [];

    return (
      <div className="border-b border-neutral-200 py-4">
        <button 
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection(sectionKey)}
        >
          <span className="text-sm font-bold text-neutral-900">{title}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {isExpanded && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {options.map((option, idx) => (
              <label key={idx} className="flex items-center group cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleFilterChange(sectionKey, option)}
                />
                <span className="ml-2 text-sm text-neutral-600 group-hover:text-neutral-900">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-neutral-100 p-5 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Bộ Lọc</h2>
        <button 
          onClick={clearFilters}
          className="text-xs font-semibold text-blue-500 hover:text-blue-600"
        >
          Xóa tất cả
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-neutral-100 rounded"></div>
          <div className="h-32 bg-neutral-100 rounded"></div>
          <div className="h-32 bg-neutral-100 rounded"></div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Category Quick Links (Simplified) */}
          {!hideCategoryAndBrand && (
            <div className="border-b border-neutral-200 py-4">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">Danh Mục</h3>
              <div className="flex flex-wrap gap-2">
                {['Phone', 'Laptop', 'Tablet', 'Watch'].map(cat => {
                  const lowerCat = cat.toLowerCase();
                  const isActive = currentCategory === lowerCat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleFilterChange('category', lowerCat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                        isActive 
                          ? 'bg-neutral-900 text-white border-neutral-900' 
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!hideCategoryAndBrand && (
             <FilterSection title="Thương Hiệu" sectionKey="brand" options={filters?.brands || []} />
          )}
          
          {/* Price Range Filter */}
          <div className="border-b border-neutral-200 py-4">
             <button 
                className="flex items-center justify-between w-full text-left"
                onClick={() => toggleSection('price')}
              >
                <span className="text-sm font-bold text-neutral-900">Mức Giá</span>
                {expandedSections['price'] ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              {expandedSections['price'] && (
                <div className="mt-4 px-2">
                   <PriceRangeSlider 
                     min={0}
                     max={99000000}
                     step={500000}
                     value={[
                       Number(searchParams.get('minPrice')) || 0,
                       Number(searchParams.get('maxPrice')) || 99000000
                     ]}
                     onValueCommit={([min, max]) => {
                       handlePriceChange(min.toString(), max.toString());
                     }}
                     data={Array.from({ length: 60 }, (_, i) => {
                       // Create a smooth ascending curve (exponential-like)
                       const normalized = i / 59;
                       return 0.05 + Math.pow(normalized, 1.5) * 0.95;
                     })}
                   />
                </div>
              )}
          </div>

          {/* Dynamic Specs Based on Category */}
          <FilterSection title={isPhone ? "RAM" : "RAM"} sectionKey="ram" options={filters?.ram || []} />
          <FilterSection title={isLaptop ? "Dung Lượng / Ổ Cứng" : "Dung Lượng"} sectionKey="storage" options={filters?.storage || []} />
          
          {(isLaptop || !currentCategory) && (
            <>
              <FilterSection title="CPU / Chip" sectionKey="cpu" options={filters?.cpu || []} />
              <FilterSection title="Card Đồ Họa (GPU)" sectionKey="gpu" options={filters?.gpu || []} />
            </>
          )}

          {(isPhone || !currentCategory) && (
            <FilterSection title="Camera" sectionKey="camera" options={filters?.camera || []} />
          )}

          {(isPhone || isLaptop || !currentCategory) && (
            <FilterSection title="Màn Hình" sectionKey="screenSize" options={filters?.screenSize || []} />
          )}
          
          <FilterSection title="Màu Sắc" sectionKey="colors" options={filters?.colors || []} />

        </div>
      )}
    </div>
  );
}
