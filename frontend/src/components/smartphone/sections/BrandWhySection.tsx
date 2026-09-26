import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { BrandConfig } from '../../../types/smartphone/types/index';

/* ─── Motion presets ─── */
const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

interface BrandWhySectionProps {
  config: BrandConfig;
}

export function BrandWhySection({ config }: BrandWhySectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const headerMotion = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.55, ease: EASE_EDITORIAL } };

  const pillarMotion = (idx: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.5, delay: idx * 0.08, ease: EASE_EDITORIAL },
        };

  return (
    <section
      id={`${config.id}-why-brand`}
      aria-label={config.whyBrandEyebrow}
      className="relative w-full overflow-hidden"
      style={{ background: '#F7F8FA' }}
    >
      {/* Subtle ambient tint */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${config.accent}09 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* Watermark */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none pointer-events-none"
        aria-hidden="true"
        style={{
          fontSize: 'clamp(8rem, 20vw, 18rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 0.85,
          color: 'rgba(0,0,0,0.025)',
          whiteSpace: 'nowrap',
          transform: 'translateX(-50%) translateY(15%)',
        }}
      >
        {config.whyBrandWatermark}
      </div>

      {/* Content container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <motion.header {...headerMotion} className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: config.accent }}
          >
            {config.whyBrandEyebrow}
          </p>

          <h2
            className="font-bold tracking-tight text-neutral-900 mb-5"
            style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.8rem)', lineHeight: 1.1 }}
          >
            {config.whyBrandHeadline}
            <br />
            {config.whyBrandSubheadline}
          </h2>

          <p
            className="text-neutral-500 leading-relaxed mx-auto"
            style={{ fontSize: 'clamp(0.938rem, 1.6vw, 1.125rem)', maxWidth: '660px' }}
          >
            {config.whyBrandDescription}
          </p>
        </motion.header>

        {/* Pillars Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${config.pillars.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {config.pillars.map((pillar, idx) => {
            const Icon = pillar.icon;

            return (
              <motion.div
                key={pillar.num}
                {...pillarMotion(idx)}
                className={`group relative py-8 sm:py-10 lg:py-0 ${
                  idx > 0 ? 'lg:border-l lg:border-neutral-900/[0.07]' : ''
                } ${
                  idx < (config.pillars.length <= 3 ? 1 : 2) ? 'sm:border-b sm:border-neutral-900/[0.07] lg:border-b-0' : ''
                } ${
                  idx % 2 !== 0 ? 'sm:border-l sm:border-neutral-900/[0.07]' : ''
                } ${
                  idx > 0 ? 'border-t border-neutral-900/[0.07] sm:border-t-0' : ''
                }`}
              >
                <div className="lg:px-8 sm:px-6 transition-transform duration-300 ease-out lg:group-hover:-translate-y-[3px]">
                  {/* Number */}
                  <span
                    className="block text-[11px] font-medium tracking-[0.12em] text-neutral-300 mb-5"
                    aria-hidden="true"
                  >
                    {pillar.num}
                  </span>

                  {/* Icon */}
                  <div className="mb-5">
                    <div
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-300"
                      style={{ background: `${pillar.accent}0D` }}
                    >
                      <Icon
                        className="w-5 h-5 transition-transform duration-300 lg:group-hover:scale-110"
                        style={{ color: pillar.accent }}
                        strokeWidth={1.8}
                      />
                    </div>
                  </div>

                  {/* Accent micro-line */}
                  <div
                    className="w-5 h-[2px] rounded-full mb-5 transition-all duration-400 lg:group-hover:w-9"
                    style={{ background: pillar.accent, opacity: 0.5 }}
                    aria-hidden="true"
                  />

                  {/* Title */}
                  <h3
                    className="text-sm font-bold uppercase tracking-[0.08em] text-neutral-800 mb-3 transition-colors duration-300 lg:group-hover:text-neutral-950"
                  >
                    {pillar.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-[0.84rem] leading-[1.65] text-neutral-500"
                    style={{ maxWidth: '260px', whiteSpace: 'pre-line' }}
                  >
                    {pillar.copy}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BrandWhySection;
