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
  categories,
  currentCategory,
  onCategoryChange,
  filters,
  selectedFilters,
  onFilterChange,
  statusFilter,
  onStatusChange,
  stockFilter,
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

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0) || statusFilter !== '' || stockFilter !== '' || currentCategory !== '';

  return (
    <div className="w-64 flex flex-col gap-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar pr-2 shrink-0">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Bộ lọc</h2>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Xoá lọc
          </button>
        )}
      </div>

      {/* DANH MỤC */}
      <div className="border border-white/5 rounded-xl bg-black/20 overflow-hidden">
        <button 
          onClick={() => toggleGroup('categories')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
        >
          Danh mục
          {expandedGroups['categories'] ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['categories'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => onCategoryChange('')}
                  className={cn(
                    "text-left text-sm px-2 py-1.5 rounded-lg transition-colors",
                    currentCategory === '' ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.slug)}
                    className={cn(
                      "text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between",
                      currentCategory === cat.slug ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                    style={{ paddingLeft: `${cat.depth * 12 + 8}px` }}
                  >
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STATUS */}
      <div className="border border-white/5 rounded-xl bg-black/20 overflow-hidden">
        <button 
          onClick={() => toggleGroup('status')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
        >
          Trạng thái
          {expandedGroups['status'] ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['status'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 flex flex-col gap-2">
                {[
                  { id: '', label: 'Tất cả' },
                  { id: 'active', label: 'Đang hoạt động' },
                  { id: 'inactive', label: 'Đã ẩn' }
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => onStatusChange(opt.id)}>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                      statusFilter === opt.id ? "bg-emerald-500 border-emerald-500" : "border-white/20 group-hover:border-white/40"
                    )}>
                      {statusFilter === opt.id && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <span className={cn("text-sm", statusFilter === opt.id ? "text-emerald-400 font-medium" : "text-white/70 group-hover:text-white")}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STOCK */}
      <div className="border border-white/5 rounded-xl bg-black/20 overflow-hidden">
        <button 
          onClick={() => toggleGroup('stock')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
        >
          Tồn kho
          {expandedGroups['stock'] ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        <AnimatePresence initial={false}>
          {expandedGroups['stock'] && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }} 
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 flex flex-col gap-2">
                {[
                  { id: '', label: 'Tất cả' },
                  { id: 'in_stock', label: 'Còn hàng (>10)' },
                  { id: 'low_stock', label: 'Sắp hết (1-10)' },
                  { id: 'out_of_stock', label: 'Hết hàng (0)' }
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => onStockChange(opt.id)}>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                      stockFilter === opt.id ? "bg-emerald-500 border-emerald-500" : "border-white/20 group-hover:border-white/40"
                    )}>
                      {stockFilter === opt.id && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <span className={cn("text-sm", stockFilter === opt.id ? "text-emerald-400 font-medium" : "text-white/70 group-hover:text-white")}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
