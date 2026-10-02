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
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bộ lọc</h2>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Xoá lọc
          </button>
        )}
      </div>

      {/* DANH MỤC */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <button 
          onClick={() => toggleGroup('categories')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Danh mục
          {expandedGroups['categories'] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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
                    currentCategory === '' ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                      currentCategory === cat.slug ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <button 
          onClick={() => toggleGroup('status')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Trạng thái
          {expandedGroups['status'] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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
                      statusFilter === opt.id ? "bg-emerald-600 border-emerald-600" : "border-slate-300 group-hover:border-slate-400 bg-white"
                    )}>
                      {statusFilter === opt.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("text-sm", statusFilter === opt.id ? "text-emerald-700 font-semibold" : "text-slate-600 group-hover:text-slate-900")}>
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
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <button 
          onClick={() => toggleGroup('stock')}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Tồn kho
          {expandedGroups['stock'] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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
                      stockFilter === opt.id ? "bg-emerald-600 border-emerald-600" : "border-slate-300 group-hover:border-slate-400 bg-white"
                    )}>
                      {stockFilter === opt.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("text-sm", stockFilter === opt.id ? "text-emerald-700 font-semibold" : "text-slate-600 group-hover:text-slate-900")}>
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
