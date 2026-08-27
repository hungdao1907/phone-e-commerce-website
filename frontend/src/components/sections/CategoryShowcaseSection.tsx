import { motion, useReducedMotion } from 'motion/react';
import { CategoryStarField } from '../ui/category-star-field';
import { ExpandingCards } from '../ui/expanding-cards';
import type { CategoryCardItem } from '../ui/expanding-cards';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

function TabletVisual({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`relative w-44 sm:w-52 lg:w-56 h-56 sm:h-64 lg:h-72 rounded-[22px] p-2 bg-gradient-to-b from-[#2a2a30] via-[#1b1b22] to-[#121216] border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isActive ? 'scale-100 sm:scale-105 -translate-y-3' : 'scale-90 translate-y-0 opacity-60'
      }`}
    >
      <div className="w-full h-full rounded-[16px] bg-gradient-to-tr from-[#1a0f2e] via-[#2e1065] to-[#4c1d95] p-3 flex flex-col justify-between overflow-hidden relative border border-purple-500/20">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[9px] text-white/60 font-mono">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <span className="w-2.5 h-1.5 rounded-sm border border-white/60 inline-block" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 my-auto items-center text-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-white/90">Ultra Canvas</span>
        </div>
        <div className="w-16 h-1 rounded-full bg-white/40 mx-auto" />
      </div>
    </div>
  );
}

function WatchVisual({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`relative w-40 sm:w-48 lg:w-52 h-40 sm:h-48 lg:h-52 rounded-full p-2 bg-gradient-to-b from-[#2a302d] via-[#1c221e] to-[#121614] border border-emerald-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isActive ? 'scale-100 sm:scale-105 -translate-y-3' : 'scale-90 translate-y-0 opacity-60'
      }`}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#064e3b] via-[#022c22] to-[#041d17] p-3 flex flex-col justify-between items-center text-center overflow-hidden relative border border-emerald-500/20">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full border border-dashed border-emerald-400/25 animate-[spin_60s_linear_infinite]" />
        </div>
        <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase mt-1">
          Activity
        </span>
        <div className="my-auto flex flex-col items-center">
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">10:09</span>
          <span className="text-[10px] text-emerald-300/80 font-medium">72 BPM · 540 kcal</span>
        </div>
        <div className="flex gap-1 items-center mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      </div>
    </div>
  );
}

function IphoneVisual({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isActive ? 'scale-100 -translate-y-2 opacity-100' : 'scale-90 translate-y-0 opacity-85'
      }`}
    >
      {isActive ? (
        <img
          src="/images/iphone.png"
          alt="iPhone"
          loading="eager"
          decoding="async"
          draggable={false}
          className="category-showcase-iphone-wordmark w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-white/95 drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.14.65-2.84 1.46-.62.72-1.16 1.88-1.01 3 .09.01.21.02.32.02.97 0 2.08-.57 2.54-1.38z" />
          </svg>
        </div>
      )}
    </div>
  );
}

const categoriesData: readonly CategoryCardItem[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    eyebrow: 'APPLE',
    description: 'Khám phá thế hệ iPhone mới.',
    ctaText: 'Khám phá iPhone',
    href: '/iphone',
    accent: '#8c7a68',
    glow: 'rgba(140, 122, 104, 0.25)',
    renderVisual: (isActive) => <IphoneVisual isActive={isActive} />,
  },
  {
    id: 'smartphone',
    title: 'Smartphone',
    eyebrow: 'ANDROID',
    description: 'Hiệu năng mạnh mẽ cho mọi khoảnh khắc.',
    ctaText: 'Khám phá',
    imageSrc: '/images/samsung.png',
    accent: '#1f63c6',
    glow: 'rgba(31, 99, 198, 0.25)',
  },
  {
    id: 'xiaomi',
    title: 'Xiaomi',
    eyebrow: 'ECOSYSTEM',
    description: 'Hệ sinh thái thông minh, kết nối liền mạch cho cuộc sống hiện đại.',
    ctaText: 'Khám phá Xiaomi',
    imageSrc: '/images/xiaomi.png',
    imageClassName: 'category-showcase-xiaomi-mark',
    accent: '#ff6900',
    glow: 'rgba(255, 105, 0, 0.2)',
  },
  {
    id: 'tablet',
    title: 'Tablet',
    eyebrow: 'CREATIVE',
    description: 'Linh hoạt giữa giải trí và sáng tạo.',
    ctaText: 'Khám phá',
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.22)',
    renderVisual: (isActive) => <TabletVisual isActive={isActive} />,
  },
  {
    id: 'watch',
    title: 'Watch',
    eyebrow: 'HEALTH & FITNESS',
    description: 'Công nghệ luôn đồng hành cùng bạn.',
    ctaText: 'Khám phá',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.22)',
    renderVisual: (isActive) => <WatchVisual isActive={isActive} />,
  },
];

export function CategoryShowcaseSection() {
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <section
      className="category-showcase-section relative bg-[#060608] text-white py-20 sm:py-24 lg:py-28 xl:py-32 overflow-hidden border-t border-white/[0.06]"
      aria-labelledby="category-showcase-title"
    >
      {/* Animated Ambient Star Field */}
      <CategoryStarField />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <motion.div
          className="max-w-[1200px] mb-10 sm:mb-12 lg:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            className="text-[0.7rem] font-semibold tracking-[0.2em] text-[#86868b] uppercase sm:text-xs"
            variants={{
              hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: shouldReduceMotion ? 0.16 : 0.5,
                  ease: PREMIUM_EASE,
                },
              },
            }}
          >
            KHÁM PHÁ
          </motion.p>

          <motion.h2
            id="category-showcase-title"
            className="mt-3 text-[clamp(1.75rem,calc(1.25rem+2vw),3rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-[#f5f5f7]"
            variants={{
              hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: shouldReduceMotion ? 0.16 : 0.65,
                  delay: shouldReduceMotion ? 0 : 0.1,
                  ease: PREMIUM_EASE,
                },
              },
            }}
          >
            Tìm thiết bị dành cho bạn.
          </motion.h2>
        </motion.div>

        {/* Expanding Cards Interaction */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 36 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: shouldReduceMotion ? 0.16 : 0.7,
                delay: shouldReduceMotion ? 0 : 0.2,
                ease: PREMIUM_EASE,
              },
            },
          }}
        >
          <ExpandingCards items={categoriesData} defaultActiveIndex={0} />
        </motion.div>
      </div>
    </section>
  );
}
