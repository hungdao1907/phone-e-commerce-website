import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Default max height when collapsed
  const collapsedHeight = "max-h-[300px]";

  if (!description) return null;

  return (
    <section className="mt-12 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900 mb-6">Mô tả sản phẩm</h2>
      
      <div className="relative">
        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px]' : collapsedHeight}`}
        >
          <div 
            className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed text-sm sm:text-base [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:pl-5 [&>ol]:pl-5 [&>ul>li]:mb-1 [&>ol>li]:mb-1"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

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
              Xem thêm <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
