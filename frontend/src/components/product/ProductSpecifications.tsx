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
  
  // Extract specImage if present
  const specImageObj = specifications.find((s: any) => s.type === 'specImage');
  const resolveImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
    return url;
  };
  const specImage = specImageObj ? resolveImageUrl((specImageObj as any).url) : null;
  const groups = specifications.filter((s: any) => s.type !== 'specImage');

  // Flatten items count to determine if we should show expand button
  const totalItemsCount = groups.reduce((acc, group) => acc + (group.items?.length || 0), 0);

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

      <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px]' : 'max-h-[400px] overflow-hidden'}`}>
        
        {specImage && (
          <div className="hidden md:block absolute right-[50%] mr-8 top-0 h-full pointer-events-none">
            <div className="sticky top-24 pointer-events-auto flex justify-end">
              <img src={specImage} alt="Specifications" className="w-[180px] lg:w-[220px] h-auto max-h-[50vh] object-contain mix-blend-multiply" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 relative z-10">
          {groups.map((group, groupIndex) => {
            // Hide the group if there's no valid title (e.g. backward compatibility edge case where we don't want a generic title)
            // But we still want to show the items. We can conditionally render the title.
            const hideTitle = group.title === 'Thông số kỹ thuật' || !group.title;
            
            return (
              <div key={groupIndex} className="flex flex-col md:flex-row gap-4 md:gap-8 items-start border-b border-white pb-6 last:border-0 last:pb-0">
                {!hideTitle && (
                  <h3 className="font-semibold text-neutral-900 text-base md:w-1/2 md:shrink-0 text-left md:text-right pr-4">{group.title}</h3>
                )}
                <div className={`flex flex-col gap-3 ${hideTitle ? 'w-full' : 'w-full md:w-1/2'}`}>
                  {group.items?.map((item, itemIndex) => {
                    // Ignore items that just say "Thông tin" as a fallback label
                    if (item.label === 'Thông tin' && item.value === 'N/A') return null;
                    return (
                      <div key={itemIndex} className="text-sm flex flex-wrap gap-1">
                        <span className="text-neutral-500 font-medium">{item.label}{item.label.endsWith(':') ? '' : ':'}</span>
                        <span className="font-medium text-neutral-900 whitespace-pre-line">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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