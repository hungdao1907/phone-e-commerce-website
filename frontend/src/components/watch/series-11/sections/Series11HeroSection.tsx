import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function Series11HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const handleScrollToDesign = () => {
    const el = document.getElementById('s11-design');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-black text-white select-none border-b border-white/10 aspect-[16/7] min-h-[420px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px] max-h-[680px] flex items-end">
      {/* Background Video with Enhanced Color Vibrancy */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video
          src="/videos/watch/watch-series11-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback"
          poster="/images/watch/watch-series11-studio.png"
          className="w-full h-full object-cover object-center saturate-[1.3] contrast-[1.08] brightness-[1.05] pointer-events-none select-none"
        />
        {/* Cinematic Gradient Overlays for High-Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content Layout (Balanced for Landscape Banner Ratio) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pb-8 sm:pb-10 md:pb-12 lg:pb-14 flex flex-col items-start text-left">
        {/* Small Eyebrow Label */}
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#2997ff] mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
          Apple Watch Series 11
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-4 sm:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] max-w-xl">
          Thông minh hơn <br />
          cho từng nhịp sống
        </h1>

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
            className="series11-btn-primary whitespace-nowrap text-xs sm:text-sm"
          >
            <span>Khám phá Series 11</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <Link
            to="/watch#watch-models"
            className="series11-btn-secondary whitespace-nowrap text-xs sm:text-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Xem các dòng khác</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
