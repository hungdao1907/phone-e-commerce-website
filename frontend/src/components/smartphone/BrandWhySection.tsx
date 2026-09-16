import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCw, CreditCard, Headphones, CheckCircle2 } from 'lucide-react';
import type { BrandConfig } from '@/types/smartphone';

const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

interface BrandWhySectionProps {
  config: BrandConfig;
}

export function BrandWhySection({ config }: BrandWhySectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const headerMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.6, ease: EASE_EDITORIAL },
      };

  const pillarMotion = (idx: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.55, delay: idx * 0.1, ease: EASE_EDITORIAL },
        };

  // Store guarantees
  const storeGuarantees = [
    {
      icon: ShieldCheck,
      title: '100% Chính Hãng',
      copy: 'Phân phối chính ngạch, nguyên seal, xuất hóa đơn VAT đầy đủ.',
    },
    {
      icon: RefreshCw,
      title: '30 Ngày 1 Đổi 1',
      copy: 'Đổi mới lập tức nếu có lỗi từ nhà sản xuất.',
    },
    {
      icon: CreditCard,
      title: 'Trả Góp 0% Lãi Suất',
      copy: 'Thủ tục trực tuyến 5 phút, hỗ trợ qua thẻ tín dụng và CCCD.',
    },
    {
      icon: Truck,
      title: 'Giao Hàng Siêu Tốc 2H',
      copy: 'Giao nhanh nội thành và miễn phí vận chuyển toàn quốc.',
    },
  ];

  return (
    <section
      id={`${config.id}-why-brand`}
      aria-label={config.whyBrandEyebrow}
      className="relative w-full overflow-hidden bg-[#fafbfc] border-y border-neutral-200/80 py-24 sm:py-32"
    >
      {/* Ambient background tint */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(ellipse at center, ${config.accent} 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* Brand Watermark */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.03] font-black tracking-tighter"
        aria-hidden="true"
        style={{
          fontSize: 'clamp(6rem, 18vw, 16rem)',
          lineHeight: 0.8,
          whiteSpace: 'nowrap',
          transform: 'translateX(-50%) translateY(20%)',
        }}
      >
        {config.whyBrandWatermark || config.brand}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header {...headerMotion} className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span
            className="inline-block text-xs font-extrabold uppercase tracking-[0.2em] mb-4 px-3.5 py-1 rounded-full bg-white border border-neutral-200 shadow-sm"
            style={{ color: config.accent }}
          >
            {config.whyBrandEyebrow || `VÌ SAO CHỌN ${config.brand.toUpperCase()}?`}
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4 leading-tight">
            {config.whyBrandHeadline}
            {config.whyBrandSubheadline && (
              <>
                <br />
                <span className={config.gradientText}>{config.whyBrandSubheadline}</span>
              </>
            )}
          </h2>

          <p className="text-neutral-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {config.whyBrandDescription}
          </p>
        </motion.header>

        {/* Pillars Bento Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${config.pillars && config.pillars.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-16`}>
          {config.pillars?.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.num || idx}
                {...pillarMotion(idx)}
                className="group relative p-8 rounded-3xl bg-white border border-neutral-200/90 hover:border-neutral-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${pillar.accent || config.accent}12` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: pillar.accent || config.accent }}
                        strokeWidth={2}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-300">
                      {pillar.num || `0${idx + 1}`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-neutral-950">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed whitespace-pre-line">
                    {pillar.copy}
                  </p>
                </div>

                {/* Accent line */}
                <div
                  className="w-6 h-[2px] rounded-full mt-6 transition-all duration-300 group-hover:w-14"
                  style={{ backgroundColor: pillar.accent || config.accent }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Store Trust Guarantees Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 sm:p-10 rounded-3xl bg-neutral-900 text-white shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {storeGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col space-y-2">
                <div className="inline-flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <Icon className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {item.copy}
                </p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default BrandWhySection;
