import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  const selectedImage = images[selectedIndex] ?? images[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section aria-label={'Hình ảnh ' + productName} className="w-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-sm flex items-center justify-center">
        <div className="aspect-square w-full sm:aspect-[1.1/1] relative">
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={selectedImage}
              src={selectedImage}
              alt={productName + ' - góc nhìn ' + (selectedIndex + 1)}
              className="h-full w-full object-contain p-6 sm:p-10"
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.025 }
              }
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.28 }}
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-white hover:text-black transition-colors shadow-sm focus-visible:outline-none"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-white hover:text-black transition-colors shadow-sm focus-visible:outline-none"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Counter Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs font-medium text-white shadow-sm pointer-events-none">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {images.length > 1 ? (
        <div
          className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide"
          aria-label="Chọn ảnh sản phẩm"
        >
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                key={image + index}
                type="button"
                aria-label={'Xem ảnh ' + (index + 1) + ' của ' + productName}
                aria-pressed={isSelected}
                onClick={() => setSelectedIndex(index)}
                className={
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ' +
                  (isSelected
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'border-neutral-200 hover:border-blue-300 opacity-70 hover:opacity-100')
                }
              >
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}