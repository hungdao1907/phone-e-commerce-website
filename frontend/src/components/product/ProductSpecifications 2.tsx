import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductSpecification } from '@/types/product';

interface ProductSpecificationsProps {
  productName: string;
  specifications: ProductSpecification[];
}

export function ProductSpecifications({
  productName,
  specifications,
}: ProductSpecificationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to try grouping specs, but fallback to a single list if not clear
  // We'll just render them in a clean list format first
  
  return (
    <section
      className="mt-4 rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-8 lg:p-10"
      aria-labelledby="product-specifications-title"
    >
      <div className="mb-6">
        <h2
          id="product-specifications-title"
          className="text-xl font-bold uppercase tracking-tight text-neutral-900"
        >
          Thông số kỹ thuật
        </h2>
      </div>

      <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px]' : 'max-h-[400px]'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {specifications.map((specification, index) => (
            <div 
              key={specification.label + index}
              className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-blue-200 transition-colors"
            >
              <div className="w-[120px] shrink-0 font-semibold text-neutral-600 text-sm">
                {specification.label}
              </div>
              <div className="flex-1 font-medium text-neutral-900 text-sm leading-relaxed">
                {specification.value}
              </div>
            </div>
          ))}
        </div>
        
        {!isExpanded && specifications.length > 5 && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {specifications.length > 5 && (
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