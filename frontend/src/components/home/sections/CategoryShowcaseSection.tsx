import { motion, useReducedMotion } from 'motion/react';
import { ExpandingCards } from '@/components/ui/ExpandingCards';
import type { CategoryCardItem } from '@/components/ui/ExpandingCards';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

function AppleLogoVisual() {
  return (
    <div className="flex items-center justify-center">
      <svg
        className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-[0_2px_16px_rgba(255,255,255,0.32)]"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.14.65-2.84 1.46-.62.72-1.16 1.88-1.01 3 .09.01.21.02.32.02.97 0 2.08-.57 2.54-1.38z" />
      </svg>
    </div>
  );
}

function SamsungLogoVisual() {
  return (
    <div className="flex items-center justify-center">
      <img
        src="/images/samsung.png"
        alt="Samsung"
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_2px_14px_rgba(31,99,198,0.45)]"
      />
    </div>
  );
}

function XiaomiLogoVisual() {
  return (
    <div className="flex items-center justify-center">
      <img
        src="/images/xiaomi.png"
        alt="Xiaomi"
        loading="lazy"
        decoding="async"
        draggable={false}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-[11px] object-contain shadow-md shadow-orange-500/30"
      />
    </div>
  );
}

function TabletLogoVisual() {
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-gradient-to-tr from-purple-600/90 to-indigo-500/90 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
      <div className="w-full h-full rounded-[12px] bg-[#160d2b] flex items-center justify-center">
        <svg
          className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-purple-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="4" y="2" width="16" height="20" rx="2.5" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function WatchLogoVisual() {
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-gradient-to-tr from-emerald-600/90 to-teal-500/90 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
      <div className="w-full h-full rounded-[12px] bg-[#0c1f17] flex items-center justify-center">
        <svg
          className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="6" y="4" width="12" height="16" rx="4" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </div>
    </div>
  );
}

const categoriesData: readonly CategoryCardItem[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    eyebrow: 'APPLE',
    description:
      'Ra mắt lần đầu năm 2007, iPhone đã định hình lại cách con người tương tác với điện thoại thông minh. Từ thiết kế, camera đến hiệu năng, mỗi thế hệ đều góp phần định hình trải nghiệm di động cao cấp.',
    ctaText: 'Khám phá iPhone',
    href: '/phone/iphone',
    accent: '#8c7a68',
    glow: 'rgba(140, 122, 104, 0.22)',
    renderLogo: () => <AppleLogoVisual />,
  },
  {
    id: 'samsung',
    title: 'Samsung',
    eyebrow: 'GALAXY',
    description:
      'Từ một tập đoàn công nghệ toàn cầu, Samsung đã trở thành một trong những tên tuổi lớn của thị trường smartphone. Dòng Galaxy nổi bật với tinh thần đổi mới, công nghệ màn hình và hệ sinh thái thiết bị đa dạng.',
    ctaText: 'Khám phá Samsung',
    href: '/phone/samsung',
    accent: '#1f63c6',
    glow: 'rgba(31, 99, 198, 0.22)',
    renderLogo: () => <SamsungLogoVisual />,
  },
  {
    id: 'xiaomi',
    title: 'Xiaomi',
    eyebrow: 'Xiaomi',
    description:
      'Khởi đầu năm 2010, Xiaomi phát triển nhanh với định hướng đưa công nghệ hiện đại đến nhiều người dùng hơn. Thương hiệu nổi bật nhờ tốc độ đổi mới, thiết kế trẻ và hệ sinh thái thiết bị thông minh.',
    ctaText: 'Khám phá Xiaomi',
    href: '/phone/xiaomi',
    accent: '#ff6900',
    glow: 'rgba(255, 105, 0, 0.2)',
    renderLogo: () => <XiaomiLogoVisual />,
  },
  {
    id: 'tablet',
    title: 'Tablet',
    eyebrow: 'CREATIVE',
    description:
      'Tablet được tạo ra để lấp khoảng trống giữa điện thoại và laptop — đủ cơ động để mang theo, nhưng đủ không gian cho sáng tạo, học tập, công việc và giải trí.',
    ctaText: 'Khám phá Tablet',
    href: '/tablet/ipad',
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.2)',
    renderLogo: () => <TabletLogoVisual />,
  },
  {
    id: 'watch',
    title: 'Watch',
    eyebrow: 'HEALTH & FITNESS',
    description:
      'Watch đưa công nghệ đến gần cơ thể hơn, giúp theo dõi sức khỏe, nhịp sống và kết nối nhanh ngay trên cổ tay. Đây là thiết bị đồng hành cá nhân trong hệ sinh thái hiện đại.',
    ctaText: 'Khám phá Watch',
    href: '/watch/exploreWatch',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.2)',
    renderLogo: () => <WatchLogoVisual />,
  },
];

export function CategoryShowcaseSection() {
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <section
      className="category-showcase-section relative bg-white text-neutral-900 py-20 sm:py-24 lg:py-28 xl:py-32 overflow-hidden border-t border-neutral-200/80"
      aria-labelledby="category-showcase-title"
    >
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <motion.div
          className="max-w-[1200px] mb-10 sm:mb-12 lg:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            className="text-[0.7rem] font-semibold tracking-[0.2em] text-neutral-500 uppercase sm:text-xs"
            variants={{
              hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: shouldReduceMotion ? 0.16 : 0.45,
                  ease: PREMIUM_EASE,
                },
              },
            }}
          >
            KHÁM PHÁ
          </motion.p>

          <motion.h2
            id="category-showcase-title"
            className="mt-3 text-[clamp(1.75rem,calc(1.25rem+2vw),3rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-900"
            variants={{
              hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: shouldReduceMotion ? 0.16 : 0.55,
                  delay: shouldReduceMotion ? 0 : 0.08,
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
            hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: shouldReduceMotion ? 0.16 : 0.6,
                delay: shouldReduceMotion ? 0 : 0.15,
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
