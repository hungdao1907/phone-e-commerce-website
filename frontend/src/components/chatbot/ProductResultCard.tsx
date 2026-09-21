import React from 'react';
import { Link } from 'react-router-dom';
import { ChatbotProduct } from './types';
import { resolveBackendUrl } from '../../services/chatbot.api';
import { ShoppingBag, ChevronRight, Sparkles } from 'lucide-react';

interface ProductResultCardProps {
  product: ChatbotProduct;
}

export function ProductResultCard({ product }: ProductResultCardProps) {
  const imageUrl = resolveBackendUrl(product.image_url);
  const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0);
  const formattedOriginalPrice = product.original_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.original_price) : null;
  
  const discountPercent = (product.original_price && product.price && product.original_price > product.price)
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="group relative flex flex-col w-64 flex-shrink-0 bg-white rounded-2xl border border-neutral-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] hover:border-blue-400/60 transition-all duration-300 overflow-hidden text-left"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-neutral-50 to-neutral-100/70 flex items-center justify-center p-3 overflow-hidden">
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-md text-blue-600 shadow-xs border border-blue-100">
            <Sparkles className="w-2.5 h-2.5" />
            VN/A
          </span>
          {discountPercent && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 text-neutral-300 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
        )}
      </div>
      
      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Brand & Name */}
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">
            {product.brand || 'Điện thoại'}
          </div>
          <h4 className="text-[13px] font-semibold text-neutral-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h4>
          
          {/* Price */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-rose-600 tracking-tight">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && product.original_price! > (product.price || 0) && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formattedOriginalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Specs & Action Row */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {product.storage_gb && (
              <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-[10px] font-medium text-neutral-600">
                {product.storage_gb}GB
              </span>
            )}
            {product.color && (
              <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-[10px] font-medium text-neutral-600 truncate max-w-[80px]">
                {product.color}
              </span>
            )}
          </div>

          <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform duration-200">
            Xem ngay
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
