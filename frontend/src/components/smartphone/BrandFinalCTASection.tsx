import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight, PhoneCall, ShieldCheck, Truck, Clock } from 'lucide-react';
import type { BrandConfig } from '@/types/smartphone';

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
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.6, delay, ease: EASE_CTA },
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
      className="relative w-full overflow-hidden bg-white pt-20 sm:pt-28 pb-16"
    >
      {/* Ambient glowing atmosphere */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${config.accent} 0%, ${config.accentSoft || '#3b82f6'} 40%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Center Box */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.span
            {...fadeUp(0)}
            className="inline-block text-xs font-extrabold uppercase tracking-[0.2em] mb-4 px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200"
          >
            {config.ctaEyebrow || 'SẴN SÀNG NÂNG CẤP?'}
          </motion.span>

          <motion.h2
            {...fadeUp(0.08)}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-neutral-950 tracking-tight mb-5 leading-tight"
          >
            {config.ctaHeadline}
            {config.ctaSubheadline && (
              <>
                <br />
                <span className={config.gradientText}>{config.ctaSubheadline}</span>
              </>
            )}
          </motion.h2>

          <motion.p
            {...fadeUp(0.16)}
            className="text-sm sm:text-base md:text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto"
          >
            {config.ctaDescription || `Trải nghiệm trọn vẹn bộ sưu tập điện thoại ${config.brand} chính hãng với nhiều ưu đãi đặc quyền hôm nay.`}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            {...fadeUp(0.24)}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              type="button"
              onClick={scrollToProducts}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-neutral-950 text-white text-sm sm:text-base font-bold transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.15)] cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>{config.ctaPrimaryText || 'Chọn Mua Ngay'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <a
              href="tel:19008888"
              className="group inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-200 text-sm sm:text-base font-semibold transition-all duration-300 cursor-pointer w-full sm:w-auto justify-center shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>{config.ctaSecondaryText || 'Tư Vấn Miễn Phí'}</span>
            </a>
          </motion.div>
        </div>

        {/* Multi-Device Product Composition Showcase */}
        {config.ctaImages && config.ctaImages.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_CTA }}
            className="relative w-full max-w-4xl mx-auto mb-16"
          >
            {/* Ambient halo behind devices */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full pointer-events-none opacity-25 blur-[70px]"
              style={{ background: config.accent }}
            />

            <div className="relative flex items-end justify-center gap-3 sm:gap-6 px-4 sm:px-8">
              {config.ctaImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative flex-shrink-0 transition-transform duration-500 hover:scale-105 ${
                    img.position === 'center'
                      ? 'w-[42%] sm:w-[38%] z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]'
                      : 'w-[26%] sm:w-[24%] opacity-80 drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)]'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-auto object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trust Badges Footer */}
        <div className="pt-10 border-t border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-neutral-900">Bảo Hành Chính Hãng</span>
            <span className="text-[11px] text-neutral-500">12 - 24 tháng toàn quốc</span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Truck className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-neutral-900">Miễn Phí Vận Chuyển</span>
            <span className="text-[11px] text-neutral-500">Đơn hàng từ 1.000.000₫</span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-neutral-900">Hỗ Trợ Kỹ Thuật 24/7</span>
            <span className="text-[11px] text-neutral-500">Đội ngũ chuyên viên tận tâm</span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <PhoneCall className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-900">Tổng Đài Hỗ Trợ</span>
            <span className="text-[11px] text-neutral-500">1900 8888 (8:00 - 21:30)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandFinalCTASection;
