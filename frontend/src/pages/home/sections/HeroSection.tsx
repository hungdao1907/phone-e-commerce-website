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
    image: '/images/hero-products/apple-iphone-16-pro.jpg',
  },
  // 1. Col 1 Bottom: Samsung Galaxy Z Fold6
  {
    id: 'hero-prod-02',
    name: 'Galaxy Z Fold6',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-z-fold6.jpg',
  },
  // 2. Col 2 Top: Xiaomi 15 Ultra
  {
    id: 'hero-prod-03',
    name: 'Xiaomi 15 Ultra',
    brand: 'Xiaomi',
    category: 'Phone',
    image: '/images/hero-products/xiaomi-15-ultra.jpg',
  },
  // 3. Col 2 Bottom: Apple iPad Pro M4
  {
    id: 'hero-prod-04',
    name: 'iPad Pro M4',
    brand: 'Apple',
    category: 'Tablet',
    image: '/images/hero-products/apple-ipad-pro.jpg',
  },
  // 4. Col 3 (Dipped): Samsung Galaxy Book4 Pro 360
  {
    id: 'hero-prod-05',
    name: 'Galaxy Book4 Pro',
    brand: 'Samsung',
    category: 'Laptop',
    image: '/images/hero-products/samsung-galaxy-book.jpg',
  },
  // 5. Col 4 (Center-Left Top): Xiaomi RedmiBook Pro 16
  {
    id: 'hero-prod-06',
    name: 'RedmiBook Pro 16',
    brand: 'Xiaomi',
    category: 'Laptop',
    image: '/images/hero-products/xiaomi-redmibook.jpg',
  },
  // 6. Col 5 (Center Top): Apple MacBook Pro M4
  {
    id: 'hero-prod-07',
    name: 'MacBook Pro M4',
    brand: 'Apple',
    category: 'Laptop',
    image: '/images/hero-products/apple-macbook-pro.jpg',
  },
  // 7. Col 6 (Center-Right Top): Samsung Galaxy Tab S10 Ultra
  {
    id: 'hero-prod-08',
    name: 'Galaxy Tab S10 Ultra',
    brand: 'Samsung',
    category: 'Tablet',
    image: '/images/hero-products/samsung-tab-s10.jpg',
  },
  // 8. Col 7 (Dipped): Xiaomi 15 Pro
  {
    id: 'hero-prod-09',
    name: 'Xiaomi 15 Pro',
    brand: 'Xiaomi',
    category: 'Phone',
    image: '/images/hero-products/xiaomi-15-pro.jpg',
  },
  // 9. Col 8 Top: Apple MacBook Air 15
  {
    id: 'hero-prod-10',
    name: 'MacBook Air 15',
    brand: 'Apple',
    category: 'Laptop',
    image: '/images/hero-products/apple-macbook-air.jpg',
  },
  // 10. Col 8 Bottom: Xiaomi Pad 7 Pro (3D tilted + pointer cursor)
  {
    id: 'hero-prod-11',
    name: 'Xiaomi Pad 7 Pro',
    brand: 'Xiaomi',
    category: 'Tablet',
    image: '/images/hero-products/xiaomi-pad-7.jpg',
  },
  // 11. Col 9 Top: Samsung Galaxy S25 Ultra
  {
    id: 'hero-prod-12',
    name: 'Galaxy S25 Ultra',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-s25-ultra.jpg',
  },
  // 12. Col 9 Bottom: Samsung Galaxy Z Flip6
  {
    id: 'hero-prod-13',
    name: 'Galaxy Z Flip6',
    brand: 'Samsung',
    category: 'Phone',
    image: '/images/hero-products/samsung-z-flip6.jpg',
  },
];

interface SlotConfig {
  id: string;
  positionStyle: React.CSSProperties;
  className: string;
  sizeClass: string;
  hasHangingLine: boolean;
  lineHeight?: string;
  hasDashedGuideBelow?: boolean;
  is3DTilted?: boolean;
  idleY?: [number, number, number];
  duration?: number;
  idleDelay?: number;
  parallaxFactor: number;
}

/**
 * Exact 9-Column Hanging Layout from Reference:
 * - Col 1: Far-left top & bottom
 * - Col 2: Left top & bottom (dashed orange line drops below)
 * - Col 3: Left-center (dipped lower with skyline background)
 * - Col 4: Center-left top
 * - Col 5: Center top (suit & tie)
 * - Col 6: Center-right top
 * - Col 7: Right-center (dipped lower, woman with laptop)
 * - Col 8: Right top & bottom (3D tilted + mouse pointer icon + dashed orange line drops below)
 * - Col 9: Far-right top & bottom
 */
