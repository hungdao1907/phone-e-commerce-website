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
  canDelete?: boolean;
}

export function AdminProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onManageVariants,
  viewMode = 'grid',
  canDelete = true,
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
        "border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer",
        isSelected ? "bg-emerald-500/5" : ""
      )} onClick={onEdit}>
        <td className="p-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 cursor-pointer"
            checked={isSelected}
            onChange={onSelect}
          />
        </td>
        <td className="p-3 min-w-[250px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/5 p-1.5 shrink-0 flex items-center justify-center">
              <img src={resolveMediaUrl(product.image) || '/placeholder.png'} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white/90 text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">{product.name}</div>
              <div className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{product.brand || 'No Brand'}</div>
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-white/70 whitespace-nowrap">
          {product.category?.name || 'Chưa phân loại'}
        </td>
        <td className="p-3 text-sm font-bold text-emerald-400 whitespace-nowrap">
          {priceRange}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap",
            isOutOfStock ? "bg-red-500/20 text-red-400" : isLowStock ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
          )}>
            {totalStock}
          </span>
        </td>
        <td className="p-3 text-center text-sm text-white/60">
          {product.variants?.length || 0}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
            product.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
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
                {canDelete && (
                  <>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => { setShowDropdown(false); onDelete(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xoá sản phẩm
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    );
  }

  return (
    <div className={cn(
      "group relative flex flex-col bg-transparent border rounded-2xl overflow-hidden transition-all duration-300",
      isSelected ? "border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.15)]" : "border-white/10 hover:border-white/30"
    )}>

      {/* Checkbox Overlay */}
      <div
        onClick={onSelect}
        className={cn(
          "absolute top-3 left-3 z-10 cursor-pointer transition-opacity duration-200 p-1 rounded-md",
          isSelected ? "opacity-100 bg-black/50" : "opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/80"
        )}
      >
        {isSelected ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-white/50" />}
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
              {canDelete && (
                <>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onDelete(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xoá sản phẩm
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image */}
      <div
        className="relative aspect-[4/3] bg-white overflow-hidden flex items-center justify-center p-6 cursor-pointer"
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
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            product.status === 'active' ? "bg-emerald-500/20 text-emerald-600" : "bg-black/10 text-black/50"
          )}>
            {product.status === 'active' ? 'Active' : 'Hidden'}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            isOutOfStock ? "bg-red-500/20 text-red-600" : isLowStock ? "bg-orange-500/20 text-orange-600" : "bg-blue-500/20 text-blue-600"
          )}>
            {isOutOfStock ? 'Hết hàng' : isLowStock ? `Sắp hết (${totalStock})` : `Kho: ${totalStock}`}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={onEdit}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-[#FFF4B7] line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="text-xs text-[#FFF4B7]/70 mb-3 flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> {product.category?.name || 'Chưa phân loại'}
          <span className="w-1 h-1 rounded-full bg-[#FFF4B7]/30 mx-1"></span>
          {product.brand || 'No Brand'}
        </div>

        <div className="mt-auto">
          <div className="text-[11px] font-bold text-emerald-400">
            {priceRange}
          </div>
          <div className="text-[10px] text-[#FFF4B7]/70 mt-1 flex items-center gap-1">
            <Package className="w-3 h-3" /> {product.variants?.length || 0} biến thể
          </div>
        </div>
      </div>

    </div>
  );
}
