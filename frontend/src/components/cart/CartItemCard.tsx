import React, { useState, useEffect } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore, CartItem } from '../../store/useCartStore';

interface CartItemCardProps {
  item: CartItem;
}

const variantsCache: Record<string, any[]> = {};

export function CartItemCard({ item }: CartItemCardProps) {
  const { removeItem, updateQuantity, updateItemVariant } = useCartStore();
  const [variants, setVariants] = useState<any[]>(variantsCache[item.productId] || []);
  const [isLoadingVariants, setIsLoadingVariants] = useState(!variantsCache[item.productId]);
  
  // Available capacities for the EXACT same color currently selected
  const availableCapacities = variants.filter(v => 
    v.attributes?.['Màu sắc'] === item.colorName &&
    v.attributes?.['Dung lượng']
  );

  useEffect(() => {
    if (variantsCache[item.productId]) return;

    let isMounted = true;
    const fetchVariants = async () => {
      setIsLoadingVariants(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${item.productId}`);
        if (res.ok) {
          const product = await res.json();
          if (product.variants) {
            variantsCache[item.productId] = product.variants;
            if (isMounted) {
              setVariants(product.variants);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch product variants', err);
      } finally {
        if (isMounted) setIsLoadingVariants(false);
      }
    };
    fetchVariants();
    return () => { isMounted = false; };
  }, [item.productId]);

  const handleCapacityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStorage = e.target.value;
    if (newStorage === item.storageLabel) return; // No change

    const newVariant = availableCapacities.find(v => v.attributes['Dung lượng'] === newStorage);
    if (!newVariant) return;

    // Create the updated cart item
    const newItem: CartItem = {
      ...item,
      id: `${item.productId}:${newVariant.id}`,
      variantId: newVariant.id,
      sku: newVariant.sku,
      storageLabel: newStorage,
      price: newVariant.price,
      stock: newVariant.stock,
      // If we had originalPrice on variant, we'd update it here, but typically base price handles it
    };

    updateItemVariant(item.id, newItem);
  };

  return (
    <div className="py-5 flex gap-4">
      <div className="w-20 h-20 bg-[#f5f7fb] rounded-xl p-2 shrink-0 border border-neutral-100 flex items-center justify-center overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">{item.brand}</p>
            <h3 className="text-sm font-bold text-neutral-900 leading-tight pr-2">{item.name}</h3>
            
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                {item.colorName}
              </span>
              
              {/* Capacity Selector */}
              {isLoadingVariants ? (
                <span className="text-neutral-400 animate-pulse">{item.storageLabel}</span>
              ) : availableCapacities.length > 1 ? (
                <div className="relative">
                  <select 
                    value={item.storageLabel} 
                    onChange={handleCapacityChange}
                    className="appearance-none bg-neutral-100 border border-transparent hover:border-neutral-300 text-neutral-700 font-medium py-0.5 pl-2 pr-6 rounded-md text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    {availableCapacities.map((v, i) => (
                      <option key={i} value={v.attributes['Dung lượng']}>
                        {v.attributes['Dung lượng']}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                    <svg className="h-3 w-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <span className="text-neutral-500">{item.storageLabel}</span>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors -mr-1.5"
            aria-label="Xoá sản phẩm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-end justify-between mt-3">
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <button 
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= 5}
              className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-neutral-900">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
            {item.originalPrice && item.originalPrice > item.price && (
              <p className="text-[10px] text-neutral-400 line-through">{(item.originalPrice * item.quantity).toLocaleString('vi-VN')}đ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
