import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Volume2,
  Heart,
  Radio,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { ULTRA3_HEALTH_SAFETY_DATA } from '../data/ultra3Data';

interface Ultra3HealthSafetyConnectivitySectionProps {
  onOpenSpecs?: () => void;
}

interface TimedCardSlide {
  id: string;
  num: string;
  category: string;
  location: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  desc: string;
  image: string;
  accentColor: string;
  accentGlow: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  metrics: { value: string; label: string }[];
}

interface ExpandingTransition {
  slide: TimedCardSlide;
  fromRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

const TIMED_SLIDES: TimedCardSlide[] = [
  {
    id: 'safety-siren',
    num: '01',
    category: 'CỨU HỘ & KHẨN CẤP',
    location: 'SWISS ALPS SUMMIT',
    titleLine1: 'CÒI BÁO ĐỘNG',
    titleLine2: 'SIREN 86DB',
    subtitle: 'TẦM VANG XA 180 MÉT • TỰ ĐỘNG LẶP LẠI 2 TẦN SỐ',
    desc: 'Kích hoạt nhanh chóng bằng cách giữ nút Tác Vụ màu cam. Còi phát ra chuỗi âm thanh 86dB độc quyền với 2 tần số cứu hộ chuẩn quốc tế, xuyên qua bão tuyết và sương mù dày đặc giúp đội tìm kiếm định vị bạn tức thì.',
    image: '/images/watch/ultra3-safety-siren.jpg',
    accentColor: '#f43f5e',
    accentGlow: 'rgba(244, 63, 94, 0.45)',
    icon: Volume2,
    metrics: [
      { value: '86 dB', label: 'CƯỜNG ĐỘ ÂM THANH' },
      { value: '180 M', label: 'BÁN KÍNH VANG XA' },
      { value: 'Dual-Tone', label: 'TẦN SỐ CỨU HỘ' },
    ],
  },
  {
    id: 'health-vitals',
    num: '02',
    category: 'SỨC KHỎE ĐỈNH CAO',
    location: 'HIMALAYAN RIDGE',
    titleLine1: 'ĐIỆN TÂM ĐỒ ECG',
    titleLine2: '& SPO2 ĐỘ CAO',
    subtitle: 'CHỈ SỐ THÍCH NGHI ĐỘ CAO • THEO DÕI TIM MẠCH',
    desc: 'Cảm biến quang học đo nồng độ oxy trong máu liên tục kết hợp ứng dụng ECG đo điện tâm đồ chỉ trong 30 giây. Cảnh báo sớm dấu hiệu thiếu oxy trên các đỉnh đèo cao nguyên trên 3.000m trước khi sốc độ cao ập đến.',
    image: '/images/watch/ultra3-health-vitals.jpg',
    accentColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    icon: Heart,
    metrics: [
      { value: 'SpO2 24/7', label: 'OXY MÁU ĐỘ CAO' },
      { value: '30 Giây', label: 'BẢN GHI ECG ĐẠO TRÌNH I' },
      { value: '5 Giây', label: 'LẤY MẪU THÂN NHIỆT' },
    ],
  },
  {
    id: 'satellite-connect',
    num: '03',
    category: 'KẾT NỐI ĐỘC LẬP',
    location: 'MOAB DESERT CANYONS',
    titleLine1: 'KẾT NỐI VỆ TINH',
    titleLine2: '& CELLULAR ESIM',
    subtitle: 'LIÊN LẠC TỰ DO KHÔNG CẦN MANG THEO IPHONE',
    desc: 'Trang bị ăng-ten GPS tần số kép L1 và L5 siêu nhạy, tích hợp mạng di động Cellular và tính năng gửi tọa độ vệ tinh khẩn cấp. Bạn có thể gọi điện, dẫn đường waypoints và giữ liên lạc an toàn giữa hoang mạc không có sóng viễn thông.',
    image: '/images/watch/ultra3-satellite-connect.jpg',
    accentColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    icon: Radio,
    metrics: [
      { value: 'L1 + L5', label: 'GPS TẦN SỐ KÉP' },
      { value: 'Cellular', label: 'MẠNG DI ĐỘNG ĐỘC LẬP' },
      { value: 'Waypoints', label: 'TỌA ĐỘ VỆ TINH' },
    ],
  },
  {
    id: 'crash-detection',
    num: '04',
    category: 'AN TOÀN CHỦ ĐỘNG',
    location: 'UTAH SLICKROCK CLIFFS',
    titleLine1: 'PHÁT HIỆN NGÃ',
    titleLine2: '& VA CHẠM MẠNH',
    subtitle: 'TỰ ĐỘNG GỌI CỨU TRỢ SOS KHI BẠN GẶP NẠN',
    desc: 'Cảm biến gia tốc lực cao nhận diện va chạm xe cộ hoặc té ngã nghiêm trọng trên địa hình hiểm trở. Nếu bạn bất động trong 60 giây, Ultra 3 sẽ tự động phát tín hiệu cấp cứu và gửi vị trí chính xác đến các số liên lạc khẩn cấp.',
    image: '/images/watch/ultra3-fall-detection.jpg',
    accentColor: '#ff6700',
    accentGlow: 'rgba(255, 103, 0, 0.45)',
    icon: ShieldAlert,
    metrics: [
      { value: '256 G', label: 'GIA TỐC KẾ LỰC CAO' },
      { value: '60 Giây', label: 'ĐẾM NGƯỢC CẤP CỨU' },
      { value: 'SOS Auto', label: 'GỬI TỌA ĐỘ TỰ ĐỘNG' },
    ],
  },
];

const SLIDE_DURATION = 6500; // 6.5s per slide
const TICK_MS = 50;

interface MotionSplitTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  staggerDelay?: number;
}

