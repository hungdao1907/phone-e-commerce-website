import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Gauge, Waves, Compass, ArrowDown, Thermometer, Timer, ShieldCheck } from 'lucide-react';
import { ULTRA3_OCEAN_DATA } from '../data/ultra3Data';

type MarineModeKey = 'diving' | 'tides' | 'compass';

interface MarineModeData {
  id: MarineModeKey;
  tabLabel: string;
  image: string;
  badge: string;
  milestoneValue: string;
  milestoneLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconAnimation: {
    animate: Record<string, any>;
    transition: Record<string, any>;
  };
  cards: {
    tag: string;
    title: string;
    desc: string;
  }[];
}

const MARINE_MODES: Record<MarineModeKey, MarineModeData> = {
  diving: {
    id: 'diving',
    tabLabel: '1. ĐO ĐỘ SÂU & LẶN OCEANIC+',
    image: '/images/watch/ultra3-ocean-underwater-abyss.jpg',
    badge: 'ĐẠT CHUẨN EN13319 • MÁY TÍNH LẶN OCEANIC+',
    milestoneValue: '40 M',
    milestoneLabel: 'ĐỘ SÂU LẶN GIẢI TRÍ TỐI ĐA',
    icon: Gauge,
    iconAnimation: {
      animate: { rotate: [-14, 14, -14] },
      transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
    },
    cards: [
      {
        tag: 'CẢM BIẾN ĐỘ SÂU',
        title: 'Tự Động Kích Hoạt Khi Chạm Nước',
        desc: 'Đo lường độ sâu hiện tại tới 40m với sai số chỉ ±1m, kèm tốc độ ngoi lên an toàn.',
      },
      {
        tag: 'NHIỆT ĐỘ NƯỚC',
        title: 'Cảm Biến Nhiệt Thời Gian Thực',
        desc: 'Cập nhật nhiệt độ đại dương liên tục để bạn điều chỉnh lớp đồ lặn (wetsuit) phù hợp.',
      },
      {
        tag: 'GIẢM ÁP BÜHLMANN',
        title: 'Thuật Toán Dive Computer Độc Quyền',
        desc: 'Tính toán thời gian không giảm áp (NDL) và cảnh báo dừng an toàn (Safety Stop) trực quan.',
      },
    ],
  },
  tides: {
    id: 'tides',
    tabLabel: '2. DỰ BÁO THỦY TRIỀU & SÓNG',
    image: '/images/watch/ultra3-ocean-tides.jpg',
    badge: 'DỰ BÁO 115.000 BỜ BIỂN • THỦY TRIỀU & SÓNG',
    milestoneValue: '100 M',
    milestoneLabel: 'CHỐNG NƯỚC TỐC ĐỘ CAO WR100',
    icon: Waves,
    iconAnimation: {
      animate: { y: [-2, 2, -2] },
      transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
    },
    cards: [
      {
        tag: 'DỮ LIỆU TOÀN CẦU',
        title: '115.000 Bờ Biển Trên Trái Đất',
        desc: 'Theo dõi chính xác mực nước dâng cao nhất, thấp nhất và hướng gió ven bờ 7 ngày tới.',
      },
      {
        tag: 'LƯỚT SÓNG & CHÈO SUP',
        title: 'Chống Nước Tốc Độ Cao 100M',
        desc: 'Chuẩn WR100 cho phép bạn tham gia các môn thể thao va đập nước mạnh không lo ngại.',
      },
      {
        tag: 'MẶT ĐỒNG HỒ OCEAN',
        title: 'Complication Thủy Triều Trực Quan',
        desc: 'Liếc nhanh cổ tay để biết thời điểm lý tưởng nhất trước khi bước xuống mép sóng.',
      },
    ],
  },
  compass: {
    id: 'compass',
    tabLabel: '3. TỌA ĐỘ HẢI TRÌNH & BACKTRACK',
    image: '/images/watch/ultra3-ocean-compass.jpg',
    badge: 'ĐỊNH VỊ HẢI TRÌNH • TÍNH NĂNG QUAY VỀ BACKTRACK',
    milestoneValue: 'GPS L1+L5',
    milestoneLabel: 'ĐỊNH VỊ VỆ TINH TRÊN BIỂN',
    icon: Compass,
    iconAnimation: {
      animate: { rotate: [0, 28, -18, 0] },
      transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
    },
    cards: [
      {
        tag: 'HẢI TRÌNH WAYPOINTS',
        title: 'Đánh Dấu Vị Trí Thuyền & Lặn',
        desc: 'Ghim tọa độ điểm neo tàu hoặc rạn san hô bằng Nút Tác Vụ để quay về chính xác.',
      },
      {
        tag: 'QUAY VỀ (BACKTRACK)',
        title: 'Ghi Lại Vết Đường Đi Trong Nền',
        desc: 'Dẫn đường bạn lội ngược lộ trình cũ ngay cả khi sương mù biển dày đặc che khuất tầm nhìn.',
      },
      {
        tag: 'KÍNH SAPPHIRE PHẲNG',
        title: 'Chống Quang Sai Dưới Nước',
        desc: 'Mặt kính phẳng giúp hiển thị sắc nét không méo góc nhìn qua kính lặn (diving mask).',
      },
    ],
  },
};

