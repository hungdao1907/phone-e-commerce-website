import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BrandConfig } from '@/types/smartphone';

interface BrandHeroSectionProps {
  config: BrandConfig;
}

export function BrandHeroSection({ config }: BrandHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const banners = config.heroBanners;
  const bannerCount = banners.length;
  const slideIndex = ((page % bannerCount) + bannerCount) % bannerCount;
  const currentBanner = banners[slideIndex];

  const DURATION = 5000;
  const STEP_MS = 50;

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
      setProgress(0);
    },
    []
  );

  const jumpToSlide = useCallback(
    (targetIndex: number) => {
      setPage(([prevPage]) => {
        const currentNormalized = ((prevPage % bannerCount) + bannerCount) % bannerCount;
        if (targetIndex === currentNormalized) return [prevPage, 0];
        let diff = targetIndex - currentNormalized;
        if (diff === -(bannerCount - 1)) diff = 1;
        if (diff === bannerCount - 1) diff = -1;
        return [prevPage + diff, diff > 0 ? 1 : -1];
      });
      setProgress(0);
    },
    [bannerCount]
  );

  // Auto-play timer
  useEffect(() => {
    if (isPaused || isHovered) return;
    const timer = setInterval(() => {
      setProgress((prev) => prev + (STEP_MS / DURATION) * 100);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [isPaused, isHovered]);

  // Auto-advance
  useEffect(() => {
    if (progress >= 100) {
      paginate(1);
    }
  }, [progress, paginate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate]);

  // Framer Motion slide variants
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 32 },
        opacity: { duration: 0.45 },
        scale: { duration: 0.45 },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 32 },
        opacity: { duration: 0.35 },
      },
    }),
  };

  // Touch swipe support
  const swipeConfidenceThreshold = 8000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold || offset.x < -80) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold || offset.x > 80) {
      paginate(-1);
    }
  };

  return (
    <section
      id={`${config.id}-hero`}
      aria-label={`${config.brand} Hero Showcase`}
      className="relative w-full bg-black text-white pt-[44px] pb-0 flex flex-col items-center justify-start overflow-hidden select-none"
    >
      {/* Dynamic Ambient Backlight */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[400px] sm:h-[600px] brand-ambient-glow transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(ellipse at center, ${currentBanner.glowColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Preload images */}
      <div className="hidden">
        {banners.map((banner) => (
          <img key={banner.id} src={banner.image} alt={banner.alt} />
        ))}
      </div>

      {/* Full-Bleed Carousel Viewport */}
      <div className="relative z-10 w-full overflow-hidden border-b border-white/10 bg-neutral-950">
        <div
          className="relative w-full aspect-[16/9] max-h-[85vh] overflow-hidden group cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Animated Slide Transition */}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial={shouldReduceMotion ? false : 'enter'}
              animate="center"
              exit={shouldReduceMotion ? undefined : 'exit'}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              <img
                src={currentBanner.image}
                alt={currentBanner.alt}
                className="w-full h-full object-cover object-center select-none pointer-events-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
                loading="eager"
                draggable={false}
              />
              {/* Cinematic Edge Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Previous Arrow */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
            aria-label="Slide trước"
            className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/55 hover:bg-black/90 backdrop-blur-2xl border border-white/25 hover:border-white/60 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_4px_30px_rgba(0,0,0,0.8)] cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); paginate(1); }}
            aria-label="Slide kế tiếp"
            className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/55 hover:bg-black/90 backdrop-blur-2xl border border-white/25 hover:border-white/60 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_4px_30px_rgba(0,0,0,0.8)] cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>

          {/* Progress Bars */}
          <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 w-64 sm:w-80 md:w-96 max-w-[85vw] pointer-events-auto flex gap-3">
            {banners.map((banner, idx) => {
              let fillPercentage = 0;
              if (idx < slideIndex) fillPercentage = 100;
              else if (idx === slideIndex) fillPercentage = progress;

              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); jumpToSlide(idx); }}
                  aria-label={`Chuyển đến ${banner.title}`}
                  className="relative flex-1 h-[4px] rounded-full bg-white/20 cursor-pointer group"
                >
                  <div className="absolute inset-0 -top-4 -bottom-4 bg-transparent" />
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear"
                    style={{
                      width: `${fillPercentage}%`,
                      backgroundColor: currentBanner.accentColor,
                      boxShadow: `0 0 10px ${currentBanner.accentColor}`,
                    }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full bg-white/0 group-hover:bg-white/20 transition-colors pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandHeroSection;
