import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { PriceRangeSlider, getPriceStep } from './PriceRangeSlider';

interface FilterDropdownsProps {
  categorySlug: string;
  filtersData: any; // data from backend API
}

const FILTER_LABELS: Record<string, string> = {
  brand: 'Thương hiệu',
  price: 'Mức giá',
  storage: 'Dung lượng',
  ram: 'RAM',
  cpu: 'Chip',
  camera: 'Camera',
  screenSize: 'Màn hình',
  os: 'Hệ điều hành',
  gpu: 'Card đồ họa',
  color: 'Màu sắc',
  size: 'Kích thước',
  connectivity: 'Kết nối',
  material: 'Chất liệu'
};

const CATEGORY_FILTERS_MAP: Record<string, string[]> = {
  phone: ['brand', 'price', 'storage', 'ram', 'cpu', 'camera', 'screenSize'],
  tablet: ['brand', 'price', 'storage', 'ram', 'cpu', 'screenSize'],
  laptop: ['brand', 'price', 'storage', 'ram', 'cpu', 'gpu', 'screenSize'],
  watch: ['brand', 'price', 'screenSize', 'size', 'connectivity', 'material'],
  default: ['brand', 'price', 'storage', 'ram']
};

const URL_TO_DATA_KEY: Record<string, string> = {
  brand: 'brands',
  storage: 'storage',
  ram: 'ram',
  cpu: 'cpu',
  camera: 'camera',
  screenSize: 'screenSize',
  os: 'os',
  gpu: 'gpu',
  color: 'colors',
  size: 'sizes',
  connectivity: 'connectivities',
  material: 'materials'
};

export function FilterDropdowns({ categorySlug, filtersData }: FilterDropdownsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Define which filters to show
  const activeFilterKeys = CATEGORY_FILTERS_MAP[categorySlug] || CATEGORY_FILTERS_MAP.default;

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getAppliedFiltersCount = () => {
    let count = 0;
    activeFilterKeys.forEach(key => {
      if (key === 'price') {
        if (searchParams.has('minPrice') || searchParams.has('maxPrice')) count++;
      } else {
        const val = searchParams.get(key);
        if (val) {
          count += val.split(',').length;
        }
      }
    });
    return count;
  };

  const handleClearAll = () => {
    const nextParams = new URLSearchParams(searchParams);
    activeFilterKeys.forEach(key => {
      nextParams.delete(key);
    });
    nextParams.delete('minPrice');
    nextParams.delete('maxPrice');
    nextParams.delete('page');
    setSearchParams(nextParams);
    setOpenDropdown(null);
  };

  const totalApplied = getAppliedFiltersCount();

  return (
    <div className="w-full relative z-30" ref={dropdownRef}>
      <div className="flex items-center gap-3">
        <div className="text-sm font-bold text-neutral-800 shrink-0 flex items-center gap-1.5 bg-neutral-100/80 px-3 py-2 rounded-full">
          Bộ lọc <span className="flex items-center justify-center bg-neutral-800 text-white text-[10px] w-5 h-5 rounded-full">{totalApplied}</span>
        </div>
        
        {/* Horizontal scroll wrapper for mobile */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1">
          {activeFilterKeys.map(filterKey => {
            if (filterKey === 'price') {
              return (
                <PriceFilterDropdown 
                  key={filterKey}
                  isOpen={openDropdown === filterKey}
                  onToggle={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
                  onClose={() => setOpenDropdown(null)}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  priceRange={filtersData?.priceRange}
                />
              );
            }

            const options = filtersData?.[URL_TO_DATA_KEY[filterKey]] || [];
            if (options.length === 0) return null; // Don't show empty filters

            return (
              <MultiSelectFilterDropdown
                key={filterKey}
                filterKey={filterKey}
                label={FILTER_LABELS[filterKey]}
                options={options}
                isOpen={openDropdown === filterKey}
                onToggle={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
                onClose={() => setOpenDropdown(null)}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
              />
            );
          })}
          
          {totalApplied > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 transition-colors"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MultiSelectFilterDropdown
// -------------------------------------------------------------

interface MultiSelectFilterDropdownProps {
  filterKey: string;
  label: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}

function MultiSelectFilterDropdown({
  filterKey, label, options, isOpen, onToggle, onClose, searchParams, setSearchParams
}: MultiSelectFilterDropdownProps) {
  
  // draft state
  const appliedValue = searchParams.get(filterKey);
  const initialDraft = appliedValue ? appliedValue.split(',') : [];
  const [draft, setDraft] = useState<string[]>(initialDraft);

  // Sync draft from URL when opened
  useEffect(() => {
    if (isOpen) {
      const val = searchParams.get(filterKey);
      setDraft(val ? val.split(',') : []);
    }
  }, [isOpen, searchParams, filterKey]);

  const handleToggleOption = (opt: string) => {
    if (draft.includes(opt)) {
      setDraft(draft.filter(x => x !== opt));
    } else {
      setDraft([...draft, opt]);
    }
  };

  const handleApply = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (draft.length > 0) {
      nextParams.set(filterKey, draft.join(','));
    } else {
      nextParams.delete(filterKey);
    }
    // Only "brand" requires special "Tất cả" mapping inside useQuery, but in URL we don't need to put "Tất cả". 
    // In our backend, if it's missing, it searches all.
    nextParams.delete('page');
    setSearchParams(nextParams);
    onClose();
  };

  const handleClear = () => {
    setDraft([]);
  };

  const isActive = initialDraft.length > 0;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
          isActive || isOpen
            ? 'bg-neutral-900 text-white border-neutral-900'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
        }`}
      >
        {label}
        {isActive && <span className="text-[10px] bg-white text-neutral-900 w-4 h-4 rounded-full flex items-center justify-center font-bold">{initialDraft.length}</span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[240px] bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
          <div className="max-h-[300px] overflow-y-auto p-2">
            {options.map((opt) => {
              const isChecked = draft.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-xl cursor-pointer group transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 group-hover:border-neutral-500'}`}>
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={() => handleToggleOption(opt)}
                  />
                  <span className="text-sm text-neutral-700 font-medium">{opt}</span>
                </label>
              );
            })}
          </div>
          <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Xóa
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PriceFilterDropdown
// -------------------------------------------------------------

