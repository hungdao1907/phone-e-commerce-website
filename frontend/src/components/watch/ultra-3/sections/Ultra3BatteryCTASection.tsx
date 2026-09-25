import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { ULTRA3_BATTERY_CTA_DATA } from '../../../../data/watch/ultra-3/data/ultra3Data';

interface Ultra3BatteryCTASectionProps {
  onOpenSpecs?: () => void;
}

export function Ultra3BatteryCTASection({ onOpenSpecs }: Ultra3BatteryCTASectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedFinish, setSelectedFinish] = useState<'natural' | 'black'>('natural');

  const handleBuyNow = () => {
    onOpenSpecs?.();
  };

  const secondaryBatterySpecs = [
    { value: '72 GIỜ', label: 'Chế độ Nguồn Điện Thấp', desc: 'Duy trì định vị GPS và nhịp tim cho chuyến thám hiểm nhiều ngày' },
    { value: '15 PHÚT', label: 'Sạc nhanh thám hiểm', desc: 'Nạp năng lượng cấp tốc đủ dùng liên tục đến 12 giờ' },
    { value: '45 PHÚT', label: 'Nạp 80% dung lượng', desc: 'Chuẩn bị sẵn sàng trước khi bước vào hành trình leo núi tiếp theo' },
  ];

  return (
    <section
      id={ULTRA3_BATTERY_CTA_DATA.sectionId}
      className="relative w-full min-h-screen flex flex-col items-center justify-between py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#050507] text-white overflow-hidden scroll-mt-16 select-none font-['SF_Pro_Text','SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] antialiased"
    >
      {/* Background Ambience: Night Expedition Alpine Basecamp under Starry Sky */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <img
          src="/images/watch/ultra3-battery-expedition-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-70 filter contrast-115 brightness-100"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#050507]/40 to-[#050507]/95" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#060507] via-[#060507]/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/85 to-transparent" />
      </div>

      {/* Subtle warm horizon amber glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-64 bg-amber-600/10 blur-[120px] pointer-events-none z-0" />

      <div className="max-w-5xl lg:max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        {/* =========================================================================
            BATTERY SHOWCASE: OPEN DISPLAY DIRECTLY ON EXPEDITION NIGHT BACKGROUND
            ========================================================================= */}
        <div className="relative w-full mb-16 sm:mb-24 flex flex-col items-center text-center">

          {/* TOP REGION: Headline & Subtitle */}
          <div className="relative z-10 flex flex-col items-center max-w-3xl">
            <motion.h2
              initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="ultra-heading text-3xl sm:text-5xl lg:text-6xl font-bold sm:font-extrabold tracking-[-0.035em] mb-4 whitespace-pre-line text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
            >
              {ULTRA3_BATTERY_CTA_DATA.title}
            </motion.h2>

            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.14 }}
              className="ultra-body text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed font-normal tracking-[-0.012em]"
            >
              {ULTRA3_BATTERY_CTA_DATA.subtitle}
            </motion.p>
          </div>

          {/* MIDDLE REGION: 42 GIỜ FLOATING DIRECTLY INSIDE THE SEE-THROUGH APERTURE */}
          <div className="relative z-10 w-full max-w-3xl flex flex-col items-center my-6 sm:my-10">
            {/* Subtle Ambient Radial Backlight */}
            <div className="absolute -inset-10 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center relative z-10"
            >
              {/* Giant 42 Typography */}
              <div className="ultra-heading text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-bold sm:font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-[#ff6700] tracking-tighter leading-none select-none drop-shadow-[0_20px_50px_rgba(255,103,0,0.35)]">
                42
              </div>

              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/60 border border-orange-500/40 text-xs sm:text-sm font-bold tracking-[0.16em] text-[#ff6700] uppercase -mt-4 sm:-mt-6 shadow-xl backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-[#ff6700]" />
                <span>GIỜ PIN THỰC TẾ • TIÊU CHUẨN THÁM HIỂM</span>
              </div>
            </motion.div>

            {/* Daylight -> Sunset -> Night Mood Description */}
            <p className="text-xs sm:text-sm text-white/90 mt-6 max-w-md font-normal leading-relaxed tracking-[-0.01em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Từ bình minh leo đèo, hoàng hôn vượt suối, đến qua đêm tại trại căn cứ — pin Ultra 3 vẫn bền bỉ đồng hành.
            </p>
          </div>

          {/* BOTTOM REGION: 3 SECONDARY METRICS DIRECTLY ON BACKGROUND (NO CARD) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-4xl mt-10 sm:mt-14 text-center md:text-left">
            {secondaryBatterySpecs.map((item, idx) => (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 + idx * 0.1 }}
                className="flex flex-col group select-none"
              >
                <div className="ultra-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white group-hover:text-[#ff6700] transition-colors mb-1.5 tabular-nums drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  {item.value}
                </div>
                <div className="text-xs font-semibold text-white/95 uppercase tracking-wide mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {item.label}
                </div>
                <p className="text-xs sm:text-[13px] text-white/75 font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            3. FINAL PURCHASE MOMENT: FULL-BLEED BANNER CARD WITH FLOATING CONTROLS
            ========================================================================= */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-5xl rounded-[28px] sm:rounded-[36px] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.85)] overflow-hidden mb-8 relative aspect-[16/9] group bg-black"
        >
          {/* Full-bleed Photography */}
          <img
            src="/images/watch/ultra3-banner-summit.jpg"
            alt="Apple Watch Ultra 3 - Phiêu lưu, tăng cường"
            className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-700 select-none"
          />

          {/* Lớp tối nhẹ ở phần dưới để làm nổi bật văn bản & nút bấm */}
          <div className="absolute inset-x-0 bottom-0 h-48 sm:h-56 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

          {/* Floating Product Controls Inside Card - Zero background box */}
          <div className="absolute bottom-6 sm:bottom-8 inset-x-6 sm:inset-x-8 z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-5 select-none pointer-events-auto">
            {/* Left: Product Title, Specs & Finish Toggle */}
            <div className="flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-orange-500/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#ff6700] mb-2 shadow-lg">
                TITANIUM 49MM • MỚI
              </div>
              <h3 className="ultra-heading text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] mb-1">
                {ULTRA3_BATTERY_CTA_DATA.card.title}
              </h3>
              <p className="text-xs text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-3 font-normal">
                {ULTRA3_BATTERY_CTA_DATA.card.specs}
              </p>

              {/* Finish Options Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mr-1">Vỏ Titan:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFinish('natural')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 backdrop-blur-md ${
                    selectedFinish === 'natural'
                      ? 'bg-white/25 border-white/60 text-white shadow-sm'
                      : 'bg-black/40 border-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <span>Titan Tự Nhiên</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFinish('black')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 backdrop-blur-md ${
                    selectedFinish === 'black'
                      ? 'bg-white/25 border-white/60 text-white shadow-sm'
                      : 'bg-black/40 border-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-600" />
                  <span>Titan Đen</span>
                </button>
              </div>
            </div>

            {/* Right: Price & CTA Buttons Cluster (Directly inside card) */}
            <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
              <div className="text-left md:text-right">
                <span className="text-xs text-white/80 block font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Giá chính hãng
                </span>
                <div className="ultra-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#ff6700] tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
                  {ULTRA3_BATTERY_CTA_DATA.card.price}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="px-7 py-3 rounded-full font-bold text-xs sm:text-sm bg-[#ff6700] hover:bg-[#ff7b1a] text-black shadow-[0_4px_20px_rgba(255,103,0,0.4)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  Mua ngay
                </button>

                <button
                  type="button"
                  onClick={onOpenSpecs}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full font-semibold text-xs sm:text-sm bg-black/40 hover:bg-black/60 text-white border border-white/25 transition-all cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <span>Chi tiết thông số</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Warranty & Trust Badges Outside Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl pt-2">
          {ULTRA3_BATTERY_CTA_DATA.trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#ff6700] mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white mb-0.5">{badge.title}</div>
                <div className="text-[11px] text-white/60">{badge.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
