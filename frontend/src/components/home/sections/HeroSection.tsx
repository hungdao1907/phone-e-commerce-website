import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import type { MotionValue } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HeroAuroraBackground } from '@/components/ui/HeroAuroraBackground';
import { CategoryStarField } from '@/components/ui/CategoryStarField';
import { SparkleStar } from '@/components/ui/SparkleStar';
import { LiquidText } from '@/components/ui/LiquidText';

export interface HeroProductCard {
  id: string;
  name: string;
  brand: 'Apple' | 'Samsung' | 'Xiaomi';
  category: 'Phone' | 'Tablet' | 'Laptop';
  image: string;
  link?: string;
}

/**
 * 13 Latest Flagship Products from Apple, Samsung, and Xiaomi:
 * Phones, Tablets, and Laptops with pure studio product renders.
 * Stored locally in /images/hero-products/ inside frontend/public.
 */
const HERO_PRODUCTS: HeroProductCard[] = [
  // 0. Col 1 Top: Apple iPhone 16 Pro Max
  {
    id: 'hero-prod-01',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'Phone',
    image: '/images/hero-products/apple-iphone-16-pro.png',
  },
  // 1. Col 1 Bottom: Samsung Galaxy Z Fold6
  {
    id: 'hero-prod-02',
    name: 'Galaxy Z Fold6',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-z-fold6.png',
  },
  // 2. Col 2 Top: Xiaomi 15 Ultra
  {
    id: 'hero-prod-03',
    name: 'Xiaomi 15 Ultra',
    brand: 'Xiaomi',
    category: 'Phone',
    image: '/images/hero-products/xiaomi-15-ultra.png',
  },
  // 3. Col 2 Bottom: Apple iPad Pro M4
  {
    id: 'hero-prod-04',
    name: 'iPad Pro M4',
    brand: 'Apple',
    category: 'Tablet',
    image: '/images/hero-products/apple-ipad-pro.png',
  },
  // 4. Col 3 (Dipped): Samsung Galaxy Book4 Pro 360
  {
    id: 'hero-prod-05',
    name: 'Galaxy Book4 Pro',
    brand: 'Samsung',
    category: 'Laptop',
    image: '/images/hero-products/samsung-galaxy-book.png',
  },
  // 5. Col 4 (Center-Left Top): Xiaomi RedmiBook Pro 16
  {
    id: 'hero-prod-06',
    name: 'RedmiBook Pro 16',
    brand: 'Xiaomi',
    category: 'Laptop',
    image: '/images/hero-products/xiaomi-redmibook.png',
  },
  // 6. Col 5 (Center Top): Apple MacBook Pro M4
  {
    id: 'hero-prod-07',
    name: 'MacBook Pro M4',
    brand: 'Apple',
    category: 'Laptop',
    image: '/images/hero-products/apple-macbook-pro.png',
  },
  // 7. Col 6 (Center-Right Top): Samsung Galaxy Tab S10 Ultra
  {
    id: 'hero-prod-08',
    name: 'Galaxy Tab S10 Ultra',
    brand: 'Samsung',
    category: 'Tablet',
    image: '/images/hero-products/samsung-tab-s10.png',
  },
  // 8. Col 7 (Dipped): Xiaomi 15 Pro
  {
    id: 'hero-prod-09',
    name: 'Xiaomi 15 Pro',
    brand: 'Xiaomi',
    category: 'Phone',
    image: '/images/hero-products/xiaomi-15-pro.png',
  },
  // 9. Col 8 Top: Apple MacBook Air 15
  {
    id: 'hero-prod-10',
    name: 'MacBook Air 15',
    brand: 'Apple',
    category: 'Laptop',
    image: '/images/hero-products/apple-macbook-air.png',
  },
  // 10. Col 8 Bottom: Xiaomi Pad 7 Pro (3D tilted + pointer cursor)
  {
    id: 'hero-prod-11',
    name: 'Xiaomi Pad 7 Pro',
    brand: 'Xiaomi',
    category: 'Tablet',
    image: '/images/hero-products/xiaomi-pad-7.png',
  },
  // 11. Col 9 Top: Samsung Galaxy S25 Ultra
  {
    id: 'hero-prod-12',
    name: 'Galaxy S25 Ultra',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-s25-ultra.png',
  },
  // 12. Col 9 Bottom: Samsung Galaxy Z Flip6
  {
    id: 'hero-prod-13',
    name: 'Galaxy Z Flip6',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-z-flip6.png',
  },
];

