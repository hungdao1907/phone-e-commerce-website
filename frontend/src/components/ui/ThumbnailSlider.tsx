import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { RippleButton } from './RippleButton';

export interface ThumbnailSlideItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  thumbnail?: string;
  stat?: string;
  statLabel?: string;
  accentColor?: string;
}

export interface ThumbnailSliderProps {
  items: ThumbnailSlideItem[];
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
}

export function ThumbnailSlider({
  items,
  autoplay = true,
  autoplayInterval = 5500,
  className = '',
}: ThumbnailSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const count = items.length;

  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const handleSelect = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // Autoplay management
  useEffect(() => {
    if (!autoplay || isHovered || count <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, autoplayInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoplay, autoplayInterval, isHovered, count, handleNext]);

  // Keep active thumbnail visible inside horizontal strip ONLY (never scroll window/page)
  useEffect(() => {
    const strip = stripRef.current;
    const activeThumb = thumbnailRefs.current[activeIndex];
    if (strip && activeThumb) {
      const thumbLeft = activeThumb.offsetLeft;
      const thumbWidth = activeThumb.offsetWidth;
      const stripWidth = strip.offsetWidth;
      const targetScrollLeft = thumbLeft - stripWidth / 2 + thumbWidth / 2;

      strip.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex];

  // Motion animation variants for the main slide
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '10%' : '-10%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 260, damping: 28 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-10%' : '10%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 260, damping: 28 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <div
      className={`w-full flex flex-col gap-4 sm:gap-6 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Apple Watch SE 3 Health Feature Carousel"
    >
      {/* =========================================================================
          MAIN VIEWPORT: CINEMATIC SLIDE WITH FROSTED GLASS OVERLAY
          ========================================================================= */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[2.2/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 select-none group">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentItem.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image */}
            <img
              src={currentItem.image}
              alt={currentItem.title}
              className="w-full h-full object-cover object-center select-none"
              loading="lazy"
            />

            {/* Apple Multi-Stop Vignette Gradient for Perfect Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Top Category Badge */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white shadow-md">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentItem.accentColor || '#38bdf8' }}
                />
                {currentItem.category}
              </span>
            </div>

            {/* Bottom-Left Narrative & Stat Info Box */}
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-24 z-10 max-w-2xl text-left">
              {/* Feature Title */}
              <h3 className="se3-heading text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 sm:mb-3 leading-snug drop-shadow-md">
                {currentItem.title}
              </h3>

              {/* Description */}
              <p className="se3-body text-xs sm:text-sm md:text-base text-white/95 font-normal leading-relaxed mb-4 line-clamp-3 sm:line-clamp-none max-w-xl drop-shadow-sm">
                {currentItem.description}
              </p>

              {/* Highlight Metric Badge */}
              {currentItem.stat && (
                <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-lg">
                  <span
                    className="se3-heading text-sm sm:text-base font-black se3-tabular tracking-tight"
                    style={{ color: currentItem.accentColor || '#ffffff' }}
                  >
                    {currentItem.stat}
                  </span>
                  {currentItem.statLabel && (
                    <span className="text-[11px] sm:text-xs font-medium text-white/90 border-l border-white/25 pl-2.5">
                      {currentItem.statLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Circular Prev & Next Buttons with Directional Liquid Ripple Effect */}
        <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 z-20">
          <RippleButton
            onClick={handlePrev}
            aria-label="Previous health feature slide"
            hoverRippleColor="#ffffff"
            duration={0.55}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/60 text-white backdrop-blur-md border border-white/25 shadow-xl transition-all duration-300 hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </RippleButton>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 z-20">
          <RippleButton
            onClick={handleNext}
            aria-label="Next health feature slide"
            hoverRippleColor="#ffffff"
            duration={0.55}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/60 text-white backdrop-blur-md border border-white/25 shadow-xl transition-all duration-300 hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-90"
          >
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </RippleButton>
        </div>
      </div>

      {/* =========================================================================
          THUMBNAIL STRIP: SYNCHRONIZED CLICKABLE THUMBNAILS (21ST.DEV PATTERN)
          ========================================================================= */}
      <div className="relative w-full flex justify-center">
        <div
          ref={stripRef}
          className="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto py-2 px-2 scrollbar-none snap-x scroll-smooth max-w-full"
          style={{ justifyContent: 'safe center' }}
        >
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  thumbnailRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => handleSelect(idx)}
                aria-label={`Select ${item.title}`}
                className={`relative flex-shrink-0 aspect-[16/10] w-28 sm:w-36 md:w-44 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 select-none group text-left ${
                  isActive
                    ? 'ring-2 sm:ring-[3px] ring-black shadow-md scale-[1.02] opacity-100'
                    : 'opacity-50 hover:opacity-90 hover:scale-[1.01] grayscale-[15%]'
                }`}
              >
                {/* Thumbnail Image */}
                <img
                  src={item.thumbnail || item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Subtle vignette on thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1 z-10"
                    style={{ backgroundColor: item.accentColor || '#0071e3' }}
                  />
                )}

                {/* Thumbnail Mini Label */}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-white line-clamp-1 drop-shadow-sm tracking-tight">
                    {item.category}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ThumbnailSlider;
