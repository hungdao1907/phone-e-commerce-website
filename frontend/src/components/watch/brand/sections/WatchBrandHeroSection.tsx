import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WatchBrandConfig } from '../../../../types/watch/brand/types/index';
import { fetchActiveBanners, resolveBannerImage, type StorefrontBanner } from '@/lib/storefrontBanners';

const DURATION = 5500;
const STEP_MS = 50;

export function WatchBrandHeroSection({ config }: { config: WatchBrandConfig }) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const position = `watch_${config.id}_hero`;
  const bannerCount = banners.length;
  const slideIndex = bannerCount ? ((page % bannerCount) + bannerCount) % bannerCount : 0;
  const currentBanner = banners[slideIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();
    setPage([0, 0]);
    setProgress(0);
    setIsLoading(true);

    fetchActiveBanners(position, controller.signal)
      .then((activeBanners) => setBanners(activeBanners))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setBanners([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [position]);

  const paginate = useCallback((newDirection: number) => {
    if (bannerCount < 2) return;
    setPage(([previousPage]) => [previousPage + newDirection, newDirection]);
    setProgress(0);
  }, [bannerCount]);

  const jumpToSlide = useCallback((targetIndex: number) => {
    if (bannerCount < 2) return;
    setPage(([previousPage]) => {
      const currentNormalized = ((previousPage % bannerCount) + bannerCount) % bannerCount;
      if (targetIndex === currentNormalized) return [previousPage, 0];
      let difference = targetIndex - currentNormalized;
      if (difference === -(bannerCount - 1)) difference = 1;
      if (difference === bannerCount - 1) difference = -1;
      return [previousPage + difference, difference > 0 ? 1 : -1];
    });
    setProgress(0);
  }, [bannerCount]);

  useEffect(() => {
    if (isPaused || isHovered || bannerCount < 2) return undefined;
    const timer = window.setInterval(() => setProgress((value) => value + (STEP_MS / DURATION) * 100), STEP_MS);
    return () => window.clearInterval(timer);
  }, [bannerCount, isHovered, isPaused]);

  useEffect(() => {
    if (progress >= 100) paginate(1);
  }, [paginate, progress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') paginate(-1);
      if (event.key === 'ArrowRight') paginate(1);
      if (event.key === ' ' && bannerCount > 1) {
        event.preventDefault();
        setIsPaused((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bannerCount, paginate]);

  const slideVariants: Variants = {
    enter: (nextDirection: number) => ({ x: nextDirection > 0 ? '100%' : '-100%', opacity: 0, scale: 0.98 }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 32 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.45 },
      },
    },
    exit: (nextDirection: number) => ({
      zIndex: 0,
      x: nextDirection < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
      transition: { x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.35 } },
    }),
  };

  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
  ) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe < -8000 || info.offset.x < -80) paginate(1);
    if (swipe > 8000 || info.offset.x > 80) paginate(-1);
  };

  const handleBannerClick = () => {
    if (!currentBanner?.link) return;
    if (/^https?:\/\//i.test(currentBanner.link)) {
      window.location.assign(currentBanner.link);
      return;
    }
    navigate(currentBanner.link);
  };

  if (isLoading) {
    return (
      <section
        aria-label={`Đang tải ${config.label}`}
        className="flex min-h-[72svh] items-center justify-center bg-black text-white sm:min-h-[78svh] lg:min-h-[82svh]"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
      </section>
    );
  }

  if (!currentBanner || bannerCount === 0) {
    return (
      <section
        aria-label={`${config.label} sắp ra mắt`}
        className="relative flex min-h-[72svh] items-center justify-center overflow-hidden bg-black text-white sm:min-h-[78svh] lg:min-h-[82svh]"
      >
        <div className="text-center px-4">
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-extrabold tracking-[0.15em] sm:text-5xl md:text-7xl"
          >
            COMING SOON
          </motion.h1>
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-xs sm:text-sm tracking-[0.2em] text-white/50 uppercase"
          >
            New experience is on the way
          </motion.p>
        </div>
      </section>
    );
  }

  return (
    <section
      id={`watch-${config.id}-hero`}
      aria-label={`${config.label} Hero Showcase`}
      className="relative flex w-full select-none flex-col items-center justify-start overflow-hidden bg-black pb-0 pt-0 text-white"
    >
      <div
        className="absolute left-1/2 top-1/3 h-[450px] w-full max-w-7xl -translate-x-1/2 -translate-y-1/2 brand-ambient-glow transition-all duration-1000 ease-out sm:h-[700px]"
        style={{ background: `radial-gradient(ellipse at center, ${config.accent} 0%, rgba(0,0,0,0) 70%)` }}
      />

      <div className="hidden">
        {banners.map((banner) => (
          <img key={banner.id} src={resolveBannerImage(banner.image)} alt="" />
        ))}
      </div>

      <div className="relative z-10 w-full overflow-hidden border-b border-white/10 bg-neutral-950">
        <div
          className="group relative min-h-[360px] w-full cursor-grab overflow-hidden active:cursor-grabbing sm:min-h-[480px] sm:aspect-[21/9] md:min-h-[580px] md:aspect-[24/10]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentBanner.id}
              custom={direction}
              variants={slideVariants}
              initial={shouldReduceMotion ? false : 'enter'}
              animate="center"
              exit={shouldReduceMotion ? undefined : 'exit'}
              drag={bannerCount > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={handleBannerClick}
              className={`absolute inset-0 flex h-full w-full items-center justify-center ${currentBanner.link ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <img
                src={resolveBannerImage(currentBanner.image)}
                alt={currentBanner.title}
                className="pointer-events-none h-full w-full select-none object-cover object-center"
                loading="eager"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {bannerCount > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  paginate(-1);
                }}
                aria-label="Banner trước"
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 hover:scale-110 hover:border-white/60 hover:bg-black/90 active:scale-95 sm:left-6 sm:h-14 sm:w-14 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  paginate(1);
                }}
                aria-label="Banner kế tiếp"
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 hover:scale-110 hover:border-white/60 hover:bg-black/90 active:scale-95 sm:right-6 sm:h-14 sm:w-14 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>
              <div className="pointer-events-auto absolute bottom-5 left-1/2 z-20 flex w-64 max-w-[85vw] -translate-x-1/2 gap-3 sm:bottom-7 sm:w-80 md:w-96">
                {banners.map((banner, index) => {
                  const percentage = index < slideIndex ? 100 : index === slideIndex ? progress : 0;
                  return (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        jumpToSlide(index);
                      }}
                      aria-label={`Chuyển đến ${banner.title}`}
                      className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/25"
                    >
                      <span className="absolute inset-x-0 -top-3 -bottom-3" />
                      <span
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-100 ease-linear"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.accent,
                          boxShadow: `0 0 10px ${config.accent}`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}