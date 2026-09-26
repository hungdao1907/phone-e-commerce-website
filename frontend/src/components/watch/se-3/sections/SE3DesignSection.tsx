import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CircularTestimonials } from '@/components/ui/CircularTestimonials';
import { SE3_CIRCULAR_DESIGN_ITEMS, SE3_DESIGN_DATA } from '../../../../data/watch/se-3/data/se3Data';

export function SE3DesignSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="se3-design"
      className="relative w-full se3-design-section overflow-hidden scroll-mt-16 bg-[#050507] pt-20 sm:pt-28 md:pt-32 pb-32 sm:pb-40"
    >
      {/* Cinematic Cosmic Light Arc Background from Pinterest with Dim Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/images/watch/se3-design-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center select-none"
          loading="eager"
        />
        {/* Lớp đen mờ (Dim Dark Overlay) to soften background brightness and highlight text */}
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
        {/* Soft edge blend for smooth top & bottom section transition */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#050507] via-[#050507]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full relative z-10">
        {/* =========================================================================
            SECTION HEADER: APPLE TYPOGRAPHY & STORY INTRO (WHITE LUMINESCENT GLOW)
            ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          {/* Eyebrow */}
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="se3-eyebrow text-xs sm:text-sm font-bold tracking-[0.16em] text-white se3-glow-white-eyebrow mb-3 block uppercase"
          >
            {SE3_DESIGN_DATA.intro.eyebrow}
          </motion.span>

          {/* Headline with White Luminescence */}
          <h2 className="se3-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white se3-glow-white-title tracking-tight mb-4 leading-[1.08]">
            <motion.span
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="block"
            >
              {SE3_DESIGN_DATA.intro.titleLine1}
            </motion.span>
            <motion.span
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="block text-white"
            >
              {SE3_DESIGN_DATA.intro.titleLine2}
            </motion.span>
          </h2>

          {/* Subtitle */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="se3-body text-sm sm:text-base md:text-lg text-white se3-glow-white-subtle font-normal leading-relaxed max-w-2xl"
          >
            {SE3_DESIGN_DATA.intro.subtitle}
          </motion.p>
        </div>

        {/* =========================================================================
            CIRCULAR TESTIMONIALS / 3D CYLINDRICAL DECK SHOWCASE
            ========================================================================= */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full"
        >
          <CircularTestimonials
            testimonials={SE3_CIRCULAR_DESIGN_ITEMS}
            autoplay={true}
            autoplayInterval={5000}
            colors={{
              name: '#ffffff',
              designation: '#ffffff',
              testimony: '#ffffff',
              arrowBackground: 'rgba(255, 255, 255, 0.08)',
              arrowForeground: '#ffffff',
              arrowHoverBackground: '#0071e3',
            }}
            fontSizes={{
              name: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              designation: '1.05rem',
              quote: '1rem',
            }}
          />
        </motion.div>
      </div>

      {/* Subtle bottom transition gradient into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#050507]/60 to-[#f5f5f7] pointer-events-none" />
    </section>
  );
}

export default SE3DesignSection;
