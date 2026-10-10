import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PriceRangeSlider } from '@/components/ui/range-slider';

interface SidebarFilterProps {
  filters: any;
  isLoading: boolean;
  hideCategoryAndBrand?: boolean;
  categorySlug?: string;
  isWatch?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarFilter({ filters, isLoading, hideCategoryAndBrand, categorySlug, isWatch, onCloseMobile }: SidebarFilterProps) {
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Close to bottom (within 10px)
      setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10);
    }
  };

  useEffect(() => {
    handleScroll(); // Initial check
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [filters, expandedSections]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (key === 'color' && newParams.has('colors')) {
      newParams.delete('colors');
    }

    const currentValues = newParams.get(key)?.split(',').filter(Boolean) || [];
    let newValues = [...currentValues];
    
    // For single select items like category
    if (key === 'category') {
       if (currentValues.includes(value)) {
         newParams.delete(key);
       } else {
         newParams.set(key, value);
       }
       // Reset all other filters when category changes
       Array.from(newParams.keys()).forEach(k => {
         if (k !== 'category') newParams.delete(k);
       });
       setSearchParams(newParams);
       return;
    }

    if (newValues.includes(value)) {
      newValues = newValues.filter(v => v !== value);
    } else {
      newValues.push(value);
    }

    if (newValues.length > 0) {
      newParams.set(key, newValues.join(','));
    } else {
      newParams.delete(key);
    }
    
    // Reset page to 1 on filter change
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceChange = (min: string, max: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (min) newParams.set('minPrice', min);
    else newParams.delete('minPrice');
    
    if (max) newParams.set('maxPrice', max);
    else newParams.delete('maxPrice');
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const cat = searchParams.get('category');
    const sort = searchParams.get('sort');
    
    const newParams = new URLSearchParams();
    if (cat) newParams.set('category', cat);
    if (sort) newParams.set('sort', sort);
    
    setSearchParams(newParams); // Apply immediately on clear all
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
          <div className="mt-3 flex flex-wrap gap-2 pr-2">
            {options.map((option, idx) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={idx}
                  onClick={() => handleFilterChange(sectionKey, option)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900'
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
      if (colorCodes[name]) return colorCodes[name];
      const lower = name.toLowerCase();
      for (const [key, hex] of Object.entries(fallbackColorMap)) {
        if (lower.includes(key)) return hex;
      }
      return '#cccccc';
    };

    const BASIC_COLORS = ['đen', 'trắng', 'đỏ', 'vàng', 'hồng', 'tím', 'bạc', 'xám', 'titan', 'xanh dương', 'xanh lá', 'xanh', 'black', 'white', 'red', 'yellow', 'pink', 'purple', 'silver', 'gray', 'grey', 'blue', 'green', 'gold'];
    const isBasic = (name: string) => BASIC_COLORS.includes(name.toLowerCase().trim());

    // Always show selected colors, plus basic colors
    const basicColors = colorOptions.filter(c => isBasic(c) || selectedValues.includes(c));
    // If no basic colors found, just take the first 5
    const initialColors = basicColors.length > 0 ? basicColors : colorOptions.slice(0, 5);
    const hiddenColors = colorOptions.filter(c => !initialColors.includes(c));

    const visibleColors = showAllColors ? colorOptions : initialColors;

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
          <div className="mt-3 space-y-2.5 pr-2">
            {visibleColors.map((colorName, idx) => {
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
            
            {hiddenColors.length > 0 && (
              <button
                onClick={() => setShowAllColors(!showAllColors)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 pt-1 flex items-center gap-1 transition-colors"
              >
                {showAllColors ? 'Thu gọn' : `Xem thêm ${hiddenColors.length} màu khác`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const minPriceBound = filters?.priceRange?.min !== undefined && filters?.priceRange?.min > 0 ? filters.priceRange.min : 0;
  const maxPriceBound = filters?.priceRange?.max ? filters.priceRange.max : 50000000;

  // Determine if there are pending changes


  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-neutral-100 flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-100 shrink-0">
        <h2 className="text-lg font-bold text-neutral-900">Bộ Lọc</h2>
        <button 
          type="button"
          onClick={clearFilters}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Xóa tất cả
        </button>
      </div>

      {/* Scrollable Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        data-lenis-prevent="true"
        className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 relative"
        style={{
          // Apply a mask gradient at the bottom if not scrolled to bottom
          maskImage: !isScrolledToBottom ? 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)' : 'none',
          WebkitMaskImage: !isScrolledToBottom ? 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)' : 'none',
        }}
      >
        {isLoading ? (
          <div className="space-y-4 animate-pulse mt-4">
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


    </div>
  );
}
