import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, Star, Scale, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import CardFanCarousel from '../ui/CardFanCarousel';

interface ProductGalleryProps {
  productId?: string;
  images: string[];
  productName: string;
}

export function ProductGallery({ productId, images = [], productName }: ProductGalleryProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { items: wishlistItems, toggleItem: toggleWishlist, syncWithBackend } = useWishlistStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  
  const isFavorite = productId ? wishlistItems.includes(productId) : false;

  useEffect(() => {
    if (token) {
      syncWithBackend(token);
    }
  }, [token, syncWithBackend]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  const displayImages = useMemo(() => {
    return images.length > 0 && images.length < 5
      ? Array(5).fill(images).flat().slice(0, Math.max(5, images.length * 2))
      : images;
  }, [images]);

  const selectedImage = displayImages[selectedIndex] ?? displayImages[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleWishlist = async () => {
    if (!productId) return;
    const handled = await toggleWishlist(productId, token || undefined);
    if (!handled) {
      navigate('/login'); // Assuming standard login path, adjust if it's different
    }
  };

  return (
    <section aria-label={'Hình ảnh ' + productName} className="w-full">
      <div className="relative pt-[64px] w-full">

        {/* The Folder Tab */}
        <div className="absolute top-0 right-0 w-[45%] h-[65px] bg-white border border-neutral-200 border-b-0 rounded-t-[1.5rem] z-10 pointer-events-none">

          {/* Concave Corner CSS for seamless connection */}
          <div className="absolute bottom-0 -left-[24px] w-[24px] h-[24px] overflow-hidden pointer-events-none">
            <div className="absolute -top-[24px] -left-[24px] w-[48px] h-[48px] rounded-full border border-neutral-200 shadow-[0_0_0_24px_white] bg-transparent"></div>
          </div>
        </div>

        {/* Action Bar (Top Left) */}
        <div className="absolute top-[20px] left-6 flex flex-wrap items-center justify-start gap-4 text-[13px] font-semibold text-neutral-600 z-20">
          <button
            onClick={handleToggleWishlist}
            className={`flex items-center gap-1.5 transition-colors ${isFavorite ? 'text-red-500' : 'hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            Yêu thích
          </button>
          <div className="w-[1px] h-4 bg-neutral-200"></div>
          <button className="flex items-center gap-1.5 hover:text-[#22c55e] transition-colors">
            <Scale className="w-4 h-4" />
            So sánh
          </button>
          <div className="w-[1px] h-4 bg-neutral-200 hidden sm:block"></div>
          <button onClick={() => scrollToSection('product-specifications-title')} className="hidden sm:flex items-center gap-1.5 hover:text-[#22c55e] transition-colors">
            <Settings className="w-4 h-4" />
            Thông số kỹ thuật
          </button>
        </div>

        {/* Main Box */}
        <div className="border border-neutral-200 bg-white rounded-b-[2rem] rounded-tl-[2rem] rounded-tr-none p-6 sm:p-8 relative z-0">

          {/* Main Image */}
          <div className="relative overflow-hidden flex items-center justify-center pt-2 pb-2">
            <div className="w-full max-w-[400px] sm:max-w-[400px] aspect-square relative mx-auto">
              <AnimatePresence initial={false}>
                <motion.img
                  key={selectedImage}
                  src={selectedImage}
                  alt={productName + ' - góc nhìn ' + (selectedIndex + 1)}
                  className="h-full w-full object-contain absolute inset-0"
                  style={{ willChange: 'transform, opacity' }}
                  fetchpriority="high"
                  decoding="async"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.98 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Fan Carousel Navigation */}
          <div className="w-full relative z-10 pt-4 mt-4 border-t border-neutral-100/50">
            <CardFanCarousel images={displayImages} selectedIndex={selectedIndex} onIndexChange={(index) => setSelectedIndex(index)} />
          </div>
        </div>
      </div>
    </section>
  );
}