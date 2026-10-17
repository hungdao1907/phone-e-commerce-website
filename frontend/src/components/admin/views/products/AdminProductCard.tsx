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
        "border-b border-white/10 hover:bg-white/[0.04] transition-colors group cursor-pointer",
        isSelected ? "bg-emerald-500/10" : ""
      )} onClick={onEdit}>
        <td className="p-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="neon-checkbox"
            checked={isSelected}
            onChange={onSelect}
          />
        </td>
        <td className="p-3 min-w-[250px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl product-thumb-stage p-1 shrink-0 flex items-center justify-center">
              <img src={resolveMediaUrl(product.image) || '/placeholder.png'} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white/90 text-sm line-clamp-1 group-hover:text-[#2ee88a] transition-colors">{product.name}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{product.brand || 'No Brand'}</div>
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-zinc-300 whitespace-nowrap">
          {product.category?.name || 'Chưa phân loại'}
        </td>
        <td className="p-3 text-sm font-bold text-[#2ee88a] whitespace-nowrap">
          {priceRange}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap border",
            isOutOfStock ? "bg-red-500/20 text-red-300 border-red-400/30" : isLowStock ? "bg-amber-500/25 text-amber-200 border-amber-400/40" : "bg-emerald-500/20 text-[#2ee88a] border-emerald-400/30"
          )}>
            {totalStock}
          </span>
        </td>
        <td className="p-3 text-center text-sm text-zinc-400">
          {product.variants?.length || 0}
        </td>
        <td className="p-3 text-center">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border",
            product.status === 'active' ? "bg-emerald-500/20 text-[#2ee88a] border-emerald-400/30" : "bg-white/10 text-white/50 border-white/20"
          )}>
            {product.status === 'active' ? 'Active' : 'Hidden'}
          </span>
        </td>
        <td className="p-3 relative text-right" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-7 h-7 rounded-lg glass-btn-3d inline-flex items-center justify-center text-zinc-300 hover:text-white"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {showDropdown && (
            <div className="absolute top-1/2 right-full mt-0 w-44 bg-[#0a1811] border border-emerald-400/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1.5 z-50 transform -translate-y-1/2 mr-2 text-left backdrop-blur-xl" ref={dropdownRef}>
              <button onClick={() => { setShowDropdown(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
              </button>
              <button onClick={() => { setShowDropdown(false); onManageVariants(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] transition-colors">
                <Layers className="w-3.5 h-3.5" /> Quản lý biến thể
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button onClick={() => { setShowDropdown(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Xoá sản phẩm
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <article
      className={cn(
        "product-card p-3.5 flex flex-col justify-between group cursor-pointer transition-all duration-300",
        isLowStock || isOutOfStock ? "glow-amber" : "glow-emerald",
        isSelected && "border-emerald-400 shadow-[0_0_20px_rgba(46,232,138,0.45)]"
      )}
      onClick={onEdit}
    >
      <div>
        {/* Khung trưng bày ảnh Dark Spotlight */}
        <div className="product-thumb-stage relative">
          {/* Custom Neon Checkbox */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="absolute top-3 left-3 z-10 p-0.5"
          >
            <input
              type="checkbox"
              className="neon-checkbox cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
              checked={isSelected}
              onChange={() => {}}
            />
          </div>

          {/* Action Dropdown Menu */}
          <div className="absolute top-3 right-3 z-10" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {showDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-44 bg-[#0a1811] border border-emerald-400/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1.5 z-20 backdrop-blur-xl">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onManageVariants(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" /> Quản lý biến thể
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xoá sản phẩm
                </button>
              </div>
            )}
          </div>

          {/* Product Image */}
          <img
            src={resolveMediaUrl(product.image) || '/placeholder.png'}
            alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges trạng thái ở đáy khung ảnh */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md",
              product.status === 'active'
                ? "bg-emerald-500/20 text-[#2ee88a] border-emerald-400/30"
                : "bg-white/10 text-white/60 border-white/20"
            )}>
              {product.status === 'active' ? 'Active' : 'Hidden'}
            </span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md",
              isOutOfStock
                ? "bg-red-500/25 text-red-300 border-red-400/40"
                : isLowStock
                ? `bg-amber-500/25 text-amber-200 border-amber-400/40`
                : "bg-emerald-500/20 text-[#2ee88a] border-emerald-400/30"
            )}>
              {isOutOfStock ? 'Hết hàng' : isLowStock ? `Sắp hết (${totalStock})` : `Kho: ${totalStock}`}
            </span>
          </div>
        </div>

        {/* Thông tin sản phẩm */}
        <div className="mt-3.5 px-1">
          <h3 className="text-sm font-semibold text-white group-hover:text-[#2ee88a] transition line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span>🏷️ {product.category?.name || 'Chưa phân loại'}</span>
            <span>•</span>
            <span>{product.brand || 'No Brand'}</span>
          </p>
        </div>
      </div>

      {/* Giá & Biến thể */}
      <div className="mt-4 pt-3 px-1 border-t border-white/10 flex items-end justify-between">
        <div>
          <div className="text-base font-bold text-[#2ee88a]">{priceRange}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
            <span>📦 {product.variants?.length || 0} biến thể</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-8 h-8 rounded-lg glass-btn-3d flex items-center justify-center text-zinc-300 hover:text-white"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
