import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductSpecificationGroup } from '@/types/product';

interface ProductSpecificationsProps {
  productName: string;
  specifications: ProductSpecificationGroup[];
}

export function ProductSpecifications({
  productName,
  specifications,
}: ProductSpecificationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Flatten items count to determine if we should show expand button
  const totalItemsCount = specifications.reduce((acc, group) => acc + (group.items?.length || 0), 0);

  return (
    <section
      className="mt-4 rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-8 lg:p-10"
      aria-labelledby="product-specifications-title"
      id="product-specifications"
    >
      <div className="mb-8">
        <h2
          id="product-specifications-title"
          className="text-xl font-bold uppercase tracking-tight text-neutral-900"
        >
          Thông số kỹ thuật
        </h2>
      </div>

      <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px]' : 'max-h-[400px]'}`}>
        
        <div className="flex flex-col gap-8">
          {specifications.map((group, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-start border-b border-neutral-100 pb-8 last:border-0 last:pb-0">
              <h3 className="font-semibold text-neutral-900 text-base md:sticky md:top-24">{group.title}</h3>
              <div className="flex flex-col gap-4">
                {group.items?.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-1 sm:gap-4">
                    <span className="text-neutral-500 text-sm">{item.label}:</span>
                    <span className="font-medium text-neutral-900 text-sm whitespace-pre-line">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isExpanded && totalItemsCount > 5 && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {totalItemsCount > 5 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-full border border-blue-500 bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isExpanded ? (
              <>
                Thu gọn <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Xem cấu hình chi tiết <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}