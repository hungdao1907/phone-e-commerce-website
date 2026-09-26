import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PriceRangeSlider } from '@/components/ui/range-slider';

interface SidebarFilterProps {
  filters: any;
  isLoading: boolean;
  hideCategoryAndBrand?: boolean;
  categorySlug?: string;
  isWatch?: boolean;
}

export function SidebarFilter({ filters, isLoading, hideCategoryAndBrand, categorySlug, isWatch }: SidebarFilterProps) {
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
    color: true,
    camera: true,
    size: true,
    connectivity: true,
    material: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'color' && searchParams.has('colors')) {
      searchParams.delete('colors');
    }

    const currentValues = searchParams.get(key)?.split(',').filter(Boolean) || [];
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
    // Keep category and sort if they exist
    const cat = searchParams.get('category');
    const sort = searchParams.get('sort');
    Array.from(searchParams.keys()).forEach(key => searchParams.delete(key));
    if (cat) searchParams.set('category', cat);
    if (sort) searchParams.set('sort', sort);
    setSearchParams(searchParams);
  };

  const currentCategory = categorySlug || searchParams.get('category') || '';
  const isWatchMode = Boolean(isWatch || currentCategory.includes('watch') || currentCategory === 'dong-ho-thong-minh');
  const isPhone = ['phone', 'iphone', 'samsung', 'xiaomi', 'oppo'].includes(currentCategory);
  const isLaptop = ['laptop', 'macbook', 'asus', 'lenovo'].includes(currentCategory);
  
  // Standard checkbox filter section
  const FilterSection = ({ title, sectionKey, options }: { title: string, sectionKey: string, options: string[] }) => {
    if (!options || options.length === 0) return null;
    const isExpanded = expandedSections[sectionKey] !== false;
    const rawValues = searchParams.get(sectionKey)?.split(',') || [];
    const legacyValues = sectionKey === 'color' ? (searchParams.get('colors')?.split(',') || []) : [];
    const selectedValues = [...rawValues, ...legacyValues].filter(Boolean);

    return (
      <div className="border-b border-neutral-200 py-4">
        <button 
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection(sectionKey)}
          type="button"
        >
          <span className="text-sm font-bold text-neutral-900">{title}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {isExpanded && (
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {options.map((option, idx) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={idx}
                  onClick={() => handleFilterChange(sectionKey, option)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-green-50 text-green-600 border-green-500'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-900 hover:text-neutral-900'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Color filter with circle swatches
  const ColorFilterSection = () => {
    const colorOptions: string[] = filters?.colors || [];
    const colorCodes: Record<string, string> = filters?.colorCodes || {};
    if (!colorOptions || colorOptions.length === 0) return null;
    
    const isExpanded = expandedSections['colors'] !== false;
    const selectedValues = searchParams.get('color')?.split(',') || [];

    // Map color names to hex codes (using colorCodes from backend, or fallback)
    const fallbackColorMap: Record<string, string> = {
      'đen': '#1c1c1e', 'black': '#1c1c1e',
      'trắng': '#f5f5f0', 'white': '#f5f5f0',
      'xanh': '#3478F6', 'blue': '#3478F6',
      'đỏ': '#c82333', 'red': '#c82333',
      'vàng': '#e3c6a4', 'gold': '#e3c6a4',
      'hồng': '#e8d1cf', 'pink': '#e8d1cf',
      'tím': '#8B5CF6', 'purple': '#8B5CF6',
      'bạc': '#c0c0c0', 'silver': '#c0c0c0',
      'titan': '#878681',
      'xám': '#808080', 'gray': '#808080', 'grey': '#808080',
    };

    const getColorHex = (name: string) => {
      // First check backend colorCodes
      if (colorCodes[name]) return colorCodes[name];
      // Fallback
      const lower = name.toLowerCase();
      for (const [key, hex] of Object.entries(fallbackColorMap)) {
        if (lower.includes(key)) return hex;
      }
      return '#cccccc';
    };

    return (
      <div className="border-b border-neutral-200 py-4">
        <button 
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection('colors')}
        >
          <span className="text-sm font-bold text-neutral-900">Màu Sắc</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {isExpanded && (
          <div className="mt-3 space-y-2.5 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
            {colorOptions.map((colorName, idx) => {
              const isSelected = selectedValues.includes(colorName);
              const hex = getColorHex(colorName);
              const isLight = ['#f5f5f0', '#ffffff', '#e3e4e5', '#e8d1cf', '#e3c6a4', '#c0c0c0'].some(
                light => hex.toLowerCase() === light.toLowerCase()
              ) || hex.toLowerCase() > '#cccccc';
              return (
                <button
                  key={idx}
                  onClick={() => handleFilterChange('color', colorName)}
                  className={`flex items-center gap-2.5 w-full text-left px-1 py-0.5 rounded-lg transition-colors ${isSelected ? '' : 'hover:bg-neutral-50'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full shrink-0 transition-all duration-200 ${isLight ? 'border border-neutral-300' : 'border border-transparent'} ${isSelected ? 'ring-2 ring-offset-1 ring-neutral-900 scale-110' : ''}`}
                    style={{ backgroundColor: hex }}
                  />
                  <span className={`text-sm ${isSelected ? 'text-neutral-900 font-semibold' : 'text-neutral-600'}`}>
                    {colorName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const minPriceBound = filters?.priceRange?.min !== undefined && filters?.priceRange?.min > 0 ? filters.priceRange.min : 0;
  const maxPriceBound = filters?.priceRange?.max ? filters.priceRange.max : 50000000;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-neutral-100 p-5 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Bộ Lọc</h2>
        <button 
          type="button"
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
                      type="button"
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
                type="button"
                className="flex items-center justify-between w-full text-left"
                onClick={() => toggleSection('price')}
              >
                <span className="text-sm font-bold text-neutral-900">Mức Giá</span>
                {expandedSections['price'] !== false ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              {expandedSections['price'] !== false && (
                <div className="mt-4 px-2">
                   <PriceRangeSlider 
                     min={minPriceBound}
                     max={maxPriceBound}
                     step={500000}
                     value={[
                       Number(searchParams.get('minPrice')) || minPriceBound,
                       Number(searchParams.get('maxPrice')) || maxPriceBound
                     ]}
                     onValueCommit={([min, max]) => {
                       handlePriceChange(min.toString(), max.toString());
                     }}
                     data={Array.from({ length: 60 }, (_, i) => {
                       const normalized = i / 59;
                       return 0.05 + Math.pow(normalized, 1.5) * 0.95;
                     })}
                   />
                </div>
              )}
          </div>

          {/* Dynamic Specs Based on Mode/Category */}
          {isWatchMode ? (
            <>
              <FilterSection title="Kích thước mặt" sectionKey="size" options={filters?.sizes || []} />
              <FilterSection title="Kết nối" sectionKey="connectivity" options={filters?.connectivities || []} />
              <FilterSection title="Chất liệu vỏ" sectionKey="material" options={filters?.materials || []} />
              <ColorFilterSection />
            </>
          ) : (
            <>
              {/* Dynamic Specs Based on Category - with SHORT values */}
              <FilterSection title="Màn Hình" sectionKey="screenSize" options={filters?.screenSize || []} />
              <FilterSection title={isLaptop ? "Dung Lượng / Ổ Cứng" : "Dung Lượng"} sectionKey="storage" options={filters?.storage || []} />
              <FilterSection title="RAM" sectionKey="ram" options={filters?.ram || []} />

              {(isPhone || !currentCategory) && (
                <FilterSection title="Camera" sectionKey="camera" options={filters?.camera || []} />
              )}

              <FilterSection title="Chip / CPU" sectionKey="cpu" options={filters?.cpu || []} />

              {(isLaptop || !currentCategory) && (
                <FilterSection title="Card Đồ Họa (GPU)" sectionKey="gpu" options={filters?.gpu || []} />
              )}

              {/* Color Filter with circles */}
              <ColorFilterSection />
            </>
          )}
        </div>
      )}
    </div>
  );
}
