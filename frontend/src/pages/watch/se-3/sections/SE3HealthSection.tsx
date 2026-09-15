import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThumbnailSlider } from '@/components/ui/ThumbnailSlider';
import { SE3_HEALTH_DATA, SE3_HEALTH_SLIDER_ITEMS } from '../data/se3Data';

interface SE3HealthSectionProps {
  onOpenSpecs?: () => void;
}

export function SE3HealthSection({ onOpenSpecs }: SE3HealthSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="se3-health"
      className="relative w-full py-20 sm:py-28 md:py-32 bg-[#f5f5f7] overflow-hidden text-black scroll-mt-16"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* =========================================================================
            SECTION HEADER: INTRO & CALL TO ACTION
            ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl flex flex-col items-start"
          >
            <span className="se3-eyebrow text-xs sm:text-sm font-bold tracking-[0.14em] text-neutral-500 mb-3 block uppercase">
              {SE3_HEALTH_DATA.eyebrow}
            </span>
            <h2 className="se3-heading text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight mb-4 leading-tight">
              {SE3_HEALTH_DATA.titleLine1}
              <br />
              <span className="text-neutral-500">{SE3_HEALTH_DATA.titleLine2}</span>
            </h2>
            <p className="se3-body text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
              {SE3_HEALTH_DATA.description}
            </p>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-shrink-0"
          >
            <button
              type="button"
              onClick={onOpenSpecs}
              className="se3-btn-black px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 active:scale-95"
            >
              Xem các tính năng sức khỏe
            </button>
          </motion.div>
        </div>

        {/* =========================================================================
            THUMBNAIL SLIDER: 21ST.DEV PATTERN WITH 5 APPLE HEALTH VISUALS
            ========================================================================= */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <ThumbnailSlider items={SE3_HEALTH_SLIDER_ITEMS} autoplay={true} autoplayInterval={5500} />
        </motion.div>
      </div>
    </section>
  );
}