const MODE_KEYS: MarineModeKey[] = ['diving', 'tides', 'compass'];

interface Ultra3OceanDepthSectionProps {
  onOpenSpecs?: () => void;
}

export function Ultra3OceanDepthSection({ onOpenSpecs }: Ultra3OceanDepthSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeMarineMode, setActiveMarineMode] = useState<MarineModeKey>('diving');

  // Live Underwater Telemetry Simulation
  const [diveSeconds, setDiveSeconds] = useState<number>(28 * 60 + 45);
  const [currentDepth, setCurrentDepth] = useState<number>(38.4);

  useEffect(() => {
    // Tick dive timer every second
    const timerInterval = setInterval(() => {
      setDiveSeconds((prev) => prev + 1);
    }, 1000);

    // Subtle depth gauge oscillation simulating ocean surge (±0.1m)
    const depthInterval = setInterval(() => {
      setCurrentDepth((prev) => {
        const delta = (Math.random() - 0.5) * 0.15;
        const newDepth = 38.4 + delta;
        return Number(newDepth.toFixed(1));
      });
    }, 2500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(depthInterval);
    };
  }, []);

  const formatDiveTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const telemetryCards = [
    {
      label: 'DEPTH',
      value: `${currentDepth.toFixed(1)} M`,
      sub: '±0.1M CHÍNH XÁC',
      icon: ArrowDown,
      iconAnimation: { y: [-2, 3, -2] },
      transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' as const },
    },
    {
      label: 'WATER TEMP',
      value: '21°C',
      sub: 'CẢM BIẾN NHIỆT GEN 3',
      icon: Thermometer,
      iconAnimation: { scale: [1, 1.15, 1] },
      transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' as const },
    },
    {
      label: 'DIVE TIME',
      value: formatDiveTime(diveSeconds),
      sub: 'THỜI GIAN LẶN THỰC',
      icon: Timer,
      iconAnimation: { rotate: [0, 360] },
      transition: { repeat: Infinity, duration: 12, ease: 'linear' as const },
    },
    {
      label: 'MAX DEPTH',
      value: '40.0 M',
      sub: 'GIỚI HẠN AN TOÀN',
      icon: ShieldCheck,
      iconAnimation: { scale: [1, 1.08, 1] },
      transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' as const },
    },
  ];

  const currentMode = MARINE_MODES[activeMarineMode];

  return (
    <section
      id={ULTRA3_OCEAN_DATA.sectionId}
      className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#020611] text-white overflow-hidden scroll-mt-16 select-none font-['SF_Pro_Text','SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]"
    >
      {/* Background Ambience: Deep Oceanic Abyss with Bathymetric Contour Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/images/watch/ultra3-ocean-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-50 filter contrast-115 brightness-100"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#020611]/50 to-[#020611]/90" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08080a] via-[#08080a]/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0c0a0c] via-[#0c0a0c]/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <motion.span
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-3 block"
        >
          {ULTRA3_OCEAN_DATA.eyebrow}
        </motion.span>

        {/* Headline */}
        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="ultra-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 whitespace-pre-line text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
        >
          {ULTRA3_OCEAN_DATA.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="ultra-body text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-12 sm:mb-16 leading-relaxed font-normal"
        >
          {ULTRA3_OCEAN_DATA.subtitle}
        </motion.p>

        {/* =========================================================================
            MAJOR CENTRAL VISUAL: DYNAMIC VISUAL SHOWCASE CORRESPONDING TO ACTIVE TAB
            ========================================================================= */}
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden bg-[#030d1a] border border-cyan-500/20 shadow-[0_25px_60px_rgba(0,18,38,0.85)] mb-10 flex flex-col relative group">
          {/* Active Mode Image Container with Oceanic Hydro-Dive & Lens Refraction Transition */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[500px] overflow-hidden flex items-center justify-center bg-[#020914]">
            {/* Layered Preloaded Images with Smooth Ken Burns Scale & Opacity Glides */}
            {MODE_KEYS.map((key) => {
              const mode = MARINE_MODES[key];
              const isCurrent = activeMarineMode === key;

              return (
                <motion.div
                  key={key}
                  initial={false}
                  animate={
                    isCurrent
                      ? {
                          opacity: 1,
                          scale: 1,
                          zIndex: 10,
                        }
                      : {
                          opacity: 0,
                          scale: 1.07,
                          zIndex: 0,
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.65,
                          ease: [0.16, 1, 0.3, 1],
                        }
                  }
                  className="absolute inset-0 w-full h-full will-change-[transform,opacity] pointer-events-none"
                >
                  <img
                    src={mode.image}
                    alt={mode.tabLabel}
                    className="w-full h-full object-cover object-center filter brightness-95 select-none"
                    loading="eager"
                    decoding="async"
                  />

                  {/* Cinematic Ocean Depth Vignette & Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041224] via-transparent to-black/35 pointer-events-none" />
                  <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />
                </motion.div>
              );
            })}

            {/* Distinctive Water Wave Caustic Glint Sweep across image on switch */}
            {!shouldReduceMotion && (
              <motion.div
                key={`caustic-sweep-${activeMarineMode}`}
                initial={{ x: '-130%', opacity: 0.85 }}
                animate={{ x: '190%', opacity: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 w-3/4 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent skew-x-[-24deg] pointer-events-none z-20 mix-blend-screen"
              />
            )}

            {/* Distinctive Concentric Water Drop Ripple Pulse on switch */}
            {!shouldReduceMotion && (
              <motion.div
                key={`water-ripple-${activeMarineMode}`}
                initial={{ scale: 0.3, opacity: 0.8, borderWidth: 3 }}
                animate={{ scale: 2.5, opacity: 0, borderWidth: 1 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 m-auto w-48 h-48 rounded-full border-cyan-400/60 pointer-events-none z-20"
              />
            )}

            {/* Live Top Status Badge with Smooth Pop & Fade */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 overflow-hidden pointer-events-none select-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={currentMode.badge}
                  initial={shouldReduceMotion ? false : { y: -18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { y: 18, opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/30 text-xs font-semibold text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                  <span className="tracking-wide">{currentMode.badge}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dynamic Milestone Typography with Apple Odometer Roll */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 text-right overflow-hidden pointer-events-none select-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={currentMode.milestoneValue}
                  initial={shouldReduceMotion ? false : { y: 26, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { y: -26, opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-transparent"
                >
                  <div className="ultra-heading text-3xl sm:text-5xl font-black text-cyan-300 tracking-tighter leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">
                    {currentMode.milestoneValue}
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-white uppercase tracking-widest mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {currentMode.milestoneLabel}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Marine Exploration Mode Navigation Tabs */}
          <div className="p-4 sm:p-6 bg-[#041224] border-t border-cyan-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {MODE_KEYS.map((key) => {
                const mode = MARINE_MODES[key];
                const isActive = activeMarineMode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveMarineMode(key)}
                    className={`relative px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer overflow-hidden select-none flex items-center gap-2 ${
                      isActive
                        ? 'text-cyan-950 font-bold'
                        : 'bg-white/5 text-white/85 hover:bg-cyan-950/40 hover:text-white border border-white/10 hover:border-cyan-400/40'
                    }`}
                  >
                    {/* Ocean Wave Liquid Fill using layoutId for smooth gliding with GPU animations */}
                    {isActive && (
                      <motion.div
                        layoutId="activeMarineWavePill"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 500, damping: 35 }
                        }
                        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none shadow-[0_0_25px_rgba(34,211,238,0.45)]"
                      >
                        {/* Base Ocean Cyan Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-300" />

                        {/* Undulating Ocean Wave Layer 1 (CSS GPU-accelerated) */}
                        <div className="absolute -top-2.5 left-0 w-[200%] h-[160%] opacity-40 pointer-events-none animate-ocean-wave-slow">
                          <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                            <path
                              d="M 0 25 Q 100 8 200 25 T 400 25 T 600 25 T 800 25 L 800 60 L 0 60 Z"
                              fill="#0369a1"
                            />
                          </svg>
                        </div>

                        {/* Undulating Ocean Wave Layer 2 (CSS GPU-accelerated) */}
                        <div className="absolute -top-3 left-0 w-[200%] h-[160%] opacity-30 pointer-events-none animate-ocean-wave-fast">
                          <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                            <path
                              d="M 0 20 Q 100 35 200 20 T 400 20 T 600 20 T 800 20 L 800 60 L 0 60 Z"
                              fill="#ffffff"
                            />
                          </svg>
                        </div>

                        {/* Water halo ring */}
                        <div className="absolute inset-0 rounded-full border border-cyan-400/80 pointer-events-none" />
                      </motion.div>
                    )}

                    {/* Button Content with Animated Distinct Icon */}
                    <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
                      <motion.div
                        animate={
                          isActive && !shouldReduceMotion
                            ? mode.iconAnimation.animate
                            : {}
                        }
                        transition={mode.iconAnimation.transition}
                        className="flex items-center justify-center flex-shrink-0"
                      >
                        <mode.icon
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isActive ? 'text-cyan-950' : 'text-cyan-400/80 group-hover:text-cyan-300'
                          }`}
                        />
                      </motion.div>
                      <span>{mode.tabLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Content Panel based on Tab with Staggered Cascading Reveals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              {currentMode.cards.map((card, idx) => (
                <motion.div
                  key={`${activeMarineMode}-${idx}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-950/45 transition-colors"
                >
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                    {card.tag}
                  </span>
                  <div className="text-sm sm:text-base font-bold text-white mb-1">
                    {card.title}
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Oceanic Telemetry Badges with Enhanced Live Animations */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          {telemetryCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * idx }}
                whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.025 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="group relative p-4 sm:p-5 rounded-2xl bg-transparent border border-cyan-500/25 hover:border-cyan-400/80 text-center transition-all duration-300 overflow-hidden cursor-pointer select-none flex flex-col items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] animate-hydro-card"
                style={{ animationDelay: `${idx * 0.75}s` }}
              >
                {/* Tactical Reticle Corners (Apple Watch Ultra Dive Computer Aesthetics) */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyan-400/40 group-hover:border-cyan-300 group-hover:w-2.5 group-hover:h-2.5 transition-all duration-300 pointer-events-none" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyan-400/40 group-hover:border-cyan-300 group-hover:w-2.5 group-hover:h-2.5 transition-all duration-300 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyan-400/40 group-hover:border-cyan-300 group-hover:w-2.5 group-hover:h-2.5 transition-all duration-300 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyan-400/40 group-hover:border-cyan-300 group-hover:w-2.5 group-hover:h-2.5 transition-all duration-300 pointer-events-none" />

                {/* Animated Hydro Caustic Light Sweep across transparent glass */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className="absolute -inset-full w-[300%] h-[300%] bg-gradient-to-r from-transparent via-cyan-400/[0.08] to-transparent animate-caustic-sheen pointer-events-none"
                    style={{ animationDelay: `${idx * 0.8}s` }}
                  />
                </div>

                {/* Ambient Hydro Bloom on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Top Subtle Accent Waterline that illuminates on hover */}
                <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent group-hover:via-cyan-300/80 transition-all duration-300" />

                {/* Card Header: Animated Micro Icon & Luminescent White Label */}
                <div className="relative z-10 flex items-center justify-center gap-1.5 mb-1.5">
                  <motion.div
                    animate={shouldReduceMotion ? undefined : card.iconAnimation}
                    transition={card.transition}
                    className="flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 transition-colors"
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </motion.div>
                  <span className="text-xs font-semibold text-luminescent-white text-white uppercase tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                    {card.label}
                  </span>
                </div>

                {/* Dynamic Telemetry Value */}
                <div className="relative z-10 ultra-heading text-2xl sm:text-3xl font-bold text-cyan-300 tracking-tight tabular-nums transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)] my-0.5">
                  {card.value}
                </div>

                {/* Mini Live Telemetry Graphic Indicator */}
                <div className="relative z-10 w-full max-w-[140px] my-1 px-1">
                  {idx === 0 && (
                    /* DEPTH Graphic Bar: Live water level fill (96% of 40m) */
                    <div className="w-full h-1 bg-cyan-950/60 rounded-full overflow-hidden relative border border-cyan-500/20">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee]"
                        animate={{ width: [`${(currentDepth / 40) * 100}%`, `${((currentDepth + 0.1) / 40) * 100}%`, `${(currentDepth / 40) * 100}%`] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}

                  {idx === 1 && (
                    /* WATER TEMP Graphic Bar: Ocean thermocline gradient */
                    <div className="w-full h-1 bg-cyan-950/60 rounded-full overflow-hidden relative border border-cyan-500/20">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 rounded-full shadow-[0_0_8px_#38bdf8]"
                        animate={{ opacity: [0.75, 1, 0.75], width: ['68%', '72%', '68%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}

                  {idx === 2 && (
                    /* DIVE TIME Graphic Bar: Live 60s chronometer cycle */
                    <div className="w-full h-1 bg-cyan-950/60 rounded-full overflow-hidden relative border border-cyan-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 rounded-full shadow-[0_0_8px_#22d3ee] transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.max(6, ((diveSeconds % 60) / 60) * 100)}%` }}
                      />
                    </div>
                  )}

                  {idx === 3 && (
                    /* MAX DEPTH Graphic Bar: Safety ceiling limit lock */
                    <div className="w-full h-1 bg-cyan-950/60 rounded-full overflow-hidden relative border border-cyan-500/20">
                      <motion.div
                        className="h-full w-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </div>

                {/* Live Indicator Subtitle with Expanding Sonar Ping Ring */}
                <div className="relative z-10 mt-1 flex items-center justify-center gap-1.5">
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute w-2 h-2 rounded-full bg-cyan-400 opacity-75 animate-sonar-ring" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_6px_#22d3ee]" />
                  </div>
                  <span className="text-[10px] font-medium text-white/75 tracking-wider uppercase">
                    {card.sub}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
