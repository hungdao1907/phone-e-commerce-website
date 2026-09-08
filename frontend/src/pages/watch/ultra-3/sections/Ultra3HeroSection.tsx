import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, Compass, SlidersHorizontal } from 'lucide-react';
import { ULTRA3_HERO_DATA } from '../data/ultra3Data';

interface Ultra3HeroSectionProps {
  onOpenSpecs?: () => void;
}

export function Ultra3HeroSection({ onOpenSpecs }: Ultra3HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleScrollToExplore = () => {
    const el = document.getElementById('ultra3-design');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="ultra3-hero"
      className="relative w-full h-[100dvh] min-h-[640px] flex flex-col items-center justify-between pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-[#060608] text-white overflow-hidden select-none"
    >
      {/* =========================================================================
          1. CINEMATIC EXTREME ALPINE RIDGE BACKGROUND (FULL SCREEN VIEW)
          ========================================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src={ULTRA3_HERO_DATA.bgImage}
          alt="Apple Watch Ultra 3 Alpine Ridge Landscape"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.85] contrast-[1.12]"
          loading="eager"
        />

        {/* Cinematic Vignettes & Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-[#060608]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#060608]/25 to-[#060608]/85 pointer-events-none" />

        {/* Top subtle orange rim horizon glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-orange-600/10 blur-[80px] pointer-events-none" />
      </div>

      {/* =========================================================================
          2. TOP HUD TELEMETRY BAR & EYEBROW
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center shrink-0">
        {/* Eyebrow Pill with Orange Accent */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#ff6700] uppercase mb-2 sm:mb-3 shadow-md"
        >
          <Compass className="w-3 h-3 animate-pulse text-[#ff6700]" />
          <span>{ULTRA3_HERO_DATA.eyebrow}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6700]" />
        </motion.div>

        {/* Powerful 3-Line Headline: Xa hơn. Cao hơn. Sâu hơn. */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
          {ULTRA3_HERO_DATA.titleLines.map((line, index) => (
            <motion.h1
              key={index}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.12 + index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`ultra-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.02] drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] ${
                index === 0
                  ? 'text-white'
                  : index === 1
                  ? 'bg-gradient-to-r from-white via-neutral-200 to-amber-200 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-white via-neutral-100 to-[#ff7b1a] bg-clip-text text-transparent'
              }`}
            >
              {line}
            </motion.h1>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="ultra-body text-xs sm:text-sm md:text-base text-white text-luminescent-white max-w-lg mx-auto font-normal leading-relaxed"
        >
          {ULTRA3_HERO_DATA.subtitle}
        </motion.p>
      </div>

      {/* =========================================================================
          3. HERO FOREGROUND: ULTRA 3 PROPORTIONAL CLOSE-UP (MAX-H ADAPTIVE)
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 flex items-center justify-center my-1 sm:my-2 min-h-0">
        {/* Watch Render with Ambient Shadow & Glow */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-52 sm:w-72 md:w-80 lg:w-[360px] xl:w-[400px] h-full max-h-[38vh] sm:max-h-[42vh] aspect-square flex items-center justify-center group"
        >
          {/* Subtle Orange Environmental Backlight */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#ff6700]/25 via-amber-500/10 to-transparent blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

          <img
            src={ULTRA3_HERO_DATA.image}
            alt="Apple Watch Ultra 3 - Titanium 49mm with Orange Ocean Band"
            className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] select-none transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="eager"
          />

          {/* Precision Floating Coordinates HUD Badge */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="absolute top-2 sm:top-6 -left-2 sm:left-2 z-20 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-md border border-white/15 text-[9px] font-mono text-white text-luminescent-white shadow-xl"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6700] animate-ping" />
            <span>ALT 4,810M • 45°50′01″N</span>
          </motion.div>

          {/* Action Button Indicator HUD Badge */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="absolute bottom-4 sm:bottom-8 -right-2 sm:right-2 z-20 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-md border border-orange-500/40 text-[9px] font-mono text-[#ff6700] shadow-xl"
          >
            <span className="font-bold">ACTION BUTTON</span>
            <span className="text-white text-luminescent-white">READY</span>
          </motion.div>
        </motion.div>
      </div>

      {/* =========================================================================
          4. BOTTOM TELEMETRY HUD CHIPS & INTERACTIVE CTAS
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center shrink-0">
        {/* 4 Telemetry HUD Spec Chips */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full mb-3 sm:mb-4"
        >
          {ULTRA3_HERO_DATA.hudSpecs.map((item, idx) => (
            <div
              key={idx}
              className="ultra-hud-chip p-2 sm:p-2.5 flex flex-col items-center sm:items-start text-center sm:text-left bg-black/55 border border-white/10 hover:border-orange-500/40 transition-all duration-300 group"
            >
              <span className="text-[9px] sm:text-[10px] font-mono text-white text-luminescent-white uppercase tracking-widest mb-0.5 group-hover:text-[#ff6700] transition-colors">
                {item.label}
              </span>
              <span className="ultra-heading text-xs sm:text-sm lg:text-base font-bold text-white tracking-tight">
                {item.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Action Buttons & Scroll Indicator */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="flex items-center gap-3 w-full justify-center"
        >
          {/* Primary Explore Button */}
          <button
            type="button"
            onClick={handleScrollToExplore}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm bg-[#ff6700] hover:bg-[#ff7b1a] text-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_20px_rgba(255,103,0,0.35)]"
          >
            <span>Khám phá Ultra 3</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>

          {/* Secondary Specs Button */}
          <button
            type="button"
            onClick={onOpenSpecs}
            className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/35 backdrop-blur-md transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6700]" />
            <span>Thông số kỹ thuật</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
