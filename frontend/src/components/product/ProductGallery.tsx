import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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

  return (
    <section aria-label={'Hình ảnh ' + productName} className="w-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-[#f5f7fb] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="aspect-square sm:aspect-[1.08/1]">
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
        </div>
      </div>

      {images.length > 1 ? (
        <div
          className="mt-5 flex items-center gap-3"
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
                  'relative h-16 w-16 overflow-hidden rounded-xl border bg-white p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ' +
                  (isSelected
                    ? 'border-[#5aa7ed] shadow-[0_8px_20px_rgba(90,167,237,0.2)]'
                    : 'border-neutral-200 hover:border-neutral-400')
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
          <span className="ml-1 text-sm text-neutral-500">
            {selectedIndex + 1} / {images.length}
          </span>
        </div>
      ) : null}
    </section>
  );
}