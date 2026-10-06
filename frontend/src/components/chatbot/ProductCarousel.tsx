import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChatbotProduct } from './types';
import { ProductResultCard } from './ProductResultCard';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProductCarouselProps {
  products: ChatbotProduct[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs (avoid re-renders during active mouse drag)
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);
    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, products]);

  // Handle global mouse up to stop drag even if mouse leaves the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDownRef.current) {
        isDownRef.current = false;
        setIsDragging(false);
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 80);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle primary left click
    if (e.button !== 0 || !scrollRef.current) return;
    isDownRef.current = true;
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !scrollRef.current) return;
    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > 4) {
      hasDraggedRef.current = true;
    }
    // Prevent browser native text / item selection during drag
    e.preventDefault();
    scrollRef.current.scrollLeft = scrollLeftRef.current - deltaX;
  };

  const handleMouseUp = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 80);
    }
  };

  // Prevent opening the product link if the user dragged the mouse to scroll
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleScrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 245;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden mt-1.5 select-none">
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>Gợi ý sản phẩm phù hợp ({products.length}):</span>
        </div>

        {/* Scroll Buttons */}
        {products.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScrollBy('left')}
              disabled={!canScrollLeft}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border",
                canScrollLeft
                  ? "bg-white text-neutral-700 border-neutral-200 shadow-xs hover:bg-neutral-50 hover:text-blue-600 cursor-pointer active:scale-95"
                  : "bg-neutral-100/70 text-neutral-300 border-transparent cursor-not-allowed opacity-50"
              )}
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollBy('right')}
              disabled={!canScrollRight}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border",
                canScrollRight
                  ? "bg-white text-neutral-700 border-neutral-200 shadow-xs hover:bg-neutral-50 hover:text-blue-600 cursor-pointer active:scale-95"
                  : "bg-neutral-100/70 text-neutral-300 border-transparent cursor-not-allowed opacity-50"
              )}
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Drag & Scrollable Card Container */}
      <div
        ref={scrollRef}
        data-lenis-prevent="true"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClickCapture={handleClickCapture}
        className={cn(
          "flex overflow-x-auto pb-2.5 pt-0.5 gap-3 overscroll-contain px-0.5 custom-scrollbar transition-all w-full max-w-full min-w-0",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        )}
        style={{
          scrollSnapType: isDragging ? 'none' : 'x proximity',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {products.map((product) => (
          <div
            key={product.id || Math.random().toString()}
            className="flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ProductResultCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
