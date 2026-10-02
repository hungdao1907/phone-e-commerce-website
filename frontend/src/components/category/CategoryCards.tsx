import { scale } from 'framer-motion';
import React from 'react';

export interface CategoryItem {
  id: string;
  label: string;
  image?: string;
  brandQuery?: string;
  path?: string;
}

interface CategoryCardsProps {
  items: CategoryItem[];
  activeId: string | null;
  onSelect: (item: CategoryItem) => void;
}

export function CategoryCards({ items, activeId, onSelect }: CategoryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      {items.map((item) => {
        const isActive = activeId === item.id || activeId === item.brandQuery;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(item)}
            className={`group relative w-full aspect-[3/4] bg-[#F0F0F0] overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 transition-shadow ${isActive ? 'ring-2 ring-inset ring-neutral-400' : 'hover:shadow-sm'
              }`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.label}
                className={`absolute inset-0 w-full h-full object-cover object-right-bottom transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none ${item.id === 'phone' ? 'brightness-[1.043] scale-[1.15]' :
                  item.id === 'watch' ? 'brightness-[1.043] scale-[1.30]' :
                    item.id === 'laptop' ? 'brightness-[1.03] scale-[1.35]' :
                      item.id === 'tablet' ? 'scale-[1.15] -translate-y-2' : ''
                  }`}
                loading="lazy"
              />
            ) : (
              /* Placeholder nếu chưa có ảnh */
              <div className="absolute inset-0 w-full h-full bg-neutral-200/50 flex items-center justify-center text-neutral-400">
                <span className="sr-only">Chưa có ảnh</span>
              </div>
            )}

            {/* Lớp gradient nhẹ từ dưới lên để chữ luôn đọc được trên nền ảnh (tùy chọn nhưng cần thiết cho a11y) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

            <span className="absolute bottom-4 left-4 font-semibold text-neutral-900 z-10 drop-shadow-sm">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
