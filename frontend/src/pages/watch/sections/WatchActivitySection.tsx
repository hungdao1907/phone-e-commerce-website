import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useScroll, useReducedMotion } from 'framer-motion';
import { Flame, Timer, PersonStanding } from 'lucide-react';
import { WatchRingVisual } from '@/components/watch/WatchRingVisual';
import { WatchMetricCard } from '@/components/watch/WatchMetricCard';
import { WorkoutRunningIcon } from '@/components/ui/WorkoutRunningIcon';
import { MedalAwardIcon } from '@/components/ui/MedalAwardIcon';

interface MetricConfig {
  id: 'move' | 'exercise' | 'stand';
  title: string;
  subtitle: string;
  targetValue: number;
  unit: string;
  percentage: number;
  icon: typeof Flame;
  accentColor: string;
}

const METRICS_DATA: MetricConfig[] = [
  {
    id: 'move',
    title: 'DI CHUYỂN (MOVE)',
    subtitle: 'Calo đốt cháy khi vận động',
    targetValue: 600,
    unit: 'KCAL',
    percentage: 113,
    icon: Flame,
    accentColor: '#fa114f',
  },
  {
    id: 'exercise',
    title: 'TẬP LUYỆN (EXERCISE)',
    subtitle: 'Hoạt động nhịp tim cao',
    targetValue: 30,
    unit: 'PHÚT',
    percentage: 156,
    icon: Timer,
    accentColor: '#92e82a',
  },
  {
    id: 'stand',
    title: 'ĐỨNG (STAND)',
    subtitle: 'Đứng & vận động mỗi giờ',
    targetValue: 12,
    unit: 'GIỜ',
    percentage: 83,
    icon: PersonStanding,
    accentColor: '#1ee4ff',
  },
];

