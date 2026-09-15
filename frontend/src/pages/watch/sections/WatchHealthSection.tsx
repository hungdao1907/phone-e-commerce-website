import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Moon,
  Activity,
  ShieldCheck,
  PhoneCall,
  ShieldAlert,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';

type HealthModalType = 'heart' | 'sleep' | 'spo2' | 'safety' | null;

export function WatchHealthSection() {
  const [activeModal, setActiveModal] = useState<HealthModalType>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // =========================================================================
  // 1. SECTION-LOCAL SCROLL PROGRESS (Global Lenis remains sole scroll owner)
  // =========================================================================
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Phase 1: Giant Watch Protagonist Banner (Visible on entry, smoothly dissolves under fog)
  const watchOpacity = useTransform(scrollYProgress, [0, 0.18, 0.45], [1, 1, 0]);
  const watchScale = useTransform(scrollYProgress, [0, 0.45], [1.0, 0.96]);
  const watchY = useTransform(scrollYProgress, [0, 0.45], [0, -20]);

  // Phase 2: Misty White Fog (Smoothly appears to cover the background watch completely, stays 100% white)
  const fogOpacity = useTransform(scrollYProgress, [0.15, 0.45, 1.0], [0, 1, 1]);

  // Phase 3: Header + 4 Cards (Gracefully emerges on top of the white fog backdrop, stays 100% visible)
  const cardsOpacity = useTransform(scrollYProgress, [0.35, 0.65, 1.0], [0, 1, 1]);
  const cardsY = useTransform(scrollYProgress, [0.35, 0.65], [36, 0]);
  const cardsScale = useTransform(scrollYProgress, [0.35, 0.65], [0.95, 1.0]);

  // =========================================================================
  // 3. REDUCED MOTION FALLBACK (Mandatory compact non-scroll-driven layout)
  // =========================================================================
  // =========================================================================
  // 3. REDUCED MOTION FALLBACK (Mandatory compact non-scroll-driven layout)
  // =========================================================================
  if (shouldReduceMotion) {
    return (
      <section id="watch-health" className="w-full bg-white text-[#1d1d1f] py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center flex flex-col items-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold uppercase tracking-wider mb-3">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Sức Khỏe & Sinh Trắc Học</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1d1d1f] leading-tight">
              Thấu hiểu cơ thể. Bảo vệ từng nhịp sống.
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 leading-relaxed mt-3 max-w-2xl">
              Hệ thống cảm biến sinh học thế hệ mới liên tục theo dõi nhịp tim, giấc ngủ, oxy trong máu và an toàn cứu hộ — mang đến cái nhìn toàn diện 24/7.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <img
              src="/images/watch/watch-series11-health-hero.png"
              alt="Apple Watch Series 11"
              width={2944}
              height={2944}
              className="w-full max-w-[480px] h-auto object-contain mix-blend-multiply [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_98%)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Heart */}
            <div
              onClick={() => setActiveModal('heart')}
              className="p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-rose-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(244,63,94,0.14)] cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[#fa114f]">
                    <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600">NHỊP TIM & ECG</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">30s ECG</span>
                </div>
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#1d1d1f] font-mono">72</span>
                    <span className="text-xs font-bold text-rose-500 font-mono">BPM</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] mt-0.5">Cảnh báo nhịp tim & AFib</h3>
                </div>
                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-44 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-heart.png"
                      alt="Apple Watch Nhịp Tim & ECG"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Điện tâm đồ Sóng I trực tiếp từ Digital Crown trong 30s.</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 2: Sleep */}
            <div
              onClick={() => setActiveModal('sleep')}
              className="p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-indigo-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(99,102,241,0.14)] cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">GIẤC NGỦ ĐÊM</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">Chuyên sâu</span>
                </div>
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#1d1d1f] font-mono">7h 42m</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] mt-0.5">3 Giai đoạn & Thân nhiệt</h3>
                </div>
                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-44 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-sleep.png"
                      alt="Apple Watch Giấc Ngủ Đêm"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Phân tích chu kỳ REM, Ngủ Sâu & Thân nhiệt cổ tay.</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 3: SpO2 */}
            <div
              onClick={() => setActiveModal('spo2')}
              className="p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-cyan-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(6,182,212,0.14)] cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-cyan-600">
                    <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">OXY MÁU SpO₂</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100">Tối ưu</span>
                </div>
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#1d1d1f] font-mono">98%</span>
                    <span className="text-xs font-bold text-cyan-600 font-mono">SpO₂</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] mt-0.5">Cảm biến quang học 4 phổ</h3>
                </div>
                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-44 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-spo2.png"
                      alt="Apple Watch Oxy Máu SpO2"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Cảm biến quang học 4 phổ bước sóng LED 24/7.</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 4: Safety */}
            <div
              onClick={() => setActiveModal('safety')}
              className="p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(16,185,129,0.14)] cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">AN TOÀN & SOS</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Vệ tinh</span>
                </div>
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#1d1d1f] font-mono">24/7</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">BẢO VỆ</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] mt-0.5">Phát hiện va chạm & SOS</h3>
                </div>
                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-44 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-safety.png"
                      alt="Apple Watch Cứu Hộ SOS"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">SOS vệ tinh & Phát hiện va chạm tải 256G.</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // 4. MAIN SCROLLYTELLING COMPONENT (DESKTOP/TABLET + MOBILE ADAPTIVE)
  // =========================================================================
  return (
    <>
      {/* -----------------------------------------------------------------
          A. MOBILE NATURAL STACKED STORY (md:hidden) — 4 Seamless Vertical Cards
          ----------------------------------------------------------------- */}
      <section className="md:hidden w-full bg-white text-[#1d1d1f] py-10 px-4 relative overflow-hidden select-none">
        <div className="max-w-md mx-auto flex flex-col items-center">
          {/* Mobile Header */}
          <div className="text-center flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-[10px] font-bold uppercase tracking-wider mb-2">
              <HeartPulse className="w-3 h-3 animate-pulse" />
              <span>Sức Khỏe & Sinh Trắc Học</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#1d1d1f] leading-tight">
              Thấu hiểu cơ thể. Bảo vệ từng nhịp sống.
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 px-2">
              Cảm biến sinh học thế hệ mới theo dõi nhịp tim, giấc ngủ, oxy máu và cứu hộ an toàn 24/7.
            </p>
          </div>

          {/* Centered Watch Visual (Full view & sharp) */}
          <div className="relative mb-6 w-full flex justify-center items-center">
            <img
              src="/images/watch/watch-series11-health-hero.png"
              alt="Apple Watch Series 11"
              width={2944}
              height={2944}
              className="w-full max-w-[340px] h-auto object-contain mix-blend-multiply [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_98%)]"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Mobile Telemetry 4 Cards Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Card 1: Heart */}
            <div
              onClick={() => setActiveModal('heart')}
              className="p-5 rounded-[28px] bg-white border border-black/[0.06] hover:border-rose-300 shadow-[0_8px_24px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-[#fa114f]">
                      <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">NHỊP TIM & ECG</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">30s ECG</span>
                </div>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#1d1d1f] font-mono">72</span>
                    <span className="text-xs font-bold text-rose-500 font-mono">BPM</span>
                  </div>
                </div>

                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-36 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-heart.png"
                      alt="Apple Watch Nhịp Tim & ECG"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1">Chạm giữ Digital Crown 30s để đo ECG.</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 2: Sleep */}
            <div
              onClick={() => setActiveModal('sleep')}
              className="p-5 rounded-[28px] bg-white border border-black/[0.06] hover:border-indigo-300 shadow-[0_8px_24px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Moon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">GIẤC NGỦ ĐÊM</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">Chuyên sâu</span>
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-black text-[#1d1d1f] font-mono">7h 42m</span>
                </div>

                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-36 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-sleep.png"
                      alt="Apple Watch Giấc Ngủ Đêm"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1">REM, Ngủ Sâu & Thân nhiệt cổ tay.</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 3: SpO2 */}
            <div
              onClick={() => setActiveModal('spo2')}
              className="p-5 rounded-[28px] bg-white border border-black/[0.06] hover:border-cyan-300 shadow-[0_8px_24px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">OXY MÁU SpO₂</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100">Tối ưu</span>
                </div>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#1d1d1f] font-mono">98%</span>
                    <span className="text-xs font-bold text-cyan-600 font-mono">SpO₂</span>
                  </div>
                </div>

                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-36 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-spo2.png"
                      alt="Apple Watch Oxy Máu SpO2"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1">Cảm biến quang học 4 phổ bước sóng.</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 4: Safety */}
            <div
              onClick={() => setActiveModal('safety')}
              className="p-5 rounded-[28px] bg-white border border-black/[0.06] hover:border-emerald-300 shadow-[0_8px_24px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">AN TOÀN & SOS</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Vệ tinh</span>
                </div>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#1d1d1f] font-mono">24/7</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">BẢO VỆ</span>
                  </div>
                </div>

                <div className="w-full my-1 flex items-center justify-center">
                  <div className="w-full h-36 flex items-center justify-center">
                    <img
                      src="/images/watch/watch-card-safety.png"
                      alt="Apple Watch Cứu Hộ SOS"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1">SOS vệ tinh & Phát hiện va chạm tải 256G.</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 font-semibold">
                <span>Xem chi tiết</span>
                <span>&rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------------------------------
          B. DESKTOP & TABLET CINEMATIC SCROLLYTELLING (hidden md:block)
          SCROLL TRACK: ~540svh desktop, ~650svh tablet
          STAGE: position: sticky, top: 0, height: 100svh
          ----------------------------------------------------------------- */}
      <section
        ref={sectionRef}
        id="watch-health"
        className="watch-health-section hidden md:block relative w-full h-[220svh] lg:h-[240svh] bg-white text-[#1d1d1f] select-none"
      >
        <div className="watch-health__sticky sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col items-center justify-center bg-white z-10">
          {/* ===============================================================
              PHASE 1: GIANT HERO WATCH BANNER
              Visible prominently like an advertising banner upon entering section
              =============================================================== */}
          <motion.div
            style={{ opacity: watchOpacity, scale: watchScale, y: watchY }}
            className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0"
          >
            <img
              src="/images/watch/watch-series11-health-hero.png"
              alt="Apple Watch Series 11 Health Telemetry"
              width={2944}
              height={2944}
              className="w-full h-full max-w-[100vw] max-h-[100svh] object-contain select-none mix-blend-multiply transform-gpu [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_98%)]"
              loading="eager"
              decoding="async"
            />
          </motion.div>

          {/* ===============================================================
              PHASE 2: MISTY WHITE FOG LAYER
              Gradually covers the giant watch banner with a pristine white canvas
              =============================================================== */}
          <motion.div
            style={{ opacity: fogOpacity }}
            className="absolute inset-0 z-10 w-full h-full bg-white/96 backdrop-blur-2xl pointer-events-none"
          />

          {/* ===============================================================
              PHASE 3: HEADER + 4 EQUAL HORIZONTAL TELEMETRY CARDS
              Gracefully emerges on top of the misty white backdrop
              =============================================================== */}
          <motion.div
            style={{ opacity: cardsOpacity, y: cardsY, scale: cardsScale }}
            className="relative z-20 w-full max-w-7xl px-4 lg:px-6 xl:px-8 flex flex-col items-center justify-center gap-5 pointer-events-auto"
          >
            {/* Section Header: Eyebrow + Headline + Subheadline */}
            <div className="text-center flex flex-col items-center max-w-3xl mb-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-[11px] font-bold uppercase tracking-wider mb-2">
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                <span>Sức Khỏe & Sinh Trắc Học</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1d1d1f] leading-tight">
                Thấu hiểu cơ thể. Bảo vệ từng nhịp sống.
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-500 leading-relaxed mt-2 max-w-2xl">
                Hệ thống cảm biến sinh học thế hệ mới liên tục theo dõi nhịp tim, giấc ngủ, oxy trong máu và an toàn cứu hộ — mang đến sự bảo vệ toàn diện 24/7.
              </p>
            </div>

            {/* 4 Equal Seamless Vertical Telemetry Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 w-full items-stretch">
              {/* CARD 1: HEART RATE & ECG */}
              <div
                onClick={() => setActiveModal('heart')}
                className="watch-health-callout group relative cursor-pointer p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-rose-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(244,63,94,0.14)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-[#fa114f] group-hover:scale-110 transition-transform">
                        <HeartPulse className="w-4 h-4 animate-pulse" />
                      </div>
                      <span className="text-[10px] lg:text-[11px] font-bold tracking-wider text-rose-600 uppercase">NHỊP TIM & ECG</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                      30s ECG
                    </span>
                  </div>

                  {/* Metric & Title */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-black tracking-tight text-[#1d1d1f] font-mono">72</span>
                      <span className="text-xs font-bold text-rose-500 uppercase tracking-widest font-mono">BPM</span>
                    </div>
                    <h3 className="text-xs lg:text-sm font-bold text-[#1d1d1f] mt-0.5">Cảnh báo nhịp tim & AFib</h3>
                  </div>

                  {/* Seamless Watch Visual without Floor Shadow */}
                  <div className="w-full my-1 flex items-center justify-center">
                    <div className="w-full h-44 lg:h-48 flex items-center justify-center">
                      <img
                        src="/images/watch/watch-card-heart.png"
                        alt="Apple Watch Nhịp Tim & ECG"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2 mt-1">
                    Điện tâm đồ Sóng I trực tiếp từ Digital Crown trong 30s.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 group-hover:text-rose-600 transition-colors">
                  <span className="font-semibold">Xem chi tiết</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">&rarr;</span>
                </div>
              </div>

              {/* CARD 2: SLEEP TRACKING */}
              <div
                onClick={() => setActiveModal('sleep')}
                className="watch-health-callout group relative cursor-pointer p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-indigo-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(99,102,241,0.14)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] lg:text-[11px] font-bold tracking-wider text-indigo-600 uppercase">GIẤC NGỦ ĐÊM</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      Chuyên sâu
                    </span>
                  </div>

                  {/* Metric & Title */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-black tracking-tight text-[#1d1d1f] font-mono">7h 42m</span>
                    </div>
                    <h3 className="text-xs lg:text-sm font-bold text-[#1d1d1f] mt-0.5">3 Giai đoạn & Thân nhiệt</h3>
                  </div>

                  {/* Seamless Watch Visual without Floor Shadow */}
                  <div className="w-full my-1 flex items-center justify-center">
                    <div className="w-full h-44 lg:h-48 flex items-center justify-center">
                      <img
                        src="/images/watch/watch-card-sleep.png"
                        alt="Apple Watch Theo Dõi Giấc Ngủ"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2 mt-1">
                    Phân tích chu kỳ REM, Ngủ Sâu và cảm biến thân nhiệt cổ tay.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 group-hover:text-indigo-600 transition-colors">
                  <span className="font-semibold">Xem chi tiết</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">&rarr;</span>
                </div>
              </div>

              {/* CARD 3: BLOOD OXYGEN SpO2 */}
              <div
                onClick={() => setActiveModal('spo2')}
                className="watch-health-callout group relative cursor-pointer p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-cyan-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(6,182,212,0.14)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] lg:text-[11px] font-bold tracking-wider text-cyan-600 uppercase">OXY MÁU SpO₂</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100">
                      Tối ưu
                    </span>
                  </div>

                  {/* Metric & Title */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-black tracking-tight text-[#1d1d1f] font-mono">98%</span>
                      <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest font-mono">SpO₂</span>
                    </div>
                    <h3 className="text-xs lg:text-sm font-bold text-[#1d1d1f] mt-0.5">Cảm biến quang học 4 phổ</h3>
                  </div>

                  {/* Seamless Watch Visual without Floor Shadow */}
                  <div className="w-full my-1 flex items-center justify-center">
                    <div className="w-full h-44 lg:h-48 flex items-center justify-center">
                      <img
                        src="/images/watch/watch-card-spo2.png"
                        alt="Apple Watch Nồng Độ Oxy Máu SpO2"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2 mt-1">
                    4 phổ bước sóng LED quang học đo lường oxy hòa tan 24/7.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 group-hover:text-cyan-600 transition-colors">
                  <span className="font-semibold">Xem chi tiết</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">&rarr;</span>
                </div>
              </div>

              {/* CARD 4: SAFETY & SOS SATELLITE */}
              <div
                onClick={() => setActiveModal('safety')}
                className="watch-health-callout group relative cursor-pointer p-5 lg:p-6 rounded-[32px] bg-white border border-black/[0.06] hover:border-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(16,185,129,0.14)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] lg:text-[11px] font-bold tracking-wider text-emerald-600 uppercase">AN TOÀN & SOS</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Vệ tinh
                    </span>
                  </div>

                  {/* Metric & Title */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-black tracking-tight text-[#1d1d1f] font-mono">24/7</span>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest font-mono">BẢO VỆ</span>
                    </div>
                    <h3 className="text-xs lg:text-sm font-bold text-[#1d1d1f] mt-0.5">Phát hiện va chạm & SOS</h3>
                  </div>

                  {/* Seamless Watch Visual without Floor Shadow */}
                  <div className="w-full my-1 flex items-center justify-center">
                    <div className="w-full h-44 lg:h-48 flex items-center justify-center">
                      <img
                        src="/images/watch/watch-card-safety.png"
                        alt="Apple Watch Cứu Hộ SOS & Phát Hiện Va Chạm"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2 mt-1">
                    Nhận diện va chạm 256G, ngã mạnh và gọi cứu hộ SOS vệ tinh.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 group-hover:text-emerald-600 transition-colors">
                  <span className="font-semibold">Xem chi tiết</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">&rarr;</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================
          MODAL DETAIL OVERLAY (Triggered on click, discrete user interaction)
          =================================================================== */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-white/98 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-neutral-200 text-[#1d1d1f] overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Đóng bảng chi tiết"
              >
                <X className="w-4 h-4" />
              </button>

              {/* MODAL: HEART */}
              {activeModal === 'heart' && (
                <div>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#fa114f]">
                      <HeartPulse className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">APPLE HEALTH BIOMETRICS</span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">Nhịp Tim & Điện Tâm Đồ (ECG)</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 mb-6">
                    <div>
                      <span className="text-xs text-neutral-500 font-medium">Nhịp tim thời gian thực</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-[#1d1d1f] font-mono tracking-tight">72</span>
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">BPM</span>
                      </div>
                    </div>
                    <div className="h-9 w-36">
                      <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#fa114f] fill-none stroke-[2.5] stroke-linecap-round stroke-linejoin-round">
                        <path d="M0 10 h20 l4 -7 l5 16 l5 -18 l5 12 l4 -3 h47" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Điện tâm đồ Sóng I trực tiếp:</strong> Chạm ngón tay vào núm xoay Digital Crown trong 30 giây để tạo kết quả ECG tương đương thiết bị y tế chuyển đạo đơn.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Phát hiện Rung Tâm Nhĩ (AFib):</strong> Tự động tầm soát nhịp tim ngầm và phát tín hiệu cảnh báo sớm các dấu hiệu rung nhĩ nguy hiểm.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Cảnh báo Bất Thường:</strong> Gửi thông báo rung xúc giác ngay khi nhịp tim vượt 120 BPM hoặc dưới 40 BPM trong lúc nghỉ ngơi.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                    <span>Chứng nhận y tế FDA & CE</span>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-semibold transition-colors text-xs cursor-pointer shadow-sm"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: SLEEP */}
              {activeModal === 'sleep' && (
                <div>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">THEO DÕI GIẤC NGỦ CHUYÊN SÂU</span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">Phân Tích Giấc Ngủ & Thân Nhiệt</h3>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-500 font-medium">Thời lượng ngủ ban đêm</span>
                      <span className="text-xl font-black text-[#1d1d1f] font-mono">7h 42m</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-200 rounded-full flex overflow-hidden mb-2">
                      <div className="h-full bg-indigo-400 w-[45%]" title="REM (1h48m)" />
                      <div className="h-full bg-indigo-600 w-[35%]" title="Ngủ Sâu (2h10m)" />
                      <div className="h-full bg-indigo-300 w-[20%]" title="Ngủ Nông (3h44m)" />
                    </div>
                    <div className="flex justify-between text-[10px] text-indigo-600 font-semibold px-0.5">
                      <span>REM (1h48m)</span>
                      <span>Ngủ Sâu (2h10m)</span>
                      <span>Ngủ Nông (3h44m)</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">3 Giai đoạn Ngủ Khoa học:</strong> Phân tích chi tiết chu kỳ REM (giấc mơ & trí nhớ), Ngủ Sâu (phục hồi thể chất), và Ngủ Nông.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Cảm biến Nhiệt độ Cổ tay:</strong> Đo lường biến động thân nhiệt mỗi 5 giây với độ chính xác 0.01°C, phát hiện chu kỳ sinh học và dấu hiệu mệt mỏi.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Rối loạn Hơi thở (Sleep Apnea):</strong> Tự động phát hiện các đợt gián đoạn hô hấp trong đêm để cảnh báo sớm ngưng thở khi ngủ.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                    <span>Tích hợp watchOS 11 & Apple Health</span>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-semibold transition-colors text-xs cursor-pointer shadow-sm"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: SpO2 */}
              {activeModal === 'spo2' && (
                <div>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">CÔNG NGHỆ QUANG HỌC 4 PHỔ</span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">Nồng Độ Oxy Máu (SpO₂) & Sinh Hiệu</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 mb-6">
                    <div>
                      <span className="text-xs text-neutral-500 font-medium">Nồng độ oxy bão hòa</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-[#1d1d1f] font-mono tracking-tight">98%</span>
                        <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">SpO₂</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-medium">Nhịp thở ban đêm</span>
                      <div className="text-lg font-bold text-cyan-700 font-mono mt-0.5">14 nhịp/phút</div>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Cụm Cảm biến Quang học 4 Phổ:</strong> Chiếu các chùm đèn LED xanh lá, đỏ và hồng ngoại vào các mạch máu ở cổ tay để tính toán chính xác tỷ lệ oxy hòa tan.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Ứng dụng Sinh Hiệu (Vitals App):</strong> Đối chiếu 5 chỉ số then chốt ban đêm để đưa ra đánh giá tổng quát về trạng thái thể lực mỗi sáng.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Cảnh báo Biến động:</strong> Tự động gửi thông báo khi có từ 2 chỉ số sinh hiệu vượt ra ngoài ngưỡng chuẩn thông thường.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                    <span>Đo đạc tự động liên tục 24/7</span>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-semibold transition-colors text-xs cursor-pointer shadow-sm"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: SAFETY */}
              {activeModal === 'safety' && (
                <div>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">HỆ THỐNG CỨU HỘ VỆ TINH 24/7</span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">Phát Hiện Va Chạm & Cứu Hộ SOS</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-6">
                    <div>
                      <span className="text-xs text-neutral-500 font-medium">Trạng thái cảm biến an toàn</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-[#1d1d1f] tracking-tight">24/7</span>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">BẢO VỆ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-medium">Cảm biến gia tốc</span>
                      <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">Lực tải 256G</div>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Phát hiện Va chạm Ô tô (Crash Detection):</strong> Cảm biến gia tốc lực cao 256G và con quay hồi chuyển 3 trục nhận diện tức thì va chạm trước, sau, bên hông và lật xe.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Phát hiện Té ngã (Fall Detection):</strong> Nhận biết cú ngã mạnh khi đi bộ, đạp xe, tự động đếm ngược và gọi cứu hộ nếu bạn bất động sau 1 phút.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p><strong className="text-[#1d1d1f]">Liên lạc Cứu hộ qua Vệ tinh:</strong> Gửi tọa độ GPS và hồ sơ y tế khẩn cấp (Medical ID) tới lực lượng cứu nạn ngay cả khi không có sóng di động hay Wi-Fi.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                    <span>Cứu mạng hàng nghìn người dùng</span>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-semibold transition-colors text-xs cursor-pointer shadow-sm"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