const HERO_LIQUID_WORDS = ['Tiên Phong', 'Đỉnh Cao', 'Đột Phá', 'Kiến Tạo'];

const HERO_DESCRIPTION_TEXT =
  'Khám phá những thiết bị được chọn lọc cho công việc, sáng tạo và cuộc sống mỗi ngày.';

interface SlotConfig {
  id: string;
  positionStyle: React.CSSProperties;
  className: string;
  sizeClass: string;
  curveTransform?: string;
  idleY?: [number, number, number];
  duration?: number;
  idleDelay?: number;
  parallaxFactor: number;
  sparkle?: {
    positionClass: string;
    sizeClass?: string;
    delay?: number;
  };
}

/**
 * Exact 9-Column Staggered Canopy Layout from Reference Image:
 * - Col 1 (Far-Left): 2 cards stacked (Top: 15%, Bottom: 48%)
 * - Col 2 (Left): 2 cards stacked (Top: 9%, Bottom: 39%)
 * - Col 3 (Left-Center): 1 card dipped down (Top: 25%)
 * - Col 4 (Center-Left): 1 card (Top: 11%)
 * - Col 5 (Center Apex): 1 card centered (Top: 15%)
 * - Col 6 (Center-Right): 1 card (Top: 10%)
 * - Col 7 (Right-Center): 1 card dipped down (Top: 23%)
 * - Col 8 (Right): 2 cards stacked (Top: 9%, Bottom: 38% with 3D perspective tilt)
 * - Col 9 (Far-Right): 2 cards stacked (Top: 15%, Bottom: 48%)
 */
