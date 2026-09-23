import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { BrandConfig } from '../types';

/* ─── Motion presets ─── */
const EASE_CTA = [0.22, 1, 0.36, 1] as const;

interface BrandFinalCTASectionProps {
  config: BrandConfig;
}

export function BrandFinalCTASection({ config }: BrandFinalCTASectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.6, delay, ease: EASE_CTA },
        };

  const imageReveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30, scale: 0.97 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        viewport: { once: true, margin: '-40px' },
        transition: { duration: 0.8, delay: 0.35, ease: EASE_CTA },
      };

  const scrollToProducts = () => {
    const el = document.getElementById(`${config.id}-all-products`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id={`${config.id}-final-cta`}
      aria-label={config.ctaEyebrow}
      className="relative w-full overflow-hidden"
      style={{ background: '#FFFFFF' }}
    >
      {/* Subtle ambient atmosphere */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${config.accent}17 0%, ${config.accentSoft}0A 40%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Subtle bottom vignette */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(246,247,251,0.85))',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-32 pb-8 sm:pb-12">
        {/* Text Content */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Eyebrow */}
          <motion.p
            {...fadeUp(0)}
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-6"
            style={{ color: `${config.accent}CC` }}
          >
            {config.ctaEyebrow}
          </motion.p>

          {/* Headline */}
          <motion.h2
            {...fadeUp(0.06)}
            className="font-bold text-neutral-950 tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', lineHeight: 1.08 }}
          >
            {config.ctaHeadline}
            <br />
            {config.ctaSubheadline}
          </motion.h2>

          {/* Supporting copy */}
          <motion.p
            {...fadeUp(0.12)}
            className="text-base sm:text-lg leading-relaxed mb-10 mx-auto"
            style={{ color: 'rgba(23,23,23,0.62)', maxWidth: '580px' }}
          >
            {config.ctaDescription}
          </motion.p>

          {/* CTA Actions */}
          <motion.div
            {...fadeUp(0.18)}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-14 sm:mb-16"
          >
            {/* Primary CTA */}
            <button
              type="button"
              onClick={scrollToProducts}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-neutral-900 text-white text-sm font-semibold transition-all duration-300 hover:bg-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_2px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.18)] cursor-pointer w-full sm:w-auto justify-center"
            >
              {config.ctaPrimaryText}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={scrollToProducts}
              className="group inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all duration-300 cursor-pointer w-full sm:w-auto justify-center"
              style={{ color: 'rgba(23,23,23,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(23,23,23,0.9)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(23,23,23,0.6)')}
            >
              {config.ctaSecondaryText}
              <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-[2px]" />
            </button>
          </motion.div>
        </div>

        {/* Product Visual Composition */}
        {config.ctaImages.length > 0 && (
          <motion.div
            {...imageReveal}
            className="relative w-full max-w-4xl mx-auto"
          >
            {/* Ambient glow behind products */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${config.accent}1A 0%, ${config.accentSoft}0D 40%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
              aria-hidden="true"
            />

            {/* Product images composition */}
            <div className="relative flex items-end justify-center gap-3 sm:gap-5 lg:gap-8 px-4 sm:px-8">
              {config.ctaImages.map((img) => (
                <div
                  key={img.alt}
                  className={`relative flex-shrink-0 ${
                    img.position === 'center'
                      ? 'w-[38%] sm:w-[35%] z-10'
                      : 'w-[22%] sm:w-[20%] opacity-70'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-auto object-contain brand-final-cta__product-image"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default BrandFinalCTASection;
