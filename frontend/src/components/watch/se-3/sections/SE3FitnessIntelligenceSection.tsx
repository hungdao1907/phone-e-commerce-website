import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Activity,
  Phone,
  PhoneCall,
  MessageSquare,
  Timer,
  Check,
  ArrowRight,
  RotateCcw,
  Zap,
  Layers,
  Music,
} from 'lucide-react';
import { SE3_FITNESS_INTELLIGENCE_DATA } from '../../../../data/watch/se-3/data/se3Data';

interface SE3FitnessIntelligenceSectionProps {
  onOpenSpecs?: () => void;
}

export function SE3FitnessIntelligenceSection({ onOpenSpecs }: SE3FitnessIntelligenceSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const desktopContainerRef = useRef<HTMLDivElement>(null);

  // Micro-story states
  const [isCallAnswered, setIsCallAnswered] = useState<boolean>(false);
  const [isNotificationDismissed, setIsNotificationDismissed] = useState<boolean>(false);
  const [activeGestureTab, setActiveGestureTab] = useState<'double-tap' | 'wrist-flick'>('double-tap');

  // Scroll mapping for desktop sticky storytelling (0.0 to 1.0)
  const { scrollYProgress } = useScroll({
    target: desktopContainerRef,
    offset: ['start start', 'end end'],
  });

  // =========================================================================
  // SCENE 0: INTRO HEADLINE (Visible at 0.00 -> 0.18, then fades out)
  // =========================================================================
  const introOpacity = useTransform(scrollYProgress, [0, 0.09, 0.14], [1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.14], [0, -30]);

  // =========================================================================
  // SCENE 1: WORKOUT TELEMETRY (Emerges in open space at 0.18 -> 0.40)
  // =========================================================================
  const workoutSectionOpacity = useTransform(scrollYProgress, [0.20, 0.27, 0.38, 0.44], [0, 1, 1, 0]);

  // Metric 1: Distance (0.22 -> 0.28)
  const distOpacity = useTransform(scrollYProgress, [0.22, 0.28], [0, 1]);
  const distY = useTransform(scrollYProgress, [0.22, 0.28], [30, 0]);

  // Metric 2: Pace (0.26 -> 0.32)
  const paceOpacity = useTransform(scrollYProgress, [0.26, 0.32], [0, 1]);
  const paceY = useTransform(scrollYProgress, [0.26, 0.32], [30, 0]);

  // Metric 3: Heart Rate (0.29 -> 0.35)
  const heartOpacity = useTransform(scrollYProgress, [0.29, 0.35], [0, 1]);
  const heartY = useTransform(scrollYProgress, [0.29, 0.35], [30, 0]);

  // Metric 4: Time (0.32 -> 0.38)
  const timeOpacity = useTransform(scrollYProgress, [0.32, 0.38], [0, 1]);
  const timeY = useTransform(scrollYProgress, [0.32, 0.38], [30, 0]);

  // Runner background scaling & blur transition into Scene 2
  const runnerScale = useTransform(scrollYProgress, [0, 0.40], [1, 1.08]);
  const runnerBlur = useTransform(scrollYProgress, [0.34, 0.41], ['blur(0px)', 'blur(20px)']);
  const runnerOpacity = useTransform(scrollYProgress, [0.34, 0.42], [1, 0]);

  // =========================================================================
  // SCENE 2: ACTIVITY RINGS (Visible at 0.42 -> 0.70)
  // =========================================================================
  const p2Opacity = useTransform(scrollYProgress, [0.42, 0.48, 0.66, 0.72], [0, 1, 1, 0]);
  const p2Scale = useTransform(scrollYProgress, [0.42, 0.5, 0.68], [0.92, 1, 1.02]);

  // Rings SVG progress mappings (circ: 2 * PI * r)
  // Move: r = 95 -> circ = 596.9 | 42% -> 87%
  const moveCirc = 2 * Math.PI * 95;
  const moveProgress = useTransform(scrollYProgress, [0.46, 0.64], [0.42, 0.87]);
  const moveOffset = useTransform(moveProgress, (v) => moveCirc * (1 - v));

  // Exercise: r = 74 -> circ = 464.9 | 38% -> 76%
  const exerciseCirc = 2 * Math.PI * 74;
  const exerciseProgress = useTransform(scrollYProgress, [0.48, 0.65], [0.38, 0.76]);
  const exerciseOffset = useTransform(exerciseProgress, (v) => exerciseCirc * (1 - v));

  // Stand: r = 53 -> circ = 333.0 | 65% -> 92%
  const standCirc = 2 * Math.PI * 53;
  const standProgress = useTransform(scrollYProgress, [0.5, 0.66], [0.65, 0.92]);
  const standOffset = useTransform(standProgress, (v) => standCirc * (1 - v));

  // =========================================================================
  // SCENE 3: EVERYDAY INTELLIGENCE (Visible at 0.70 -> 1.00)
  // =========================================================================
  const p3Opacity = useTransform(scrollYProgress, [0.69, 0.76, 0.98], [0, 1, 1]);
  const p3Y = useTransform(scrollYProgress, [0.69, 0.76], [40, 0]);

  // Quick Chapter Navigation Helper
  const handleScrollToChapter = (chapterIndex: number) => {
    if (!desktopContainerRef.current) return;
    const totalHeight = desktopContainerRef.current.offsetHeight - window.innerHeight;
    let targetRatio = 0.05;
    if (chapterIndex === 2) targetRatio = 0.54;
    if (chapterIndex === 3) targetRatio = 0.88;

    const topOffset = desktopContainerRef.current.offsetTop + totalHeight * targetRatio;
    window.scrollTo({ top: topOffset, behavior: 'smooth' });
  };

  const handleTriggerDoubleTap = () => {
    setIsCallAnswered((prev) => !prev);
  };

  const handleDismissNotification = () => {
    setIsNotificationDismissed(true);
  };

  const handleRestoreNotification = () => {
    setIsNotificationDismissed(false);
  };

  const { intro, workout, rings, everyday } = SE3_FITNESS_INTELLIGENCE_DATA;

  return (
    <section id="se3-fitness" className="relative w-full se3-fitness-bg text-white select-none scroll-mt-16">
      {/* =========================================================================
          DESKTOP & TABLET STICKY STORYTELLING TRACK (~380vh)
          ========================================================================= */}
      <div ref={desktopContainerRef} className="hidden md:block relative h-[380vh]">
        {/* Sticky 100vh Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between p-6 sm:p-10 z-10 isolate">
          {/* Top Bar: Section Eyebrow & Chapter Jump Pills */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 z-40 pt-2">
            <div className="flex items-center gap-3">
              <span className="se3-eyebrow text-xs font-bold tracking-[0.16em] text-white/80 uppercase">
                {intro.eyebrow}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-xs text-white/60 font-medium">Apple Watch SE 3</span>
            </div>

            {/* Quick Navigation Pills */}
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-lg">
              <button
                type="button"
                onClick={() => handleScrollToChapter(1)}
                className="px-3.5 py-1 rounded-full text-xs font-bold transition-all text-white hover:bg-white/15 cursor-pointer"
              >
                01 Tập luyện
              </button>
              <button
                type="button"
                onClick={() => handleScrollToChapter(2)}
                className="px-3.5 py-1 rounded-full text-xs font-bold transition-all text-white hover:bg-white/15 cursor-pointer"
              >
                02 Hoạt động
              </button>
              <button
                type="button"
                onClick={() => handleScrollToChapter(3)}
                className="px-3.5 py-1 rounded-full text-xs font-bold transition-all text-white hover:bg-white/15 cursor-pointer"
              >
                03 Thông minh mỗi ngày
              </button>
            </div>
          </div>

          {/* =====================================================================
              BACKGROUND RUNNER VISUAL (Clean, Tailored Gradients)
              ===================================================================== */}
          <motion.div
            style={{
              opacity: runnerOpacity,
              scale: runnerScale,
              filter: runnerBlur,
            }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <img
              src={intro.bgImage}
              alt="Apple Watch SE 3 Running Lifestyle"
              className="w-full h-full object-cover object-center"
            />
            {/* Tailored Gradients: Dark on left and bottom for text, center/watch is bright */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent pointer-events-none" />
          </motion.div>

          {/* =====================================================================
              SCENE 0: INTRO OPENING (Visible at 0% - 18%, NO CARDS)
              ===================================================================== */}
          <motion.div
            style={{ opacity: introOpacity, y: introY }}
            className="absolute inset-0 flex items-center z-10 pointer-events-none px-6 sm:px-12 lg:px-20"
          >
            <div className="max-w-xl w-full text-left">
              {/* Subtle Eyebrow */}
              <span className="se3-eyebrow text-xs sm:text-sm font-bold tracking-[0.16em] text-white/90 mb-3 block uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {intro.eyebrow}
              </span>

              {/* Headline: Exactly 2 Balanced Lines */}
              <h2 className="se3-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-xl">
                <span>{intro.titleLine1}</span>
                <br />
                <span>{intro.titleLine2}</span>
              </h2>

              {/* Subtitle */}
              <p className="se3-body text-sm sm:text-base text-white/90 font-normal max-w-md leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                {intro.description}
              </p>
            </div>
          </motion.div>

          {/* =====================================================================
              SCENE 1: LIVE WORKOUT TELEMETRY (Floats into frame on scroll 18% - 40%)
              ===================================================================== */}
          <motion.div
            style={{ opacity: workoutSectionOpacity }}
            className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end pb-24 sm:pb-28 px-6 sm:px-12 lg:px-20"
          >
            {/* Full dark cover so intro text cannot bleed through */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 pointer-events-none" />
            <div className="max-w-7xl mx-auto w-full">
              {/* Telemetry Section Subhead */}
              <div className="mb-6 max-w-md">
                <span className="se3-eyebrow text-xs font-bold tracking-widest text-sky-400 block mb-1 uppercase">
                  {workout.eyebrow}
                </span>
                <div className="se3-heading text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                  Apple Watch đang đọc buổi tập theo thời gian thực.
                </div>
              </div>

              {/* 4 Organic Floating HUD Telemetry Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. Distance */}
                <motion.div
                  style={{ opacity: distOpacity, y: distY }}
                  className="se3-telemetry-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-1">
                    <span>QUÃNG ĐƯỜNG</span>
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="se3-heading text-3xl sm:text-4xl font-black text-white se3-tabular leading-none mb-1">
                    {workout.telemetry[0].value}{' '}
                    <span className="text-sm font-bold text-white/70">{workout.telemetry[0].unit}</span>
                  </div>
                  <div className="text-[11px] text-white/60 font-medium">GPS tần số cao</div>
                </motion.div>

                {/* 2. Pace */}
                <motion.div
                  style={{ opacity: paceOpacity, y: paceY }}
                  className="se3-telemetry-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>PACE TRUNG BÌNH</span>
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="se3-heading text-3xl sm:text-4xl font-black text-white se3-tabular leading-none mb-1">
                    {workout.telemetry[1].value}
                    <span className="text-sm font-bold text-white/70"> {workout.telemetry[1].unit}</span>
                  </div>
                  <div className="text-[11px] text-white/60 font-medium">Đo nhịp sải chân</div>
                </motion.div>

                {/* 3. Heart Rate (Live Pulse) */}
                <motion.div
                  style={{ opacity: heartOpacity, y: heartY }}
                  className="se3-telemetry-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between border-red-500/30"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
                    <span>NHỊP TIM</span>
                    <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  </div>
                  <div className="se3-heading text-3xl sm:text-4xl font-black text-white se3-tabular leading-none mb-1 flex items-baseline gap-1">
                    <span>{workout.telemetry[2].value}</span>
                    <span className="text-sm font-bold text-white/70">{workout.telemetry[2].unit}</span>
                  </div>
                  <div className="text-[11px] text-red-300 font-medium">Vùng tim hiếu khí</div>
                </motion.div>

                {/* 4. Active Time */}
                <motion.div
                  style={{ opacity: timeOpacity, y: timeY }}
                  className="se3-telemetry-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                    <span>THỜI GIAN VẬN ĐỘNG</span>
                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="se3-heading text-3xl sm:text-4xl font-black text-white se3-tabular leading-none mb-1">
                    {workout.telemetry[3].value}
                    <span className="text-sm font-bold text-white/70"> {workout.telemetry[3].unit}</span>
                  </div>
                  <div className="text-[11px] text-white/60 font-medium">Tiêu thụ 340 kcal</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* =====================================================================
              SCENE 2: ACTIVITY RINGS HERO (Large Visual Center, Scroll 42% - 70%)
              ===================================================================== */}
          <motion.div
            style={{ opacity: p2Opacity, scale: p2Scale }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black px-6 sm:px-12 lg:px-20"
          >
            {/* Ambient Multi-Ring Glow */}
            <div className="absolute w-[550px] h-[550px] rounded-full bg-gradient-to-br from-red-600/15 via-emerald-600/15 to-cyan-600/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
              {/* Left: Narrative & Progress Bar Badges */}
              <div className="flex flex-col items-start text-left">
                <span className="se3-eyebrow text-xs font-bold tracking-widest text-emerald-400 mb-2 block uppercase">
                  {rings.eyebrow}
                </span>
                <h3 className="se3-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] mb-3">
                  <span>{rings.headlineLine1}</span>
                  <br />
                  <span className="bg-gradient-to-r from-red-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    {rings.headlineLine2}
                  </span>
                </h3>
                <p className="se3-body text-sm sm:text-base text-white/80 font-normal mb-8 max-w-md leading-relaxed">
                  {rings.description}
                </p>

                {/* Progress Indicators without heavy cards */}
                <div className="flex flex-col gap-3 w-full max-w-md">
                  {rings.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="se3-heading text-sm font-bold text-white">{item.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="se3-heading text-lg font-black text-white se3-tabular">
                          {item.currentValue}
                        </span>
                        <span className="text-xs text-white/60 font-semibold">
                          / {item.targetValue} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Massive Glowing SVG Activity Rings */}
              <div className="flex items-center justify-center relative">
                <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                    {/* Move Ring (Red) */}
                    <circle cx="120" cy="120" r="95" stroke="rgba(250, 17, 79, 0.18)" strokeWidth="15" fill="transparent" />
                    <motion.circle
                      cx="120"
                      cy="120"
                      r="95"
                      stroke="#fa114f"
                      strokeWidth="15"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={moveCirc}
                      style={{ strokeDashoffset: moveOffset }}
                      className="se3-ring-shadow-move"
                    />

                    {/* Exercise Ring (Green) */}
                    <circle cx="120" cy="120" r="74" stroke="rgba(161, 255, 0, 0.18)" strokeWidth="15" fill="transparent" />
                    <motion.circle
                      cx="120"
                      cy="120"
                      r="74"
                      stroke="#a1ff00"
                      strokeWidth="15"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={exerciseCirc}
                      style={{ strokeDashoffset: exerciseOffset }}
                      className="se3-ring-shadow-exercise"
                    />

                    {/* Stand Ring (Cyan) */}
                    <circle cx="120" cy="120" r="53" stroke="rgba(0, 240, 255, 0.18)" strokeWidth="15" fill="transparent" />
                    <motion.circle
                      cx="120"
                      cy="120"
                      r="53"
                      stroke="#00f0ff"
                      strokeWidth="15"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={standCirc}
                      style={{ strokeDashoffset: standOffset }}
                      className="se3-ring-shadow-stand"
                    />
                  </svg>

                  {/* Centered Activity Flame */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Activity className="w-8 h-8 text-white/90 mb-1" />
                    <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">
                      ACTIVITY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =====================================================================
              SCENE 3: EVERYDAY INTELLIGENCE (Scroll 70% - 100%)
              ===================================================================== */}
          <motion.div
            style={{ opacity: p3Opacity, y: p3Y }}
            className="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center bg-black px-6 sm:px-12 lg:px-20"
          >
            {/* Subtle Blue Glow */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column (5 Cols): Realistic Apple Watch Screen & Gesture Simulator */}
              <div className="lg:col-span-5 flex flex-col items-center">
                {/* Watch Chassis */}
                <div className="relative w-[280px] sm:w-[310px] aspect-[4/5] rounded-[48px] p-4 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black border-[3px] border-neutral-700/80 shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
                  {/* Digital Crown & Side Button */}
                  <div className="absolute -right-2 top-20 w-2 h-14 rounded-r-md bg-neutral-600" />
                  <div className="absolute -right-1.5 top-40 w-1.5 h-10 rounded-r-sm bg-neutral-700" />

                  {/* Watch OLED Screen Glass */}
                  <div className="w-full h-full rounded-[38px] se3-watch-screen-glass p-5 flex flex-col justify-between overflow-hidden relative text-center">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-[11px] text-white/70 font-semibold px-1">
                      <span>10:09</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>LTE</span>
                      </span>
                    </div>

                    {/* Interactive Demo Content */}
                    {activeGestureTab === 'double-tap' ? (
                      /* Double Tap Demo */
                      <div className="my-auto flex flex-col items-center">
                        <div className="relative mb-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                            {isCallAnswered ? (
                              <PhoneCall className="w-8 h-8 text-white" />
                            ) : (
                              <Phone className="w-8 h-8 text-white animate-bounce" />
                            )}
                          </div>
                          {/* Tactile Wave Simulation */}
                          <div className="absolute inset-0 rounded-full border-2 border-white/60 se3-tap-wave" />
                        </div>

                        <div className="se3-heading text-lg font-black text-white tracking-tight mb-0.5">
                          {everyday.incomingCaller}
                        </div>
                        <div className="text-xs text-white/70 font-medium mb-3">
                          {isCallAnswered ? (
                            <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              {everyday.connectedText}
                            </span>
                          ) : (
                            everyday.callerPhone
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={handleTriggerDoubleTap}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                            isCallAnswered
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {isCallAnswered ? 'Kết thúc cuộc gọi' : 'Thử Chạm Hai Lần (Nghe máy)'}
                        </button>
                      </div>
                    ) : (
                      /* Wrist Flick Demo */
                      <div className="my-auto flex flex-col items-center w-full px-1">
                        <AnimatePresence mode="wait">
                          {!isNotificationDismissed ? (
                            <motion.div
                              key="notif"
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, x: 50 }}
                              transition={{ duration: 0.3 }}
                              className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-left"
                            >
                              <div className="flex items-center gap-2 mb-1.5 text-xs text-sky-400 font-bold">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>MESSENGER</span>
                              </div>
                              <div className="se3-heading text-xs font-black text-white mb-0.5">
                                Bạn có một tin nhắn mới
                              </div>
                              <div className="text-[11px] text-white/70 mb-3">
                                &quot;Hẹn gặp tại công viên lúc 17h nhé!&quot;
                              </div>
                              <button
                                type="button"
                                onClick={handleDismissNotification}
                                className="w-full py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Lắc cổ tay (Dọn thông báo)
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="dismissed"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="py-6 flex flex-col items-center text-center"
                            >
                              <Check className="w-8 h-8 text-emerald-400 mb-2" />
                              <div className="se3-heading text-xs font-bold text-white mb-2">
                                Đã dọn thông báo
                              </div>
                              <button
                                type="button"
                                onClick={handleRestoreNotification}
                                className="inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Thử lại thông báo</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Bottom Helper */}
                    <div className="text-[10px] text-white/50 font-medium pb-1">
                      Double Tap • Wrist Flick
                    </div>
                  </div>
                </div>

                {/* Gesture Switcher */}
                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setActiveGestureTab('double-tap')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeGestureTab === 'double-tap'
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Double Tap
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGestureTab('wrist-flick')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeGestureTab === 'wrist-flick'
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Wrist Flick
                  </button>
                </div>
              </div>

              {/* Right Column (7 Cols): Narrative & Smart Apps */}
              <div className="lg:col-span-7 flex flex-col items-start text-left lg:pl-6">
                <span className="se3-eyebrow text-xs font-bold tracking-widest text-sky-400 mb-2 block uppercase">
                  {everyday.eyebrow}
                </span>
                <h3 className="se3-heading text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.12] mb-3">
                  <span>{everyday.headlineLine1}</span>
                  <br />
                  <span className="bg-gradient-to-r from-sky-400 via-blue-200 to-white bg-clip-text text-transparent">
                    {everyday.headlineLine2}
                  </span>
                </h3>
                <p className="se3-body text-sm sm:text-base text-white/80 font-normal mb-8 max-w-lg leading-relaxed">
                  {everyday.description}
                </p>

                {/* Quick App Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg mb-8">
                  {everyday.quickApps.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <div
                        key={app.id}
                        className="se3-quick-app-pill p-3.5 rounded-2xl flex items-center gap-3 cursor-default"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white">
                          <AppIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="se3-heading text-xs sm:text-sm font-bold text-white">
                            {app.label}
                          </span>
                          <span className="text-[11px] text-white/60 font-medium">{app.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onOpenSpecs}
                  className="se3-btn-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Xem thông số kỹ thuật Apple Watch SE 3</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bottom Indicators */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-xs text-white/50 font-medium z-40 pb-2">
            <span className="flex items-center gap-1.5">
              <span>3 trải nghiệm. Cuộn để khám phá</span>
              <span className="animate-bounce">↓</span>
            </span>
            <span>Apple Watch SE 3</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE RESPONSIVE VIEW (< 768px, Natural Flow)
          ========================================================================= */}
      <div className="block md:hidden w-full px-4 py-16 max-w-lg mx-auto space-y-16">
        {/* Intro */}
        <div className="text-left">
          <span className="se3-eyebrow text-xs font-bold tracking-widest text-sky-400 mb-2 block uppercase">
            {intro.eyebrow}
          </span>
          <h2 className="se3-heading text-3xl font-black text-white tracking-tight leading-tight mb-3">
            <span>{intro.titleLine1}</span>
            <br />
            <span>{intro.titleLine2}</span>
          </h2>
          <p className="se3-body text-xs text-white/80 font-normal leading-relaxed">
            {intro.description}
          </p>
        </div>

        {/* Scene 1 Mobile: Workout Visual + Floating Telemetry */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          <div className="aspect-[4/3] relative">
            <img src={intro.bgImage} alt="Running Workout" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/15 uppercase">
                {workout.eyebrow}
              </span>
            </div>
            {/* Live Telemetry Floats on bottom */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
              {workout.telemetry.map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15">
                  <div className="text-[9px] font-bold tracking-wider text-white/60 uppercase">
                    {t.sub}
                  </div>
                  <div className="se3-heading text-lg font-black text-white se3-tabular leading-tight">
                    {t.value} <span className="text-[10px] font-normal text-white/60">{t.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scene 2 Mobile: Activity Rings */}
        <div className="flex flex-col items-center text-center">
          <span className="se3-eyebrow text-xs font-bold tracking-widest text-emerald-400 mb-2 block uppercase">
            {rings.eyebrow}
          </span>
          <h3 className="se3-heading text-2xl font-black text-white mb-2 leading-tight">
            <span>{rings.headlineLine1}</span>
            <br />
            <span>{rings.headlineLine2}</span>
          </h3>
          <p className="se3-body text-xs text-white/70 mb-6 max-w-xs">{rings.description}</p>

          {/* SVG Rings */}
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="95" stroke="rgba(250, 17, 79, 0.2)" strokeWidth="15" fill="transparent" />
              <circle
                cx="120"
                cy="120"
                r="95"
                stroke="#fa114f"
                strokeWidth="15"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={moveCirc}
                strokeDashoffset={moveCirc * 0.13}
              />

              <circle cx="120" cy="120" r="74" stroke="rgba(161, 255, 0, 0.2)" strokeWidth="15" fill="transparent" />
              <circle
                cx="120"
                cy="120"
                r="74"
                stroke="#a1ff00"
                strokeWidth="15"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={exerciseCirc}
                strokeDashoffset={exerciseCirc * 0.24}
              />

              <circle cx="120" cy="120" r="53" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="15" fill="transparent" />
              <circle
                cx="120"
                cy="120"
                r="53"
                stroke="#00f0ff"
                strokeWidth="15"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={standCirc}
                strokeDashoffset={standCirc * 0.08}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="w-full space-y-2 text-left">
            {rings.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-white">{item.label}</span>
                </div>
                <span className="se3-tabular font-bold text-white">
                  {item.currentValue} / {item.targetValue} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scene 3 Mobile: Everyday Intelligence & Double Tap */}
        <div className="flex flex-col items-center text-center">
          <span className="se3-eyebrow text-xs font-bold tracking-widest text-sky-400 mb-2 block uppercase">
            {everyday.eyebrow}
          </span>
          <h3 className="se3-heading text-2xl font-black text-white mb-2 leading-tight">
            <span>{everyday.headlineLine1}</span>
            <br />
            <span>{everyday.headlineLine2}</span>
          </h3>
          <p className="se3-body text-xs text-white/70 mb-6 max-w-xs">{everyday.description}</p>

          {/* Mini Interactive Call Box */}
          <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/15 mb-6">
            <div className="text-[11px] text-white/60 mb-2">Double Tap (Chạm hai lần)</div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-white">Minh</div>
                <div className="text-xs text-emerald-400 font-medium">
                  {isCallAnswered ? 'Đang kết nối • 00:01' : 'Cuộc gọi đến...'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerDoubleTap}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
            >
              {isCallAnswered ? 'Kết thúc cuộc gọi' : 'Thử Chạm Hai Lần (Nghe máy)'}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSpecs}
            className="se3-btn-white w-full py-3 rounded-full font-bold text-xs shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Xem thông số Apple Watch SE 3</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
