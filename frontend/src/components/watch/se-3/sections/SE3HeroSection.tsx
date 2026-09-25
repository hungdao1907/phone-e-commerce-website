import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { SE3_HERO_DATA } from '../../../../data/watch/se-3/data/se3Data';

export function SE3HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const handleScrollToDesign = () => {
    const el = document.getElementById('se3-design');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToCTA = () => {
    const el = document.getElementById('se3-cta');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-black text-white select-none border-b border-white/10 aspect-[16/7] min-h-[440px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] max-h-[700px] flex items-end">
      {/* Background Video (Wrist Wearing Video from Pinterest) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video
          src="/videos/watch/watch-se3-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center select-none"
        />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full pb-8 sm:pb-12 md:pb-14 relative z-10">
        <div className="max-w-xl text-left">
          {/* Eyebrow */}
          <span className="se3-eyebrow text-xs sm:text-sm font-semibold tracking-[0.14em] text-white/90 mb-2 block uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {SE3_HERO_DATA.badge}
          </span>

          {/* Title with Gradient Polish */}
          <h1 className="se3-heading text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-2 sm:mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-tight">
            {SE3_HERO_DATA.titleLine1} {SE3_HERO_DATA.titleLine2}
          </h1>

          {/* Subtitle */}
          <p className="se3-body text-xs sm:text-sm text-white max-w-md mb-4 sm:mb-6 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] font-normal leading-relaxed">
            {SE3_HERO_DATA.subtitle}
          </p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.2 }}
            className="flex items-center gap-3 sm:gap-3.5 flex-wrap"
          >
            <button
              type="button"
              onClick={handleScrollToDesign}
              className="se3-btn-white se3-heading inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Khám phá ngay</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleScrollToCTA}
              className="se3-heading inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/25 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            >
              <span>Xem giá & Đặt hàng</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