const REFERENCE_SLOTS: SlotConfig[] = [
  // 0. Col 1 Top (Far Left Top)
  {
    id: 'col1-top',
    positionStyle: { left: '1.2%', top: '11%' },
    className: 'hidden 2xl:block',
    sizeClass: 'w-[125px] 2xl:w-[145px]',
    hasHangingLine: true,
    lineHeight: '70px',
    idleY: [-4, 3, -4],
    duration: 5.4,
    idleDelay: 0.1,
    parallaxFactor: 0.5,
  },
  // 1. Col 1 Bottom (Far Left Bottom)
  {
    id: 'col1-bottom',
    positionStyle: { left: '1.2%', top: '38%' },
    className: 'hidden 2xl:block',
    sizeClass: 'w-[125px] 2xl:w-[145px]',
    hasHangingLine: false,
    idleY: [3, -4, 3],
    duration: 5.8,
    idleDelay: 0.3,
    parallaxFactor: 0.6,
  },
  // 2. Col 2 Top (Left Top)
  {
    id: 'col2-top',
    positionStyle: { left: '10.5%', top: '7%' },
    className: 'hidden lg:block',
    sizeClass: 'w-[130px] lg:w-[150px] xl:w-[160px]',
    hasHangingLine: true,
    lineHeight: '50px',
    idleY: [-4, 4, -4],
    duration: 5.2,
    idleDelay: 0.2,
    parallaxFactor: 0.7,
  },
  // 3. Col 2 Bottom (Left Middle - Dashed orange line drops below into white space)
  {
    id: 'col2-bottom',
    positionStyle: {},
    className: 'block left-3 top-[10%] sm:left-[10.5%] sm:top-[34%]',
    sizeClass: 'w-[92px] sm:w-[130px] lg:w-[150px] xl:w-[160px]',
    hasHangingLine: false,
    hasDashedGuideBelow: true,
    idleY: [4, -4, 4],
    duration: 5.9,
    idleDelay: 0.4,
    parallaxFactor: 0.8,
  },
  // 4. Col 3 (Left-Center - Dipped Lower)
  {
    id: 'col3-mid',
    positionStyle: { left: '21.5%', top: '18%' },
    className: 'hidden md:block',
    sizeClass: 'w-[135px] lg:w-[155px] xl:w-[165px]',
    hasHangingLine: true,
    lineHeight: '120px',
    idleY: [-4, 4, -4],
    duration: 6.3,
    idleDelay: 0.5,
    parallaxFactor: 0.55,
  },
  // 5. Col 4 (Center-Left Top)
  {
    id: 'col4-top',
    positionStyle: { left: '33%', top: '5%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[120px] lg:w-[140px] xl:w-[150px]',
    hasHangingLine: true,
    lineHeight: '35px',
    idleY: [3, -4, 3],
    duration: 5.1,
    idleDelay: 0.25,
    parallaxFactor: 0.4,
  },
  // 6. Col 5 (Center Top - Executive Suit & Tie)
  {
    id: 'col5-top',
    positionStyle: { left: '44.8%', top: '8%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[125px] lg:w-[145px] xl:w-[155px]',
    hasHangingLine: true,
    lineHeight: '55px',
    idleY: [-3, 4, -3],
    duration: 5.7,
    idleDelay: 0.6,
    parallaxFactor: 0.35,
  },
  // 7. Col 6 (Center-Right Top)
  {
    id: 'col6-top',
    positionStyle: { right: '33%', top: '5%' },
    className: 'hidden xl:block',
    sizeClass: 'w-[120px] lg:w-[140px] xl:w-[150px]',
    hasHangingLine: true,
    lineHeight: '35px',
    idleY: [4, -3, 4],
    duration: 5.3,
    idleDelay: 0.35,
    parallaxFactor: 0.4,
  },
  // 8. Col 7 (Right-Center - Dipped Lower, Woman with Laptop)
  {
    id: 'col7-mid',
    positionStyle: { right: '21.5%', top: '18%' },
    className: 'hidden md:block',
    sizeClass: 'w-[135px] lg:w-[155px] xl:w-[165px]',
    hasHangingLine: true,
    lineHeight: '120px',
    idleY: [-4, 4, -4],
    duration: 6.1,
    idleDelay: 0.45,
    parallaxFactor: 0.55,
  },
  // 9. Col 8 Top (Right Top)
  {
    id: 'col8-top',
    positionStyle: { right: '10.5%', top: '7%' },
    className: 'hidden lg:block',
    sizeClass: 'w-[130px] lg:w-[150px] xl:w-[160px]',
    hasHangingLine: true,
    lineHeight: '50px',
    idleY: [-4, 4, -4],
    duration: 5.5,
    idleDelay: 0.15,
    parallaxFactor: 0.7,
  },
  // 10. Col 8 Bottom (Right Middle - 3D Tilted Card + Pointer Cursor + Dashed Line!)
  {
    id: 'col8-bottom',
    positionStyle: {},
    className: 'block right-3 top-[10%] sm:right-[10.5%] sm:top-[34%]',
    sizeClass: 'w-[92px] sm:w-[130px] lg:w-[150px] xl:w-[160px]',
    hasHangingLine: false,
    hasDashedGuideBelow: true,
    is3DTilted: true,
    idleY: [3, -4, 3],
    duration: 6.0,
    idleDelay: 0.3,
    parallaxFactor: 0.85,
  },
  // 11. Col 9 Top (Far Right Top)
  {
    id: 'col9-top',
    positionStyle: { right: '1.2%', top: '11%' },
    className: 'hidden 2xl:block',
    sizeClass: 'w-[125px] 2xl:w-[145px]',
    hasHangingLine: true,
    lineHeight: '70px',
    idleY: [4, -4, 4],
    duration: 5.6,
    idleDelay: 0.2,
    parallaxFactor: 0.5,
  },
  // 12. Col 9 Bottom (Far Right Bottom)
  {
    id: 'col9-bottom',
    positionStyle: { right: '1.2%', top: '38%' },
    className: 'hidden 2xl:block',
    sizeClass: 'w-[125px] 2xl:w-[145px]',
    hasHangingLine: false,
    idleY: [-4, 3, -4],
    duration: 5.8,
    idleDelay: 0.5,
    parallaxFactor: 0.6,
  },
];

/**
 * Top ghost rail cards (translucent header slots peeking in from top border as in reference)
 */
const TOP_GHOST_CARDS = [
  { left: '2.5%' },
  { left: '11.5%' },
  { left: '23%' },
  { left: '34.5%' },
  { left: '46%' },
  { left: '57.5%' },
  { left: '69%' },
  { left: '80%' },
  { left: '90%' },
];

/**
 * Faint vertical column guides running across the background (as seen in reference)
 */
const VERTICAL_GUIDE_LINES = [
  '12%',
  '23%',
  '34.5%',
  '46%',
  '57.5%',
  '69%',
  '80%',
];

interface FloatingCardProps {
  product: HeroProductCard;
  slot: SlotConfig;
  index: number;
  reducedMotion: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}

function FloatingCard({
  product,
  slot,
  index,
  reducedMotion,
  pointerX,
  pointerY,
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
      className={cn('absolute z-10 select-none', slot.className)}
      style={{
        ...slot.positionStyle,
        x: reducedMotion ? 0 : parallaxX,
        y: reducedMotion ? 0 : parallaxY,
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -20, scale: 0.96 }}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.7,
              delay: 0.08 + index * 0.04,
              ease: [0.16, 1, 0.3, 1],
            },
          }
      }
    >
      {/* Delicate Hanging Line from Top Viewport Edge */}
      {slot.hasHangingLine && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 w-px -translate-x-1/2"
          style={{
            height: slot.lineHeight || '50px',
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(17, 17, 17, 0.08) 100%)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Dashed Accent Vertical Guide Line Below (Amber/orange line from reference) */}
      {slot.hasDashedGuideBelow && (
        <div
          className="pointer-events-none absolute left-1/2 top-full hidden h-28 w-px -translate-x-1/2 border-l border-dashed border-amber-500/50 lg:block xl:h-36"
          aria-hidden="true"
        />
      )}

      {/* Floating & Hover Wrapper */}
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
              scale: 1.025,
              transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
            }
        }
        className={cn('group relative', slot.sizeClass)}
        style={
          slot.is3DTilted && !reducedMotion
            ? {
              transform: 'perspective(900px) rotateY(-11deg) rotateX(3deg)',
              transformOrigin: 'center center',
            }
            : undefined
        }
      >
        {/* Full-Bleed Product Card (Pure image, no text/labels) */}
        <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-[20px] bg-neutral-200 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition-all duration-300 group-hover:shadow-[0_22px_44px_-8px_rgba(0,0,0,0.18),0_6px_16px_rgba(0,0,0,0.06)] sm:rounded-[24px]">
          <img
            src={product.image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        {/* Decorative Mouse Pointer Cursor on 3D Card (Exact detail from reference image!) */}
        {slot.is3DTilted && (
          <div
            className="pointer-events-none absolute -right-2 top-1/2 z-30 -translate-y-1/2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="black"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export type HeroSectionProps = {
  isCovered?: boolean;
  scrollYProgress?: MotionValue<number>;
};

export function HeroSection({ isCovered = false, scrollYProgress }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() === true;

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
      aria-labelledby="home-hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative z-0 -mt-[44px] flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#FAFAFA] pt-[44px] text-[#111111]"
    >
      {/* Subtle Background Vertical Guide Lines (Exact detail from reference image) */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block" aria-hidden="true">
        <div className="relative mx-auto h-full w-full max-w-[1760px]">
          {VERTICAL_GUIDE_LINES.map((leftPos, idx) => (
            <div
              key={`guide-${idx}`}
              className="absolute inset-y-0 w-px border-r border-neutral-200/40"
              style={{ left: leftPos }}
            />
          ))}
        </div>
      </div>

      {/* Top Ghost Rail Cards (translucent ceiling slots peeking in below the navbar) */}
      <div className="pointer-events-none absolute inset-x-0 top-[48px] sm:top-[56px] lg:top-[62px] z-[5] hidden h-12 overflow-hidden sm:block">
        <div className="relative mx-auto h-full w-full max-w-[1760px]">
          {TOP_GHOST_CARDS.map((ghost, i) => (
            <div
              key={`ghost-${i}`}
              className="absolute -top-5 h-[64px] w-[105px] rounded-[16px] border border-neutral-200/40 bg-white/50 shadow-2xs md:w-[125px] lg:w-[135px]"
              style={{ left: ghost.left }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* 13-Card Floating Gallery Canopy — Offset comfortably below navbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[52px] sm:top-[64px] lg:top-[74px] z-10 overflow-hidden">
        <div className="pointer-events-auto relative mx-auto h-full w-full max-w-[1760px]">
          {HERO_PRODUCTS.map((product, idx) => (
            <FloatingCard
              key={product.id}
              product={product}
              slot={REFERENCE_SLOTS[idx]}
              index={idx}
              reducedMotion={reducedMotion}
              pointerX={smoothPointerX}
              pointerY={smoothPointerY}
            />
          ))}
        </div>
      </div>

      {/* Central Editorial Content — Positioned in the Lower-Middle Zone for Perfect Visual Harmony */}
      <motion.div
        style={{
          opacity: heroOpacity,
          y: heroTranslateY,
        }}
        className="relative z-20 mx-auto flex w-full max-w-[700px] flex-col items-center px-6 pb-12 pt-[40vh] text-center sm:pb-16 sm:pt-[40vh] lg:pb-20 lg:pt-[40vh]"
      >
        {/* Eyebrow Pill Badge */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mb-3.5 sm:mb-4"
        >
          <span className="inline-block rounded-full border border-neutral-200/80 bg-[#f4f4f4] px-4 py-1 text-[11px] font-medium tracking-wide text-neutral-600 shadow-2xs sm:text-xs">
            Hệ sinh thái công nghệ
          </span>
        </motion.div>

        {/* Headline — Authentic Apple SF Pro Typography: all black, uppercase, slightly larger */}
        <h1
          id="home-hero-title"
          className="font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif] text-[38px] font-bold uppercase tracking-[-0.01em] leading-[1.03] text-[#111111] sm:text-[50px] md:text-[58px] lg:text-[66px] xl:text-[70px]"
        >
          <motion.span
            className="block text-[#111111]"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            CHẠM VÀO
          </motion.span>
          <motion.span
            className="block text-[#111111] sm:mt-1"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.56, ease: [0.16, 1, 0.3, 1] }}
          >
            THẾ GIỚI MỚI
          </motion.span>
        </h1>

        {/* Supporting Description */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3.5 max-w-[480px] font-['SF_Pro_Text',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif] text-sm font-normal leading-relaxed text-[#86868b] sm:mt-4 sm:text-[15px] lg:text-base"
        >
          Khám phá những thiết bị được chọn lọc cho công việc, sáng tạo và cuộc sống mỗi ngày.
        </motion.p>

        {/* Minimal CTA Button — Black pill design matching reference */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 sm:mt-7"
        >
          <a
            href="#home-experience"
            onClick={handleCtaClick}
            className="group inline-flex h-[42px] items-center justify-center gap-2 rounded-full bg-black px-6 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-800 active:scale-[0.98] sm:h-[44px] sm:px-7 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
