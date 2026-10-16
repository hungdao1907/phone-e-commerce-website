import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  [key: string]: { value: string; count: number }[];
}

interface AdminProductFilterSidebarProps {
  categories: { id: string; name: string; slug: string; depth: number }[];
  currentCategory: string;
  onCategoryChange: (slug: string) => void;
  
  filters: FilterOptions;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupKey: string, value: string) => void;

  statusFilter: string;
  onStatusChange: (status: string) => void;

  stockFilter: string;
  onStockChange: (stock: string) => void;

  isLoading: boolean;
  onClearFilters: () => void;
}

export function AdminProductFilterSidebar({
  categories = [],
  currentCategory = '',
  onCategoryChange,
  filters = {},
  selectedFilters = {},
  onFilterChange,
  statusFilter = '',
  onStatusChange,
  stockFilter = '',
  onStockChange,
  isLoading,
  onClearFilters
}: AdminProductFilterSidebarProps) {
  
  // Trạng thái mở/đóng của các nhóm filter
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'categories': true,
    'status': true,
    'stock': true,
    'brands': true
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getGroupLabel = (key: string) => {
    if (key === 'brands') return 'Thương hiệu';
    if (key.startsWith('spec_')) return key.replace('spec_', 'Thông số: ');
    if (key.startsWith('attr_')) return key.replace('attr_', 'Biến thể: ');
    return key;
  };

  const hasActiveFilters = Object.values(selectedFilters || {}).some(arr => Array.isArray(arr) && arr.length > 0) || statusFilter !== '' || stockFilter !== '' || currentCategory !== '';

  return (
    <div className="w-full flex flex-col gap-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar pr-1 shrink-0">
      <div className="px-1 flex items-center justify-between pb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300/80">Bộ lọc tìm kiếm</span>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-zinc-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Đặt lại
          </button>
        )}
      </div>

      {/* DANH MỤC */}
      <div className="neon-panel p-4 space-y-3">
        <button 
          onClick={() => toggleGroup('categories')}
          className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
        >
          <span>Danh mục</span>
          {expandedGroups['categories'] ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['categories'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="space-y-1 text-sm max-h-64 overflow-y-auto custom-scrollbar pr-1 pt-1">
                <button
                  onClick={() => onCategoryChange('')}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition text-sm text-left",
                    currentCategory === ''
                      ? "bg-emerald-500/15 text-[#2ee88a] font-medium border border-emerald-400/25 shadow-[inset_0_0_12px_rgba(46,232,138,0.15)]"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>Tất cả sản phẩm</span>
                </button>
                {(categories || []).map(cat => (
                  <button
                    key={cat?.id || cat?.slug}
                    onClick={() => onCategoryChange(cat?.slug || '')}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl transition text-sm text-left",
                      currentCategory === cat?.slug
                        ? "bg-emerald-500/15 text-[#2ee88a] font-medium border border-emerald-400/25 shadow-[inset_0_0_12px_rgba(46,232,138,0.15)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    )}
                    style={{ paddingLeft: `${(cat?.depth || 0) * 10 + 14}px` }}
                  >
                    <span className="truncate">{cat?.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STATUS */}
      <div className="neon-panel p-4 space-y-3">
        <button 
          onClick={() => toggleGroup('status')}
          className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
        >
          <span>Trạng thái</span>
          {expandedGroups['status'] ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['status'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-1 text-sm">
                {[
                  { id: '', label: 'Tất cả' },
                  { id: 'active', label: 'Đang hoạt động' },
                  { id: 'inactive', label: 'Đã ẩn' }
                ].map(opt => (
                  <label 
                    key={opt.id} 
                    className="flex items-center justify-between cursor-pointer group py-0.5 select-none" 
                    onClick={(e) => {
                      e.preventDefault();
                      onStatusChange(opt.id);
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={statusFilter === opt.id}
                        onChange={() => {}}
                        className="neon-checkbox cursor-pointer"
                      />
                      <span className={cn(
                        "transition-colors",
                        statusFilter === opt.id ? "text-white font-medium" : "text-zinc-300 group-hover:text-white"
                      )}>
                        {opt.label}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STOCK */}
      <div className="neon-panel p-4 space-y-3">
        <button 
          onClick={() => toggleGroup('stock')}
          className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
        >
          <span>Tồn kho</span>
          {expandedGroups['stock'] ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['stock'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-1 text-sm">
                {[
                  { id: '', label: 'Tất cả' },
                  { id: 'in_stock', label: 'Còn hàng (>10)' },
                  { id: 'low_stock', label: 'Sắp hết (1-10)' },
                  { id: 'out_of_stock', label: 'Hết hàng (0)' }
                ].map(opt => (
                  <label 
                    key={opt.id} 
                    className="flex items-center justify-between cursor-pointer group py-0.5 select-none" 
                    onClick={(e) => {
                      e.preventDefault();
                      onStockChange(opt.id);
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={stockFilter === opt.id}
                        onChange={() => {}}
                        className="neon-checkbox cursor-pointer"
                      />
                      <span className={cn(
                        "transition-colors",
                        stockFilter === opt.id ? "text-white font-medium" : "text-zinc-300 group-hover:text-white"
                      )}>
                        {opt.label}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DYNAMIC FILTERS (Brands, specs, attributes if any) */}
      {filters && Object.entries(filters).map(([groupKey, options]) => {
        if (!Array.isArray(options) || options.length === 0) return null;
        const isExpanded = expandedGroups[groupKey] ?? true;
        return (
          <div key={groupKey} className="neon-panel p-4 space-y-3">
            <button 
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
            >
              <span>{getGroupLabel(groupKey)}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }} 
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1 text-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {options.map(opt => {
                      if (!opt || !opt.value) return null;
                      const isSelected = selectedFilters?.[groupKey]?.includes(opt.value) || false;
                      return (
                        <label 
                          key={opt.value} 
                          className="flex items-center justify-between cursor-pointer group py-0.5 select-none"
                          onClick={(e) => {
                            e.preventDefault();
                            onFilterChange(groupKey, opt.value);
                          }}
                        >
                          <span className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="neon-checkbox cursor-pointer"
                            />
                            <span className={cn(
                              "transition-colors",
                              isSelected ? "text-white font-medium" : "text-zinc-300 group-hover:text-white"
                            )}>
                              {opt.value}
                            </span>
                          </span>
                          {opt.count !== undefined && (
                            <span className="text-xs text-zinc-500">{opt.count}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

    </div>
  );
}