function MotionSplitText({
  text,
  className = '',
  style,
  delay = 0,
  staggerDelay = 0.05,
}: MotionSplitTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  if (shouldReduceMotion) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <span className={`inline ${className}`} style={style} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block whitespace-nowrap">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 220,
              bounce: 0,
              delay: delay + i * staggerDelay,
            }}
            className="inline-block"
            aria-hidden="true"
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

export function Ultra3HealthSafetyConnectivitySection({
  onOpenSpecs,
}: Ultra3HealthSafetyConnectivitySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [expandingTransition, setExpandingTransition] = useState<ExpandingTransition | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  const triggerExpandTransition = useCallback(
    (targetIndex: number, clickedElement?: HTMLElement | null) => {
      if (targetIndex === activeIndex) return;
      const targetSlide = TIMED_SLIDES[targetIndex];

      let fromRect = {
        top: 600,
        left: 800,
        width: 160,
        height: 225,
      };

      const sectionEl = sectionRef.current;
      const cardEl = clickedElement || cardRefs.current[targetSlide.id];

      if (sectionEl && cardEl) {
        const sRect = sectionEl.getBoundingClientRect();
        const cRect = cardEl.getBoundingClientRect();
        fromRect = {
          top: cRect.top - sRect.top,
          left: cRect.left - sRect.left,
          width: cRect.width,
          height: cRect.height,
        };
      }

      setExpandingTransition({
        slide: targetSlide,
        fromRect,
      });

      setActiveIndex(targetIndex);
      setProgress(0);
    },
    [activeIndex]
  );

  const handleNext = useCallback(() => {
    const nextIndex = (activeIndex + 1) % TIMED_SLIDES.length;
    const nextSlide = TIMED_SLIDES[nextIndex];
    const cardEl = cardRefs.current[nextSlide.id];
    triggerExpandTransition(nextIndex, cardEl);
  }, [activeIndex, triggerExpandTransition]);

  const handlePrev = useCallback(() => {
    const prevIndex = (activeIndex - 1 + TIMED_SLIDES.length) % TIMED_SLIDES.length;
    const prevSlide = TIMED_SLIDES[prevIndex];
    const cardEl = cardRefs.current[prevSlide.id];
    triggerExpandTransition(prevIndex, cardEl);
  }, [activeIndex, triggerExpandTransition]);

  const handleSelect = useCallback(
    (index: number, element?: HTMLElement | null) => {
      triggerExpandTransition(index, element);
    },
    [triggerExpandTransition]
  );

  // Timed Cards Progress Runner & Auto Advance
  useEffect(() => {
    if (isHovered || shouldReduceMotion) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_MS / SLIDE_DURATION) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isHovered, shouldReduceMotion, handleNext]);

  const currentSlide = TIMED_SLIDES[activeIndex];

  // The 3 upcoming cards in the queue (Giulio Cuscito "Timed Cards Opening" pattern)
  const queueSlides = [1, 2, 3].map((offset) => {
    const idx = (activeIndex + offset) % TIMED_SLIDES.length;
    return TIMED_SLIDES[idx];
  });

  return (
    <section
      ref={sectionRef}
      id={ULTRA3_HEALTH_SAFETY_DATA.sectionId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-screen flex flex-col justify-between bg-[#060507] text-white overflow-hidden scroll-mt-16 select-none font-['SF_Pro_Text','SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]"
    >
      {/* =========================================================================
          BASE FULL SECTION BACKGROUND: KEN BURNS ZOOM & FLUID CROSSFADE
          ========================================================================= */}
      {TIMED_SLIDES.map((slide, index) => {
        const isCurrent = index === activeIndex;

        return (
          <motion.div
            key={slide.id}
            initial={false}
            animate={{
              opacity: isCurrent ? 1 : 0,
              scale: isCurrent ? 1.04 : 1,
            }}
            transition={{
              opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 6.5, ease: 'easeOut' },
            }}
            className="absolute inset-0 w-full h-full pointer-events-none will-change-[transform,opacity] z-0"
          >
            <img
              src={slide.image}
              alt={slide.titleLine1}
              className="w-full h-full object-cover object-center filter brightness-95"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </motion.div>
        );
      })}

      {/* =========================================================================
          EXPANDING CARD TO FULL VIEW SECTION ANIMATION
          ========================================================================= */}
      <AnimatePresence>
        {expandingTransition && (
          <motion.div
            key={`expanding-${expandingTransition.slide.id}`}
            initial={{
              top: expandingTransition.fromRect.top,
              left: expandingTransition.fromRect.left,
              width: expandingTransition.fromRect.width,
              height: expandingTransition.fromRect.height,
              borderRadius: '24px',
              opacity: 1,
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
            }}
            animate={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '0px',
              opacity: 1,
              boxShadow: '0 0 0 rgba(0,0,0,0)',
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.2 : 0.75,
              ease: [0.16, 1, 0.3, 1], // Apple-grade cubic-bezier
            }}
            onAnimationComplete={() => {
              setExpandingTransition(null);
            }}
            className="absolute overflow-hidden pointer-events-none z-10 will-change-[top,left,width,height,border-radius]"
          >
            <img
              src={expandingTransition.slide.image}
              alt={expandingTransition.slide.titleLine1}
              className="w-full h-full object-cover object-center filter brightness-95"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Cinematic Vignette - Concentrated only at bottom for legibility, top and center remain open */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#020611]/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#060508]/80 to-transparent pointer-events-none" />

      {/* =========================================================================
          TOP INTEGRATED HEADER BAR (PINTEREST / DRIBBLE NAVIGATION STYLE)
          ========================================================================= */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        {/* Center Chapter Pills: Direct Click to Jump */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar max-w-[calc(100%-110px)] sm:max-w-none">
          {TIMED_SLIDES.map((slide, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-[-0.01em] uppercase transition-all duration-300 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {slide.category}
              </button>
            );
          })}
        </div>

        {/* Right Status Indicator (Autoplay / Paused) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold tracking-wide text-white/85 flex-shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isHovered ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span>{isHovered ? 'PAUSED' : 'AUTO-PLAY'}</span>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM REGION: NARRATIVE & CONTROLS (LEFT) + FLOATING CARDS QUEUE (RIGHT)
          ========================================================================= */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 mt-auto pb-6 sm:pb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-10">
        {/* Bottom-Left: Location, Headline, Description, Badges, Button & Controls */}
        <div className="w-full lg:max-w-lg text-left flex flex-col justify-end">
          {/* Location / Action Dash */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`loc-${currentSlide.id}`}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: 10 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 220,
                delay: expandingTransition ? 0.6 : 0.05,
              }}
              className="flex items-center gap-2 mb-1.5"
            >
              <span
                className="w-6 sm:w-8 h-[2px] rounded-full transition-colors duration-500"
                style={{ backgroundColor: currentSlide.accentColor }}
              />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {currentSlide.location} • {currentSlide.category}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Animated Headline & Content Reveal with Motion Split Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              className="flex flex-col"
            >
              {(() => {
                const textBaseDelay = expandingTransition ? 0.65 : 0.12;
                const title1Len = currentSlide.titleLine1.split(' ').length;
                const title2Len = currentSlide.titleLine2.split(' ').length;

                return (
                  <>
                    {/* Compact Headline - Apple SF Pro Display Font System */}
                    <h2 className="ultra-heading text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-bold sm:font-extrabold tracking-[-0.035em] text-white uppercase leading-[1.02] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] my-1.5">
                      <MotionSplitText
                        text={currentSlide.titleLine1}
                        delay={textBaseDelay}
                        staggerDelay={0.05}
                      />{' '}
                      <MotionSplitText
                        text={currentSlide.titleLine2}
                        style={{
                          color: currentSlide.accentColor,
                          textShadow: `0 0 25px ${currentSlide.accentGlow}`,
                        }}
                        delay={textBaseDelay + title1Len * 0.05}
                        staggerDelay={0.05}
                      />
                    </h2>

                    {/* Sub-headline - Apple SF Pro Text Font System */}
                    <p className="text-xs sm:text-[13px] font-semibold tracking-[-0.01em] text-white/85 uppercase mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      <MotionSplitText
                        text={currentSlide.subtitle}
                        delay={textBaseDelay + (title1Len + title2Len) * 0.05 + 0.06}
                        staggerDelay={0.025}
                      />
                    </p>

                    {/* Narrative Story Description - Apple SF Pro Text Font System */}
                    <p className="ultra-body text-[13px] sm:text-[14px] text-white/80 leading-[1.6] font-normal mt-2 max-w-lg tracking-[-0.012em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] line-clamp-2 sm:line-clamp-none">
                      <MotionSplitText
                        text={currentSlide.desc}
                        delay={textBaseDelay + (title1Len + title2Len) * 0.05 + 0.18}
                        staggerDelay={0.012}
                      />
                    </p>

                    {/* 3 Compact Telemetry Data Badges - Apple Tabular SF Pro Display Numbers */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 my-2.5">
                      {currentSlide.metrics.map((metric, mIdx) => (
                        <motion.div
                          key={metric.label}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 220,
                            bounce: 0,
                            delay:
                              textBaseDelay +
                              (title1Len + title2Len) * 0.05 +
                              0.32 +
                              mIdx * 0.08,
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/45 border border-white/10 backdrop-blur-md flex flex-col shadow-lg"
                        >
                          <span
                            className="text-xs sm:text-sm font-bold tracking-tight tabular-nums leading-none"
                            style={{ color: currentSlide.accentColor }}
                          >
                            {metric.value}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-white/70 font-semibold tracking-[0.05em] uppercase mt-0.5">
                            {metric.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Action Button & Navigation Controls in unified row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onOpenSpecs}
              className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-[-0.01em] uppercase text-black transition-all duration-300 hover:scale-105 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.8)] active:scale-95 flex-shrink-0"
              style={{ backgroundColor: currentSlide.accentColor }}
            >
              <currentSlide.icon className="w-3.5 h-3.5 text-black" />
              <span>XEM THÔNG SỐ</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-black transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>

            {/* Nav Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
                className="w-8 h-8 rounded-full bg-black/50 border border-white/20 hover:border-white/70 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
                className="w-8 h-8 rounded-full bg-black/50 border border-white/20 hover:border-white/70 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Timed Running Progress Bar */}
            <div className="w-24 sm:w-36 md:w-44 h-1 bg-white/20 rounded-full overflow-hidden relative flex-shrink-0">
              <div
                className="h-full rounded-full transition-all duration-75 ease-linear shadow-[0_0_8px_#ffffff]"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentSlide.accentColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right Floating Cards Queue: "Timed Cards Opening" */}
        <div className="flex items-end gap-2.5 sm:gap-3.5 overflow-x-auto sm:overflow-visible no-scrollbar max-w-full lg:max-w-none pt-2 lg:pt-0">
          {queueSlides.map((slide) => {
            const originalIndex = TIMED_SLIDES.findIndex((s) => s.id === slide.id);
            const IconComponent = slide.icon;

            return (
              <motion.div
                key={slide.id}
                ref={(el) => {
                  cardRefs.current[slide.id] = el;
                }}
                onClick={(e) => handleSelect(originalIndex, e.currentTarget)}
                whileHover={shouldReduceMotion ? undefined : { y: -8, scale: 1.03 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="group/card relative w-[115px] sm:w-[135px] md:w-[150px] lg:w-[160px] h-[165px] sm:h-[195px] md:h-[215px] lg:h-[225px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.85)] border border-white/20 hover:border-white/70 transition-all duration-300 flex-shrink-0 flex flex-col justify-between p-3 sm:p-3.5 select-none"
              >
                {/* Background Photo Thumbnail */}
                <img
                  src={slide.image}
                  alt={slide.titleLine1}
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 group-hover/card:scale-110 transition-transform duration-500 ease-out"
                  loading="lazy"
                />

                {/* Dark Vignettes for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Top Card Icon & Number - Apple Tabular SF Pro */}
                <div className="relative z-10 flex items-center justify-between">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center backdrop-blur-md shadow-md"
                    style={{
                      backgroundColor: `${slide.accentColor}33`,
                      borderColor: slide.accentColor,
                      borderWidth: '1px',
                    }}
                  >
                    <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: slide.accentColor }} />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums tracking-wide text-white/80 drop-shadow">
                    {slide.num}
                  </span>
                </div>

                {/* Bottom Card Title & Location */}
                <div className="relative z-10 flex flex-col text-left">
                  <span className="text-[8px] sm:text-[9px] font-medium text-white/70 uppercase tracking-[0.03em] mb-0.5 truncate drop-shadow">
                    {slide.location}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-[-0.02em] leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] group-hover/card:text-cyan-200 transition-colors line-clamp-2">
                    {slide.titleLine1} {slide.titleLine2}
                  </span>
                </div>

                {/* Ambient Card Border Glint */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/0 group-hover/card:border-white/50 pointer-events-none transition-colors duration-300" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