const REFERENCE_SLOTS: SlotConfig[] = [
  // 0. Col 1 Top (Far Left Top: iPhone 16 Pro)
  {
    id: 'col1-top',
    positionStyle: { left: '1.2%', top: '15%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [-4, 3, -4],
    duration: 5.4,
    idleDelay: 0.1,
    parallaxFactor: 0.5,
    sparkle: {
      positionClass: 'bottom-[22%] -right-[6%]',
      sizeClass: 'w-5 h-5 sm:w-6 sm:h-6',
      delay: 0.2,
    },
  },
  // 1. Col 1 Bottom (Far Left Bottom: Galaxy Z Fold6)
  {
    id: 'col1-bottom',
    positionStyle: { left: '1.2%', top: '48%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [3, -4, 3],
    duration: 5.8,
    idleDelay: 0.3,
    parallaxFactor: 0.6,
    sparkle: {
      positionClass: '-top-2 right-[22%]',
      sizeClass: 'w-4 h-4 sm:w-5 sm:h-5',
      delay: 0.5,
    },
  },
  // 2. Col 2 Top (Left Top: Xiaomi 15 Ultra)
  {
    id: 'col2-top',
    positionStyle: { left: '11%', top: '9%' },
    className: 'hidden lg:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [-4, 4, -4],
    duration: 5.2,
    idleDelay: 0.2,
    parallaxFactor: 0.7,
  },
  // 3. Col 2 Bottom (Left Middle: iPad Pro M4)
  {
    id: 'col2-bottom',
    positionStyle: {},
    className: 'block left-2 top-[10%] sm:left-[11%] sm:top-[39%]',
    sizeClass: 'w-[86px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [4, -4, 4],
    duration: 5.9,
    idleDelay: 0.4,
    parallaxFactor: 0.8,
  },
  // 4. Col 3 (Left-Center - Dipped Lower: Galaxy Book4 Pro)
  {
    id: 'col3-mid',
    positionStyle: { left: '21.5%', top: '25%' },
    className: 'hidden md:block',
    sizeClass: 'w-[98px] sm:w-[122px] lg:w-[140px] xl:w-[152px] 2xl:w-[168px]',
    idleY: [-4, 4, -4],
    duration: 6.3,
    idleDelay: 0.5,
    parallaxFactor: 0.55,
  },
  // 5. Col 4 (Center-Left Top: RedmiBook Pro 16)
  {
    id: 'col4-top',
    positionStyle: { left: '32.5%', top: '11%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[98px] sm:w-[122px] lg:w-[140px] xl:w-[152px] 2xl:w-[168px]',
    idleY: [3, -4, 3],
    duration: 5.1,
    idleDelay: 0.25,
    parallaxFactor: 0.4,
    sparkle: {
      positionClass: '-top-2.5 -right-2',
      sizeClass: 'w-5 h-5 sm:w-6 sm:h-6',
      delay: 0.8,
    },
  },
  // 6. Col 5 (Center Apex: Apple MacBook Pro M4)
  {
    id: 'col5-top',
    positionStyle: { left: '44.2%', top: '15%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[98px] sm:w-[122px] lg:w-[140px] xl:w-[152px] 2xl:w-[168px]',
    idleY: [-3, 4, -3],
    duration: 5.7,
    idleDelay: 0.6,
    parallaxFactor: 0.35,
    sparkle: {
      positionClass: '-top-2.5 -right-2',
      sizeClass: 'w-5 h-5 sm:w-6 sm:h-6',
      delay: 0.35,
    },
  },
  // 7. Col 6 (Center-Right Top: Galaxy Tab S10 Ultra)
  {
    id: 'col6-top',
    positionStyle: { right: '32.5%', top: '10%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[98px] sm:w-[122px] lg:w-[140px] xl:w-[152px] 2xl:w-[168px]',
    idleY: [4, -3, 4],
    duration: 5.3,
    idleDelay: 0.35,
    parallaxFactor: 0.4,
  },
  // 8. Col 7 (Right-Center - Dipped Lower: Xiaomi 15 Pro)
  {
    id: 'col7-mid',
    positionStyle: { right: '21.5%', top: '23%' },
    className: 'hidden md:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [-4, 4, -4],
    duration: 6.1,
    idleDelay: 0.45,
    parallaxFactor: 0.55,
    sparkle: {
      positionClass: '-top-2 -left-2',
      sizeClass: 'w-4 h-4 sm:w-5 sm:h-5',
      delay: 0.6,
    },
  },
  // 9. Col 8 Top (Right Top: Apple MacBook Air 15)
  {
    id: 'col8-top',
    positionStyle: { right: '11%', top: '9%' },
    className: 'hidden lg:block',
    sizeClass: 'w-[98px] sm:w-[122px] lg:w-[140px] xl:w-[152px] 2xl:w-[168px]',
    idleY: [-4, 4, -4],
    duration: 5.5,
    idleDelay: 0.15,
    parallaxFactor: 0.7,
  },
  // 10. Col 8 Bottom (Right Middle: Xiaomi Pad 7 Pro)
  {
    id: 'col8-bottom',
    positionStyle: {},
    className: 'block right-2 top-[10%] sm:right-[11%] sm:top-[38%]',
    sizeClass: 'w-[86px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    curveTransform: 'perspective(900px) rotateY(-13deg) rotateX(4deg)',
    idleY: [3, -4, 3],
    duration: 6.0,
    idleDelay: 0.3,
    parallaxFactor: 0.85,
    sparkle: {
      positionClass: 'top-[30%] -left-3',
      sizeClass: 'w-4 h-4 sm:w-5 sm:h-5',
      delay: 0.9,
    },
  },
  // 11. Col 9 Top (Far Right Top: Samsung Galaxy S25 Ultra)
  {
    id: 'col9-top',
    positionStyle: { right: '1.2%', top: '15%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [4, -4, 4],
    duration: 5.6,
    idleDelay: 0.2,
    parallaxFactor: 0.5,
  },
  // 12. Col 9 Bottom (Far Right Bottom: Samsung Galaxy Z Flip6)
  {
    id: 'col9-bottom',
    positionStyle: { right: '1.2%', top: '48%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[90px] sm:w-[110px] lg:w-[130px] xl:w-[142px] 2xl:w-[160px]',
    idleY: [-4, 3, -4],
    duration: 5.8,
    idleDelay: 0.5,
    parallaxFactor: 0.6,
    sparkle: {
      positionClass: '-top-2 -right-2',
      sizeClass: 'w-4 h-4 sm:w-5 sm:h-5',
      delay: 0.25,
    },
  },
];



interface FloatingCardProps {
  product: HeroProductCard;
  slot: SlotConfig;
  index: number;
  reducedMotion: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  isReady?: boolean;
}

function FloatingCard({
  product,
  slot,
  index,
  reducedMotion,
  pointerX,
  pointerY,
  isReady = true,
}: FloatingCardProps) {
  const parallaxX = useTransform(
    pointerX,
    [-1, 1],
    [-slot.parallaxFactor * 4, slot.parallaxFactor * 4],
  );
  const parallaxY = useTransform(
    pointerY,
    [-1, 1],
    [-slot.parallaxFactor * 4, slot.parallaxFactor * 4],
  );

  return (
    <motion.div
      className={cn('absolute z-10 select-none [transform-style:preserve-3d]', slot.className)}
      style={{
        ...slot.positionStyle,
        x: reducedMotion ? 0 : parallaxX,
        y: reducedMotion ? 0 : parallaxY,
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -24, scale: 0.94 }}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : isReady
            ? {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.8,
                  delay: 0.08 + (index % 7) * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : { opacity: 0, y: -24, scale: 0.94 }
      }
    >

      {/* Floating & Hover Wrapper with Curved Screen Perspective */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
              y: slot.idleY || [-4, 4, -4],
              transition: {
                duration: slot.duration || 5.5,
                delay: slot.idleDelay || 0,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
        }
        whileHover={
          reducedMotion
            ? {}
            : {
              y: -6,
              scale: 1.03,
              transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
            }
        }
        className={cn('group relative [transform-style:preserve-3d]', slot.sizeClass)}
        style={
          !reducedMotion && slot.curveTransform
            ? {
              transform: slot.curveTransform,
              transformOrigin: 'center center',
            }
            : undefined
        }
      >
        {/* Full-Bleed Product Card (Transparent wrapper with soft realistic studio shadow) */}
        <div className="relative aspect-[4/4.5] w-full bg-transparent border-0 shadow-none">
          <img
            src={product.image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-contain object-center transition-transform duration-300 drop-shadow-[0_14px_28px_rgba(0,0,0,0.12)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          />

          {/* 4-Pointed Sparkle Star Glint (As seen in reference screenshot) */}
          {slot.sparkle && (
            <motion.div
              className={cn(
                'pointer-events-none absolute z-20 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.95)] drop-shadow-[0_0_4px_rgba(255,255,255,0.85)]',
                slot.sparkle.positionClass,
              )}
              animate={
                reducedMotion
                  ? {}
                  : {
                      scale: [0.85, 1.25, 0.85],
                      opacity: [0.75, 1, 0.75],
                      rotate: [0, 15, 0],
                    }
              }
              transition={{
                duration: 3.2,
                delay: slot.sparkle.delay || 0,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <SparkleStar className={cn('h-5 w-5', slot.sparkle.sizeClass)} />
            </motion.div>
          )}
        </div>


      </motion.div>
    </motion.div>
  );
}

export type HeroSectionProps = {
  isCovered?: boolean;
  scrollYProgress?: MotionValue<number>;
  isIntroPlaying?: boolean;
};

export function HeroSection({
  isCovered = false,
  scrollYProgress,
  isIntroPlaying = false,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() === true;
  const isReady = !isIntroPlaying;
  const [helloReplayKey, setHelloReplayKey] = useState(0);

  // Kích hoạt animation nét vẽ khi màn intro bắt đầu chuyển giao và isReady = true
  useEffect(() => {
    if (isReady) {
      setHelloReplayKey((k) => k + 1);
    }
  }, [isReady]);

  // Pointer parallax coordinates
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 65, damping: 24, mass: 0.4 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 65, damping: 24, mass: 0.4 });

  // Scroll fade & drift when transitioning to cinematic section
  const scrollOpacityTransform = useTransform(
    scrollYProgress || pointerX,
    [0, 0.32],
    [1, 0.15],
  );
  const scrollYTransform = useTransform(
    scrollYProgress || pointerX,
    [0, 0.32],
    [0, -28],
  );

  const heroOpacity = scrollYProgress && !reducedMotion ? scrollOpacityTransform : 1;
  const heroTranslateY = scrollYProgress && !reducedMotion ? scrollYTransform : 0;

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (
      reducedMotion
      || isCovered
      || event.pointerType !== 'mouse'
      || window.innerWidth < 768
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
    pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  function handleCtaClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById('home-experience');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section
      ref={heroRef}
      id="home-hero"
      data-home-section="home-hero"
      aria-labelledby="home-hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative z-0 -mt-[44px] flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-white pt-[44px] text-neutral-900"
    >
      {/* 1. Northern Lights (Aurora Borealis) Sky Background across top 75% */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[72%] sm:h-[76%] lg:h-[78%] overflow-hidden select-none">
        <img
          src="/images/aurora-hero-bg.jpg"
          alt="Aurora Sky"
          className="h-full w-full object-cover object-[center_25%] opacity-95 transition-opacity duration-1000"
        />

        {/* 2. Interactive WebGL Three.js Aurora Ribbon Shimmer Overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-screen">
          <HeroAuroraBackground reducedMotion={reducedMotion} />
        </div>

        {/* 3. Cosmic Twinkling Starfield */}
        <div className="absolute inset-0 opacity-75">
          <CategoryStarField />
        </div>

        {/* Subtle Top Space Vignette */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#030712]/35 via-transparent to-transparent" />

        {/* Seamless Soft Dissolve from Aurora Sky into Pure White Mist Floor */}
        <div className="absolute inset-x-0 bottom-0 h-44 sm:h-56 lg:h-64 bg-gradient-to-t from-white via-white/80 via-35% to-transparent" />
      </div>

      {/* 4. White Mist / Glow Floor Covering Lower 48% */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[48%] bg-gradient-to-t from-white via-white/95 via-40% to-transparent"
        aria-hidden="true"
      />


      {/* 13-Card Floating Gallery Canopy — 9-Column Reference Perspective */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[48px] sm:top-[60px] lg:top-[68px] z-10 overflow-hidden [perspective:1400px]">
        <div className="pointer-events-auto relative mx-auto h-full w-full max-w-[1760px] [transform-style:preserve-3d]">
          {HERO_PRODUCTS.map((product, idx) => (
            <FloatingCard
              key={product.id}
              product={product}
              slot={REFERENCE_SLOTS[idx]}
              index={idx}
              reducedMotion={reducedMotion}
              pointerX={smoothPointerX}
              pointerY={smoothPointerY}
              isReady={isReady}
            />
          ))}
        </div>
      </div>

      {/* Central Editorial Content — Positioned in the Lower-Middle Zone Exactly like Reference */}
      <motion.div
        style={{
          opacity: heroOpacity,
          y: heroTranslateY,
        }}
        className="relative z-20 mx-auto flex w-full max-w-[700px] flex-col items-center px-6 pb-12 pt-[42vh] text-center sm:pb-16 sm:pt-[44vh] lg:pb-20 lg:pt-[45vh]"
      >


        {/* Hero Liquid Headline Title in Crisp Dark Typography */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
          animate={
            isReady
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.96, y: 14 }
          }
          transition={{ duration: 0.75, delay: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="my-1 flex flex-col items-center sm:my-2"
        >
          <h1
            id="home-hero-title"
            className="relative flex w-full items-center justify-center font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif] text-center whitespace-nowrap text-neutral-900"
          >
            <LiquidText
              texts={HERO_LIQUID_WORDS}
              isReady={isReady}
              morphTime={1.25}
              cooldownTime={1.4}
              className="text-neutral-900"
            />
          </h1>
        </motion.div>

        {/* Supporting Description in High-End Neutral Typography */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.55, delay: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 max-w-[490px] text-center text-sm sm:text-[15px] leading-relaxed text-neutral-600 font-normal select-none"
        >
          {HERO_DESCRIPTION_TEXT}
        </motion.p>

        {/* Minimal Black CTA Button — Matching Reference Design */}
        <motion.div
          key={`cta-${helloReplayKey}`}
          initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
          animate={isReady ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.55, delay: reducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 sm:mt-7"
        >
          <a
            href="#home-experience"
            onClick={handleCtaClick}
            className="group inline-flex h-[42px] items-center justify-center gap-2 rounded-full bg-black px-6 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 hover:scale-[1.03] hover:bg-neutral-800 hover:shadow-[0_6px_24px_rgba(0,0,0,0.18)] active:scale-[0.98] sm:h-[44px] sm:px-7 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