interface PriceFilterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
  priceRange: { min: number, max: number } | undefined;
}

function PriceFilterDropdown({
  isOpen, onToggle, onClose, searchParams, setSearchParams, priceRange
}: PriceFilterDropdownProps) {
  
  const rawMin = priceRange?.min;
  const rawMax = priceRange?.max;

  const bounds = useMemo(() => {
    if (rawMin === undefined || rawMax === undefined) return null;
    const step = getPriceStep(rawMin, rawMax);
    const lo = Math.floor(rawMin / step) * step;
    const hi = Math.max(Math.ceil(rawMax / step) * step, lo + step);
    return { min: lo, max: hi };
  }, [rawMin, rawMax]);

  const appliedMin = searchParams.get('minPrice');
  const appliedMax = searchParams.get('maxPrice');
  const hasAppliedPrice = appliedMin !== null || appliedMax !== null;

  // draft state
  const [draftValue, setDraftValue] = useState<[number, number] | null>(null);

  // Sync draft from URL when opened
  useEffect(() => {
    if (isOpen && bounds) {
      const lo = appliedMin ? Math.min(Math.max(parseInt(appliedMin, 10), bounds.min), bounds.max) : bounds.min;
      const hi = appliedMax ? Math.max(Math.min(parseInt(appliedMax, 10), bounds.max), bounds.min) : bounds.max;
      setDraftValue([lo, hi]);
    }
  }, [isOpen, searchParams, bounds, appliedMin, appliedMax]);

  if (!bounds) return null;

  const handleApply = () => {
    if (draftValue) {
      const nextParams = new URLSearchParams(searchParams);
      if (draftValue[0] > bounds.min) nextParams.set('minPrice', String(draftValue[0]));
      else nextParams.delete('minPrice');
      
      if (draftValue[1] < bounds.max) nextParams.set('maxPrice', String(draftValue[1]));
      else nextParams.delete('maxPrice');
      
      nextParams.delete('page');
      setSearchParams(nextParams);
    }
    onClose();
  };

  const handleClear = () => {
    setDraftValue([bounds.min, bounds.max]);
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
          hasAppliedPrice || isOpen
            ? 'bg-neutral-900 text-white border-neutral-900'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
        }`}
      >
        Mức giá
        {hasAppliedPrice && <span className="text-[10px] bg-white text-neutral-900 w-2 h-2 rounded-full flex items-center justify-center"></span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && draftValue && (
        <div className="absolute top-full left-0 mt-2 min-w-[320px] md:min-w-[420px] bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
          {/* We reuse the PriceRangeSlider but hide its own clear button since we have one in the footer */}
          <div className="p-4 md:p-5">
            <PriceRangeSlider
              min={bounds.min}
              max={bounds.max}
              value={draftValue}
              onChange={setDraftValue}
              onClear={handleClear}
              hideContainerStyle // a prop we will add to remove outer border/shadow
            />
          </div>
          <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Xóa
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
