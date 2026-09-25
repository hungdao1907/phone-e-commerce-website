import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SE3_FINAL_CTA_DATA } from '../../../../data/watch/se-3/data/se3Data';

interface SE3FinalCTASectionProps {
  onOpenSpecs: () => void;
}

export function SE3FinalCTASection({ onOpenSpecs }: SE3FinalCTASectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleBuyNow = () => {
    onOpenSpecs?.();
  };

  return (
    <section
      id="se3-cta"
      className="relative w-full bg-[#03020c] text-white pt-8 pb-20 sm:pb-28 select-none overflow-hidden scroll-mt-16"
    >
      {/* =========================================================================
          1. COSMIC HORIZON BANNER (Kích thước banner ngang tiêu chuẩn)
          ========================================================================= */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[460px] sm:max-h-[520px] flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden">
        {/* Banner Graphic */}
        <img
          src="/images/watch/se3-final-cta-banner.png"
          alt="Apple Watch SE 3 Cosmic Horizon Banner"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Subtle Edge Transitions */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#03020c] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#03020c] via-[#03020c]/60 to-transparent pointer-events-none" />

        {/* Banner Text Content */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {/* Eyebrow Tag */}
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-cyan-300 uppercase mb-3 sm:mb-4 shadow-sm"
          >
            APPLE WATCH SE
          </motion.span>

          {/* Headline */}
          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="se3-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-3 leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          >
            <span className="bg-gradient-to-r from-sky-300 via-indigo-200 to-white bg-clip-text text-transparent">
              Bắt
            </span>
            <span> đầu nhịp mới.</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.14 }}
            className="se3-body text-xs sm:text-sm md:text-base text-neutral-300 font-normal max-w-lg mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            {SE3_FINAL_CTA_DATA.subtitle}
          </motion.p>
        </div>
      </div>

      {/* =========================================================================
          2. CARD SẢN PHẨM & TRUST BADGES (Nằm bên dưới banner nền)
          ========================================================================= */}
      <div className="max-w-4xl lg:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 flex flex-col items-center">
        {/* Horizontal Panorama Showcase Glass Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full bg-white/[0.08] hover:bg-white/[0.11] backdrop-blur-2xl border border-white/15 hover:border-white/30 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-all duration-300 group mb-10 flex flex-col text-left"
        >
          {/* Panoramic Image Container */}
          <div className="relative w-full aspect-[1024/434] overflow-hidden bg-black/40">
            <img
              src={SE3_FINAL_CTA_DATA.card.image}
              alt={SE3_FINAL_CTA_DATA.card.title}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015] select-none"
              loading="lazy"
            />
            {/* Subtle bottom gradient to merge cleanly into action footer */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050410]/70 via-transparent to-transparent" />
          </div>

          {/* Action Footer Strip */}
          <div className="p-4 sm:p-5 lg:p-6 bg-white/[0.04] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="se3-heading text-base sm:text-lg font-black text-white">
                  {SE3_FINAL_CTA_DATA.card.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Mới
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-300 font-normal mt-0.5">
                {SE3_FINAL_CTA_DATA.card.specs}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-neutral-400 font-medium">Giá từ</div>
                <div className="se3-heading text-base sm:text-lg font-black text-white se3-tabular">
                  {SE3_FINAL_CTA_DATA.card.price}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="bg-white hover:bg-neutral-100 text-black px-5 sm:px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  Mua ngay
                </button>

                <button
                  type="button"
                  onClick={onOpenSpecs}
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer border border-white/15"
                >
                  <span>Xem cấu hình</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3 Trust Badges arranged horizontally */}
        <div className="grid grid-cols-3 gap-3 sm:gap-8 w-full max-w-xl pt-6 border-t border-white/10">
          {SE3_FINAL_CTA_DATA.trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 + idx * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/90 mb-1.5 shadow-xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="se3-heading text-[11px] sm:text-xs font-bold text-white mb-0.5">
                  {badge.title}
                </div>
                <div className="se3-body text-[10px] sm:text-[11px] text-neutral-400 font-normal">
                  {badge.desc}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