export function WatchActivitySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll Progress State (Single Source of Truth: 0 -> 1)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Damped Pointer Parallax (Desktop only)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    if (shouldReduceMotion) return;

    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setScrollProgress(latest);
    });

    return () => unsubscribe();
  }, [scrollYProgress, shouldReduceMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: -y * 4, // Max ±2deg
      rotateY: x * 6,  // Max ±3deg
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  // -------------------------------------------------------------
  // MASTER TIMELINE PROGRESS CALCULATION
  // -------------------------------------------------------------
  const p = shouldReduceMotion ? 1 : scrollProgress;

  // 1. Stage 1 (0.00 -> 0.20): Centered Headline
  // 2. Stage 2 (0.20 -> 0.40): Headline pulls up, Rings appear on left, Cards slide in from right
  const headerShiftProgress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.20) / (0.40 - 0.20), 0), 1);

  const showcaseProgress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.20) / (0.40 - 0.20), 0), 1);

  // 3. Stage 3 (0.40 -> 1.00): Ring Completion Journey
  // Move Story (0.40 - 0.58)
  const moveProgress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.40) / (0.58 - 0.40), 0), 1);

  // Exercise Story (0.58 - 0.76)
  const exerciseProgress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.58) / (0.76 - 0.58), 0), 1);

  // Stand Story (0.76 - 0.90)
  const standProgress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.76) / (0.90 - 0.76), 0), 1);

  // Focus States
  const isMoveActive = p >= 0.38 && p < 0.58;
  const isExerciseActive = p >= 0.58 && p < 0.76;
  const isStandActive = p >= 0.76 && p < 0.90;
  const isCompletedAll = p >= 0.90;

  // Completion Moment Glow Pulse (0.90 - 0.96)
  const completionGlow = shouldReduceMotion
    ? 0.4
    : p >= 0.90 && p <= 0.96
    ? Math.sin(((p - 0.90) / (0.96 - 0.90)) * Math.PI)
    : p > 0.96
    ? 0.15
    : 0;

  // Secondary Features Reveal (0.92 - 1.00)
  const feature1Progress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.92) / (0.97 - 0.92), 0), 1);
  const feature2Progress = shouldReduceMotion
    ? 1
    : Math.min(Math.max((p - 0.94) / (0.99 - 0.94), 0), 1);

  // Real-time Scrubbed Counters
  const currentValues: Record<string, number> = {
    move: Math.round(moveProgress * 680),
    exercise: Math.round(exerciseProgress * 47),
    stand: Math.round(standProgress * 10),
  };

  const progressValues: Record<string, number> = {
    move: moveProgress,
    exercise: exerciseProgress,
    stand: standProgress,
  };

  const activeStates: Record<string, boolean> = {
    move: isMoveActive || isCompletedAll,
    exercise: isExerciseActive || isCompletedAll,
    stand: isStandActive || isCompletedAll,
  };

  const completedStates: Record<string, boolean> = {
    move: p >= 0.58,
    exercise: p >= 0.76,
    stand: p >= 0.90,
  };

  // Ambient Halo Color Tone
  const ambientRed = p >= 0.38 && p < 0.58 ? 0.22 : 0.08;
  const ambientGreen = p >= 0.58 && p < 0.76 ? 0.18 : 0.06;
  const ambientCyan = p >= 0.76 && p < 0.90 ? 0.16 : 0.05;

  return (
    <section
      ref={sectionRef}
      id="watch-activity"
      className={`watch-activity-section bg-black text-white relative ${
        shouldReduceMotion ? 'py-16 sm:py-24' : 'h-[300vh] md:h-[320vh]'
      }`}
    >
      {/* Sticky Cinematic Viewport Container */}
      <div
        className={`${
          shouldReduceMotion
            ? 'relative w-full'
            : 'sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden'
        }`}
      >
        {/* Dynamic Multi-Color Subconscious Ambient Background */}
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[850px] h-[550px] sm:h-[850px] blur-[120px] rounded-full transition-all duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(250, 17, 79, ${ambientRed}) 0%, rgba(146, 232, 42, ${ambientGreen}) 45%, rgba(30, 228, 255, ${ambientCyan}) 75%, transparent 100%)`,
              opacity: 0.45 + completionGlow * 0.4,
              transform: `translate(-50%, -50%) scale(${1 + completionGlow * 0.08})`,
            }}
          />
        </div>

        <div className="watch-container relative z-10 w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Section Header: Starts centered (0-20%), then pulls up smoothly to header (20-40%) */}
          <div
            className="text-center max-w-2xl lg:max-w-3xl mx-auto mb-4 sm:mb-6 transition-transform duration-300 ease-out"
            style={{
              transform: shouldReduceMotion
                ? 'none'
                : `translateY(${(1 - headerShiftProgress) * 22}vh) scale(${1.06 - headerShiftProgress * 0.06})`,
            }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 leading-[1.12]">
              Khép lại 3 vòng mỗi ngày. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#fa114f] via-[#ff7a00] via-[#ffd600] via-[#34c759] via-[#00c7be] via-[#007aff] to-[#af52de] bg-clip-text text-transparent">
                Chinh phục giới hạn bản thân
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto font-normal">
              3 vòng màu sắc trực quan theo dõi lượng calo tiêu thụ, thời gian vận động cường độ cao và tần suất đứng dậy hằng ngày giúp bạn duy trì lối sống lành mạnh.
            </p>
          </div>

          {/* Master 2-Column Storytelling Layout (Horizontally Aligned Symmetrically) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center justify-items-center">
            {/* Left Column: Visual Hero Activity Rings */}
            <div
              className="lg:col-span-6 flex flex-col items-center justify-center relative transition-all duration-300 ease-out w-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                opacity: showcaseProgress,
                transform: `translateY(${(1 - showcaseProgress) * 35}px) scale(${0.88 + showcaseProgress * 0.12}) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                perspective: 1000,
                pointerEvents: showcaseProgress > 0.2 ? 'auto' : 'none',
              }}
            >
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] aspect-square flex items-center justify-center">
                <WatchRingVisual
                  size={360}
                  moveProgress={moveProgress}
                  exerciseProgress={exerciseProgress}
                  standProgress={standProgress}
                  completionGlow={completionGlow}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Right Column: Progressive Metric Cards (Compact & Horizontally Centered with Left Rings) */}
            <div
              className="lg:col-span-6 flex flex-col gap-2.5 sm:gap-3 transition-all duration-300 ease-out max-w-[460px] lg:max-w-[480px] w-full mx-auto lg:mx-0 justify-center"
              style={{
                opacity: showcaseProgress,
                transform: `translateX(${(1 - showcaseProgress) * 60}px)`,
                pointerEvents: showcaseProgress > 0.2 ? 'auto' : 'none',
              }}
            >
              {METRICS_DATA.map((metric) => (
                <WatchMetricCard
                  key={metric.id}
                  id={metric.id}
                  title={metric.title}
                  subtitle={metric.subtitle}
                  currentValue={currentValues[metric.id]}
                  targetValue={metric.targetValue}
                  unit={metric.unit}
                  percentage={metric.percentage}
                  icon={metric.icon}
                  accentColor={metric.accentColor}
                  isActive={activeStates[metric.id]}
                  isCompleted={completedStates[metric.id]}
                  progress={progressValues[metric.id]}
                />
              ))}

              {/* Secondary Discovery Features (Phase G: 0.90 -> 1.00) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-0.5">
                <div
                  className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-white/8 flex items-center gap-2 backdrop-blur-sm transition-all duration-500 ease-out"
                  style={{
                    opacity: feature1Progress,
                    transform: `translateY(${(1 - feature1Progress) * 16}px)`,
                    pointerEvents: feature1Progress > 0.5 ? 'auto' : 'none',
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <WorkoutRunningIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-[11px] font-bold text-white truncate">50+ Chế độ Thể thao</div>
                    <div className="text-[9px] text-zinc-400 truncate">Bơi lội, Pilates, Yoga...</div>
                  </div>
                </div>

                <div
                  className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-white/8 flex items-center gap-2 backdrop-blur-sm transition-all duration-500 ease-out"
                  style={{
                    opacity: feature2Progress,
                    transform: `translateY(${(1 - feature2Progress) * 16}px)`,
                    pointerEvents: feature2Progress > 0.5 ? 'auto' : 'none',
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <MedalAwardIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-[11px] font-bold text-white truncate">Thi đua Thách đấu</div>
                    <div className="text-[9px] text-zinc-400 truncate">Đua tiến độ 7 ngày cùng bạn bè</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
