import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { RippleButton } from './RippleButton';

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
  badge?: string;
  stat?: string;
  statLabel?: string;
}

export interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  autoplayInterval?: number;
  colors?: {
    name?: string;
    designation?: string;
    testimony?: string;
    arrowBackground?: string;
    arrowForeground?: string;
    arrowHoverBackground?: string;
  };
  fontSizes?: {
    name?: string;
    designation?: string;
    quote?: string;
  };
  className?: string;
}

export function CircularTestimonials({
  testimonials,
  autoplay = true,
  autoplayInterval = 5000,
  colors = {},
  fontSizes = {},
  className = '',
}: CircularTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nameColor = colors.name ?? '#ffffff';
  const designationColor = colors.designation ?? '#ffffff';
  const testimonyColor = colors.testimony ?? '#ffffff';
  const arrowBg = colors.arrowBackground ?? 'rgba(255, 255, 255, 0.1)';
  const arrowFg = colors.arrowForeground ?? '#ffffff';
  const arrowHoverBg = colors.arrowHoverBackground ?? 'rgba(255, 255, 255, 0.25)';

  const count = testimonials.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

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

  const activeItem = testimonials[activeIndex];

  // Helper to calculate 3D card layout
  const getCardStyle = (index: number) => {
    const offset = (index - activeIndex + count) % count;

    if (offset === 0) {
      // Active center card
      return {
        x: '0%',
        y: '0%',
        scale: 1,
        rotateY: 0,
        zIndex: 20,
        opacity: 1,
        pointerEvents: 'auto' as const,
      };
    } else if (offset === 1) {
      // Card directly to the right (refined offset for comfortable breathing room)
      return {
        x: '16%',
        y: '-6%',
        scale: 0.86,
        rotateY: -16,
        zIndex: 15,
        opacity: 0.85,
        pointerEvents: 'auto' as const,
      };
    } else if (offset === count - 1) {
      // Card directly to the left
      return {
        x: '-16%',
        y: '-6%',
        scale: 0.86,
        rotateY: 16,
        zIndex: 14,
        opacity: 0.85,
        pointerEvents: 'auto' as const,
      };
    } else if (offset === 2) {
      // Deeper right card
      return {
        x: '28%',
        y: '-12%',
        scale: 0.74,
        rotateY: -26,
        zIndex: 10,
        opacity: 0.4,
        pointerEvents: 'auto' as const,
      };
    } else if (offset === count - 2) {
      // Deeper left card
      return {
        x: '-28%',
        y: '-12%',
        scale: 0.74,
        rotateY: 26,
        zIndex: 9,
        opacity: 0.4,
        pointerEvents: 'auto' as const,
      };
    } else {
      // Hidden cards in background
      return {
        x: '0%',
        y: '-18%',
        scale: 0.6,
        rotateY: 0,
        zIndex: 1,
        opacity: 0,
        pointerEvents: 'none' as const,
      };
    }
  };

  const words = activeItem.quote.split(' ');

  return (
    <div
      className={`w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-center">
        {/* =========================================================================
            LEFT COLUMN: 3D CYLINDRICAL STACKED CARDS
            ========================================================================= */}
        <div className="lg:col-span-5 flex items-center justify-center relative w-full">
          {/* Ambient Glow behind the deck */}
          <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-tr from-sky-500/20 via-purple-500/15 to-transparent blur-3xl -z-10 pointer-events-none" />

          {/* Perspective Container */}
          <div
            className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[4/3] sm:aspect-square"
            style={{ perspective: '1200px' }}
          >
            {testimonials.map((item, idx) => {
              const cardStyle = getCardStyle(idx);
              const isActive = idx === activeIndex;

              return (
                <motion.div
                  key={item.src + idx}
                  className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/15 bg-neutral-900 select-none group transform-gpu will-change-transform"
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  initial={false}
                  animate={cardStyle}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => setActiveIndex(idx)}
                >
                  {/* Card Image */}
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-cover object-center select-none transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Glass highlight border when active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-white/40 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.2),0_0_25px_rgba(255,255,255,0.15)]" />
                  )}

                  {/* Active Card Badge Overlay */}
                  {item.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-black/85 text-white border border-white/25 se3-glow-white-eyebrow shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Card Stat Pill (bottom right) */}
                  {item.stat && (
                    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/90 border border-white/25 text-xs font-semibold text-white shadow-md">
                      <span className="text-white font-bold se3-glow-white-stat">{item.stat}</span>
                      {item.statLabel && (
                        <span className="text-white text-[11px] se3-glow-white-subtle">{item.statLabel}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: NARRATIVE & METRICS & CIRCULAR NAVIGATION
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between text-left lg:pl-8 xl:pl-14 h-full">
          {/* STABLE FIXED-HEIGHT CONTENT WRAPPER:
              Using CSS Grid stack (col-start-1 row-start-1) so container height is
              always locked to the maximum slide height and never shrinks or expands
              when switching slides! */}
          <div className="grid grid-cols-1 grid-rows-1 w-full items-start min-h-[380px] sm:min-h-[350px] lg:min-h-[340px]">
            {testimonials.map((item, idx) => {
              const isActive = idx === activeIndex;

              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    y: isActive ? 0 : 8,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    pointerEvents: isActive ? 'auto' : 'none',
                    display: isActive ? 'flex' : 'none',
                  }}
                  className="col-start-1 row-start-1 w-full flex flex-col items-start transform-gpu will-change-transform"
                >
                  {/* Feature Badge / Eyebrow */}
                  {item.badge && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-white mb-4 shadow-[0_0_16px_rgba(255,255,255,0.15)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />
                      <span className="se3-glow-white-eyebrow">{item.badge}</span>
                    </div>
                  )}

                  {/* Title / Name */}
                  <h3
                    className="se3-heading text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white se3-glow-white-heading"
                    style={{
                      color: nameColor,
                      fontSize: fontSizes.name,
                    }}
                  >
                    {item.name}
                  </h3>

                  {/* Subtitle / Designation */}
                  <p
                    className="se3-body text-sm sm:text-base font-semibold text-white mb-5 tracking-tight se3-glow-white-subtle"
                    style={{
                      color: designationColor,
                      fontSize: fontSizes.designation,
                    }}
                  >
                    {item.designation}
                  </p>

                  {/* Quote / Narrative Description */}
                  <p
                    className="se3-body text-sm sm:text-base leading-relaxed text-white mb-6 font-normal max-w-xl se3-glow-white-body"
                    style={{
                      color: testimonyColor,
                      fontSize: fontSizes.quote,
                    }}
                  >
                    {item.quote}
                  </p>

                  {/* Highlight Stat Metric Card */}
                  {item.stat && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      <div className="se3-heading text-2xl font-black text-white se3-glow-white-stat se3-tabular">
                        {item.stat}
                      </div>
                      {item.statLabel && (
                        <div className="text-xs font-medium text-white border-l border-white/20 pl-3 se3-glow-white-subtle">
                          {item.statLabel}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Controls: Circular Arrow Buttons + Indicators */}
          <div className="flex items-center justify-between w-full pt-4 border-t border-white/10 mt-4">
            {/* Dots Indicator */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveIndex(dotIdx)}
                  aria-label={`Slide ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIdx === activeIndex
                      ? 'w-7 bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Circular Arrows with Directional Liquid Ripple Effect (21st.dev) */}
            <div className="flex items-center gap-3">
              <RippleButton
                onClick={handlePrev}
                aria-label="Previous testimonial"
                hoverRippleColor="#ffffff"
                duration={0.55}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md border border-white/25 shadow-lg active:scale-90 transition-all duration-300 hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </RippleButton>

              <RippleButton
                onClick={handleNext}
                aria-label="Next testimonial"
                hoverRippleColor="#ffffff"
                duration={0.55}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-md border border-white/25 shadow-lg active:scale-90 transition-all duration-300 hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </RippleButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CircularTestimonials;
