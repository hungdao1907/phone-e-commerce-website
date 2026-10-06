import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, Package, Tag, Layers, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/utils/media';

interface AdminProductCardProps {
  product: any;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageVariants: () => void;
  viewMode?: 'grid' | 'list';
}

export function AdminProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onManageVariants,
  viewMode = 'grid'
}: AdminProductCardProps) {

  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalStock = product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 10;

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const priceRange = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) return 'Liên hệ';
    const prices = product.variants.map((v: any) => v.salePrice || v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  }, [product.variants]);

  if (viewMode === 'list') {
    return (
      <tr className={cn(
        "border-b border-slate-100 hover:bg-slate-50/70 transition-colors group cursor-pointer",
        isSelected ? "bg-emerald-50/60" : ""
      )} onClick={onEdit}>
        <td className="p-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            checked={isSelected}
            onChange={onSelect}
          />
        </td>
        <td className="p-3 min-w-[250px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1.5 shrink-0 flex items-center justify-center">
              <img src={resolveMediaUrl(product.image) || '/placeholder.png'} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">{product.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{product.brand || 'No Brand'}</div>
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-slate-600 whitespace-nowrap">
          {product.category?.name || 'Chưa phân loại'}
        </td>
        <td className="p-3 text-sm font-bold text-emerald-700 whitespace-nowrap">
          {priceRange}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border",
            isOutOfStock ? "bg-red-50 text-red-700 border-red-200" : isLowStock ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {totalStock}
          </span>
        </td>
        <td className="p-3 text-center text-sm text-slate-500">
          {product.variants?.length || 0}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border",
            product.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
          )}>
            {product.status === 'active' ? 'Active' : 'Hidden'}
          </span>
        </td>
        <td className="p-3 relative text-right" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              "p-1.5 rounded-xl transition-all",
              showDropdown ? "bg-slate-100 text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-1/2 right-full mt-0 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_16px_40px_-8px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(15,23,42,0.08)] p-1.5 z-50 transform -translate-y-1/2 mr-2 text-left space-y-0.5"
                ref={dropdownRef}
              >
                <button
                  onClick={() => { setShowDropdown(false); onEdit(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Sửa thông tin
                </button>
                <button
                  onClick={() => { setShowDropdown(false); onManageVariants(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Quản lý biến thể
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => { setShowDropdown(false); onDelete(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xoá sản phẩm
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    );
  }

  return (
    <div className={cn(
      "group relative flex flex-col bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
      isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
    )}>

      {/* Checkbox Overlay */}
      <div
        onClick={onSelect}
        className={cn(
          "absolute top-3 left-3 z-10 cursor-pointer transition-opacity duration-200 p-1 rounded-md border",
          isSelected ? "opacity-100 bg-white shadow-sm border-slate-200" : "opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white shadow-sm border-slate-200"
        )}
      >
        {isSelected ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
      </div>

      {/* Action Dropdown */}
      <div className="absolute top-3 right-3 z-10" ref={dropdownRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
          className={cn(
            "p-1.5 bg-white/90 hover:bg-white text-slate-600 border border-slate-200 shadow-sm rounded-xl transition-all focus:opacity-100",
            showDropdown ? "opacity-100 ring-2 ring-emerald-500/20 border-emerald-400" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-1.5 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_16px_40px_-8px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(15,23,42,0.08)] p-1.5 z-20 space-y-0.5"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Sửa thông tin
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onManageVariants(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Quản lý biến thể
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xoá sản phẩm
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image */}
      <div
        className="relative aspect-[4/3] bg-slate-50/60 border-b border-slate-100 overflow-hidden flex items-center justify-center p-6 cursor-pointer"
        onClick={onEdit}
      >
        <img
          src={resolveMediaUrl(product.image) || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            product.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
          )}>
            {product.status === 'active' ? 'Active' : 'Hidden'}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            isOutOfStock ? "bg-red-50 text-red-700 border-red-200" : isLowStock ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {isOutOfStock ? 'Hết hàng' : isLowStock ? `Sắp hết (${totalStock})` : `Kho: ${totalStock}`}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 cursor-pointer bg-white" onClick={onEdit}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-slate-400" /> {product.category?.name || 'Chưa phân loại'}
          <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
          {product.brand || 'No Brand'}
        </div>

        <div className="mt-auto">
          <div className="text-sm font-bold text-emerald-700">
            {priceRange}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-400" /> {product.variants?.length || 0} biến thể
          </div>
        </div>
      </div>

    </div>
  );
}
