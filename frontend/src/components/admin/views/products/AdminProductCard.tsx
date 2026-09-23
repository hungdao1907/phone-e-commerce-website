import React from 'react';
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
}

export function AdminProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onManageVariants
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

  return (
    <div className={cn(
      "group relative flex flex-col bg-[#1c1c1e] border rounded-2xl overflow-hidden transition-all duration-300",
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
          className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-40 bg-[#2a2a2c] border border-white/10 rounded-xl shadow-xl py-1 z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onManageVariants(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5" /> Quản lý biến thể
            </button>
            <div className="h-px bg-white/10 my-1"></div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div 
        className="relative aspect-[4/3] bg-white/5 overflow-hidden flex items-center justify-center p-6 cursor-pointer"
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
            product.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
          )}>
            {product.status === 'active' ? 'Active' : 'Hidden'}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            isOutOfStock ? "bg-red-500/20 text-red-400" : isLowStock ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
          )}>
            {isOutOfStock ? 'Hết hàng' : isLowStock ? `Sắp hết (${totalStock})` : `Kho: ${totalStock}`}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={onEdit}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
        </div>
        
        <div className="text-xs text-white/40 mb-3 flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> {product.category?.name || 'Chưa phân loại'}
          <span className="w-1 h-1 rounded-full bg-white/20 mx-1"></span>
          {product.brand || 'No Brand'}
        </div>

        <div className="mt-auto">
          <div className="text-sm font-bold text-emerald-400">
            {priceRange}
          </div>
          <div className="text-xs text-white/40 mt-1 flex items-center gap-1">
            <Package className="w-3 h-3" /> {product.variants?.length || 0} biến thể
          </div>
        </div>
      </div>

    </div>
  );
}
