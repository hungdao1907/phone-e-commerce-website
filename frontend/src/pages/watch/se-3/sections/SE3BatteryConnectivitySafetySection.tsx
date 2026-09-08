import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Battery,
  Leaf,
  Phone,
  MessageSquare,
  Layers,
  Music,
  Wifi,
  Shield,
  ShieldCheck,
  HeartPulse,
  Navigation,
  Play,
  Volume2,
  Signal,
  Radio,
  Home,
  Smartphone,
} from 'lucide-react';
import { SE3_BATTERY_CONNECTIVITY_SAFETY_DATA } from '../data/se3Data';

interface SE3BatteryConnectivitySafetySectionProps {
  onOpenSpecs?: () => void;
}

// ─── CountUp ────────────────────────────────────────────────────────────────
function CountUp({
  target,
  duration = 1.0,
  delay = 0,
  active = false,
}: {
  target: number;
  duration?: number;
  delay?: number;
  active?: boolean;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    let frameId: number;
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(eased * target));
        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        }
      };
      frameId = requestAnimationFrame(tick);
    }, delay * 1000);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(frameId);
    };
  }, [active, target, duration, delay]);

  return <span>{val}</span>;
}


// ─── Luminous Energy Specks Definition ────────────────────────────────────────
interface BatteryLuminousSpeck {
  id: number;
  angle: number; // degrees around center
  distance: number; // px from center
  drift: number; // px radial travel
  size: number; // px diameter
  color: string;
  minOpacity: number;
  maxOpacity: number;
  duration: number; // seconds
  delay: number; // seconds
}

const BATTERY_SPECK_PARTICLES: BatteryLuminousSpeck[] = [
  // Top-left cluster (vibrant, energetic)
  { id: 1, angle: -155, distance: 100, drift: 7, size: 4.5, color: '#22C55E', minOpacity: 0.72, maxOpacity: 1.0, duration: 4.2, delay: 0.2 },
  { id: 2, angle: -140, distance: 114, drift: 8, size: 3.2, color: '#16C784', minOpacity: 0.68, maxOpacity: 0.95, duration: 3.8, delay: 1.1 },
  { id: 3, angle: -125, distance: 104, drift: 6, size: 4.2, color: '#16A34A', minOpacity: 0.72, maxOpacity: 1.0, duration: 4.8, delay: 0.6 },
  { id: 4, angle: -110, distance: 118, drift: 7, size: 2.5, color: '#32D96B', minOpacity: 0.68, maxOpacity: 0.95, duration: 3.5, delay: 1.8 },
  { id: 5, angle: -95, distance: 102, drift: 5, size: 6.8, color: '#22C55E', minOpacity: 0.78, maxOpacity: 1.0, duration: 4.5, delay: 0.4 }, // HERO

  // Top-right cluster (luminous, elegant)
  { id: 6, angle: -80, distance: 114, drift: 7, size: 4.0, color: '#16C784', minOpacity: 0.72, maxOpacity: 0.95, duration: 3.9, delay: 1.4 },
  { id: 7, angle: -65, distance: 100, drift: 8, size: 6.2, color: '#16A34A', minOpacity: 0.78, maxOpacity: 1.0, duration: 5.1, delay: 0.8 }, // HERO
  { id: 8, angle: -50, distance: 120, drift: 6, size: 3.0, color: '#32D96B', minOpacity: 0.68, maxOpacity: 0.95, duration: 3.6, delay: 2.2 },
  { id: 9, angle: -35, distance: 106, drift: 8, size: 4.6, color: '#22C55E', minOpacity: 0.72, maxOpacity: 1.0, duration: 4.4, delay: 1.0 },
  { id: 10, angle: -20, distance: 116, drift: 7, size: 3.5, color: '#15803D', minOpacity: 0.68, maxOpacity: 0.95, duration: 4.0, delay: 0.5 },

  // Right flank (crisp specks)
  { id: 11, angle: -5, distance: 104, drift: 6, size: 4.5, color: '#22C55E', minOpacity: 0.72, maxOpacity: 1.0, duration: 4.7, delay: 1.5 },
  { id: 12, angle: 15, distance: 116, drift: 8, size: 2.6, color: '#16C784', minOpacity: 0.68, maxOpacity: 0.95, duration: 3.4, delay: 2.0 },
  { id: 13, angle: 35, distance: 106, drift: 7, size: 5.2, color: '#16A34A', minOpacity: 0.72, maxOpacity: 1.0, duration: 5.3, delay: 0.7 },
  { id: 14, angle: 55, distance: 114, drift: 6, size: 3.0, color: '#32D96B', minOpacity: 0.68, maxOpacity: 0.95, duration: 4.1, delay: 1.9 },

  // Bottom flank (sparse & restrained to keep 18 GIỜ clear)
  { id: 15, angle: 80, distance: 102, drift: 4, size: 2.4, color: '#16A34A', minOpacity: 0.60, maxOpacity: 0.90, duration: 4.6, delay: 1.2 },
  { id: 16, angle: 100, distance: 102, drift: 4, size: 2.4, color: '#15803D', minOpacity: 0.60, maxOpacity: 0.90, duration: 4.3, delay: 2.5 },

  // Left flank (glowing energy)
  { id: 17, angle: 130, distance: 108, drift: 7, size: 3.8, color: '#16C784', minOpacity: 0.68, maxOpacity: 0.95, duration: 3.7, delay: 0.9 },
  { id: 18, angle: 150, distance: 118, drift: 8, size: 3.0, color: '#22C55E', minOpacity: 0.68, maxOpacity: 0.95, duration: 4.9, delay: 1.7 },
  { id: 19, angle: 170, distance: 105, drift: 6, size: 6.5, color: '#16A34A', minOpacity: 0.78, maxOpacity: 1.0, duration: 5.0, delay: 0.3 }, // HERO
];

function BatteryLuminousSpeckNode({ speck, active }: { speck: BatteryLuminousSpeck; active: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const angleRad = (speck.angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const startX = cos * speck.distance;
  const startY = sin * speck.distance;
  const endX = cos * (speck.distance + speck.drift);
  const endY = sin * (speck.distance + speck.drift);

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        opacity: 0,
        scale: 0.8,
      }}
      animate={
        active
          ? shouldReduceMotion
            ? { x: startX, y: startY, opacity: speck.minOpacity * 1.1, scale: 1 }
            : {
                x: [startX, endX, startX],
                y: [startY, endY, startY],
                opacity: [speck.minOpacity, speck.maxOpacity, speck.minOpacity],
                scale: [0.92, 1.12, 0.92],
              }
          : { opacity: 0, scale: 0.8 }
      }
      transition={
        active && !shouldReduceMotion
          ? {
              duration: speck.duration * 1.35,
              delay: 0.35 + speck.delay * 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : { duration: 0.8 }
      }
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none will-change-transform z-[1]"
      style={{
        width: `${speck.size}px`,
        height: `${speck.size}px`,
        background: `radial-gradient(circle at 35% 35%, #7cff6b 0%, #32d96b 25%, ${speck.color} 65%, #15803d 100%)`,
        boxShadow: `0 0 ${speck.size * 1.8}px ${speck.color}, 0 0 ${speck.size * 3.6}px rgba(34,197,94,0.55), 0 1px 3px rgba(0, 0, 0, 0.16)`,
      }}
    />
  );
}

// ─── Battery SVG Ring with Animated 0% -> 100% Battery Icon ─────────────────
function BatteryWatchVisual({ active: externalActive }: { active: boolean }) {
  const visualRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(visualRef, { amount: 0.3, once: true });
  const active = externalActive || isInView;
  const r = 74;
  const circ = 2 * Math.PI * r;

  return (
    <div ref={visualRef} className="flex flex-col items-center select-none">
      <span className="text-[11px] font-black tracking-[0.22em] text-emerald-800 uppercase mb-3">
        ALL-DAY BATTERY
      </span>

      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center overflow-visible">
        {/* Soft, multi-layered circular ambient glow with breathing pulse */}
        <motion.div
          className="absolute w-72 h-72 rounded-full pointer-events-none z-0"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={
            active
              ? {
                  opacity: [0.85, 1.0, 0.85],
                  scale: [0.97, 1.03, 0.97],
                }
              : { opacity: 0, scale: 0.94 }
          }
          transition={
            active
              ? {
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : { duration: 0.8 }
          }
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, rgba(22,199,132,0.12) 38%, rgba(50,217,107,0.05) 58%, transparent 72%)',
          }}
        />

        {/* Refined circular inner core podium with faint mint-white tint */}
        <div
          className="absolute w-36 h-36 rounded-full pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(circle, rgba(240,253,244,0.95) 0%, rgba(248,250,248,0.85) 68%, transparent 100%)',
            border: '1px solid rgba(34,197,94,0.18)',
            boxShadow: 'inset 0 1px 6px rgba(34,197,94,0.08), 0 2px 10px rgba(0,0,0,0.03)',
          }}
        />

        {/* Luminous Green Energy Specks radiating around circumference */}
        {BATTERY_SPECK_PARTICLES.map((speck) => (
          <BatteryLuminousSpeckNode key={speck.id} speck={speck} active={active} />
        ))}

        {/* SVG Endurance Ring with 3-tier vector halo (zero rectangular filter clipping artifacts) */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 overflow-visible z-[2]"
          viewBox="0 0 180 180"
          style={{ overflow: 'visible' }}
        >
          {/* Faint track circle */}
          <circle
            cx="90"
            cy="90"
            r={r}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="8"
            fill="transparent"
          />

          {/* Outer soft vector aura */}
          <motion.circle
            cx="90"
            cy="90"
            r={r}
            stroke="#22c55e"
            strokeWidth="24"
            strokeOpacity="0.22"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: active ? 0 : circ }}
            transition={{ duration: 2.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Saturated ambient vector halo following circle arc */}
          <motion.circle
            cx="90"
            cy="90"
            r={r}
            stroke="#16c784"
            strokeWidth="14"
            strokeOpacity="0.45"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: active ? 0 : circ }}
            transition={{ duration: 2.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Main crisp Apple battery green circle */}
          <motion.circle
            cx="90"
            cy="90"
            r={r}
            stroke="#16a34a"
            strokeWidth="8.5"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: active ? 0 : circ }}
            transition={{ duration: 2.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        {/* Center: Apple-style Animated Battery Icon Filling from 0% to 100% */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="flex items-center">
            {/* Battery Chassis */}
            <div className="relative w-16 h-8 rounded-[9px] border-2 border-[#111111] bg-white p-[2.5px] overflow-hidden flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              {/* Animated Internal Fill in Apple Green */}
              <motion.div
                className="h-full rounded-[5px] bg-gradient-to-r from-emerald-500 via-[#16c784] to-emerald-600 shadow-[0_0_12px_rgba(34,197,94,0.75)]"
                initial={{ width: '0%' }}
                animate={{ width: active ? '100%' : '0%' }}
                transition={{ duration: 2.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Charging Lightning Bolt in Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Zap className="w-3.5 h-3.5 text-white fill-white filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
              </div>
            </div>

            {/* Battery Terminal Cap */}
            <div className="w-1 h-3 rounded-r-[2px] bg-[#111111] ml-[1.5px]" />
          </div>

          {/* Percentage Counter: 0% -> 100% in Crisp Deep Emerald */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-xs font-black text-emerald-900 tracking-wider tabular-nums mt-2"
          >
            <CountUp target={100} duration={2.3} delay={0.25} active={active} />%
          </motion.div>
        </div>
      </div>

      {/* Metric below ring */}
      <div className="flex flex-col items-center text-center mt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="se3-heading se3-text-black-luminous text-4xl sm:text-5xl font-black text-[#111113] leading-none tabular-nums">
            <CountUp target={18} duration={2.0} delay={0.45} active={active} />
          </span>
          <span className="se3-heading text-lg font-black text-emerald-700 tracking-wider uppercase">giờ</span>
        </div>
        <span className="text-xs se3-text-black-luminous text-[#111113] mt-1 font-semibold">Sử dụng thông thường cả ngày</span>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function SE3BatteryConnectivitySafetySection({ onOpenSpecs }: SE3BatteryConnectivitySafetySectionProps) {
  const { battery, connectivity, safety, headlineLine1, headlineLine2, subheadline, sectionEyebrow } =
    SE3_BATTERY_CONNECTIVITY_SAFETY_DATA;

  // ── 01 BATTERY SCROLL STORY ──
  const batteryRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { amount: 0.2, once: true });
  const { scrollYProgress: batteryScroll } = useScroll({
    target: batteryRef,
    offset: ['start 85%', 'end 35%'],
  });

  const [batteryStage, setBatteryStage] = useState(0);
  useMotionValueEvent(batteryScroll, 'change', (latest) => {
    if (latest > 0.55) {
      setBatteryStage((prev) => Math.max(prev, 3));
    } else if (latest > 0.32) {
      setBatteryStage((prev) => Math.max(prev, 2));
    } else if (latest > 0.1) {
      setBatteryStage((prev) => Math.max(prev, 1));
    }
  });

  const isCardsActive = cardsInView || batteryStage >= 2;

  // ── 02 CONNECTIVITY DESKTOP STICKY SCROLL STORY ──
  const connRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: connScroll } = useScroll({
    target: connRef,
    offset: ['start start', 'end end'],
  });

  // Stage 1 & 2: iPhone "Left at home" cinematic pull-away:
  // 0 -> 0.22: Resting quietly on desk at home beside Watch
  // 0.22 -> 0.44: Being pulled away, shrinking, tilting, blurring into the distance
  const iphoneX = useTransform(connScroll, [0.22, 0.44], [0, -170]);
  const iphoneY = useTransform(connScroll, [0.22, 0.44], [0, 24]);
  const iphoneScale = useTransform(connScroll, [0.22, 0.44], [1, 0.62]);
  const iphoneRotate = useTransform(connScroll, [0.22, 0.44], [0, -8]);
  const iphoneOpacity = useTransform(connScroll, [0.24, 0.43], [1, 0]);
  const iphoneBlur = useTransform(connScroll, [0.24, 0.43], ['blur(0px)', 'blur(10px)']);
  const shadowScale = useTransform(connScroll, [0.22, 0.44], [1, 0.4]);
  const shadowOpacity = useTransform(connScroll, [0.24, 0.42], [0.2, 0]);


  // Apple Watch presence (opacity 0.85 -> 1, scale 0.96 -> 1)
  const watchScale = useTransform(connScroll, [0, 0.20, 0.88, 1], [0.96, 1, 1, 0.98]);
  const watchOpacity = useTransform(connScroll, [0, 0.16], [0.85, 1]);

  // Stage background transition toward Safety chapter (#f8f8fa)
  const stageBg = useTransform(connScroll, [0.88, 1], ['#ffffff', '#f8f8fa']);

  // Concentric rings base opacity: ~0.05 before cellular, ~0.15 once cellular active, fades at end
  const ringsBaseOpacity = useTransform(connScroll, [0, 0.32, 0.37, 0.88, 0.94], [0.05, 0.05, 0.15, 0.15, 0]);

  // Active Story Tracker according to user's exact progression:
  // 0 - 35%: Standby & iPhone remains clearly visible alongside Watch, then gently departs
  // 35 - 46%: Cellular Active
  // 46 - 58%: Call
  // 58 - 69%: Messages
  // 69 - 79%: Maps
  // 79 - 88%: Music / Pay
  // 88 - 100%: Conclusion - All cards disappeared & Apple Logo appears on Watch screen!
  const [activeStory, setActiveStory] = useState(0);
  useMotionValueEvent(connScroll, 'change', (latest) => {
    if (latest >= 0.88) {
      setActiveStory(6); // Conclusion: Apple Logo on Watch screen
    } else if (latest >= 0.79) {
      setActiveStory(5); // Music & Pay
    } else if (latest >= 0.69) {
      setActiveStory(4); // Maps
    } else if (latest >= 0.58) {
      setActiveStory(3); // Messages
    } else if (latest >= 0.46) {
      setActiveStory(2); // Call
    } else if (latest >= 0.35) {
      setActiveStory(1); // Cellular Active
    } else {
      setActiveStory(0); // Standby / Leaving iPhone
    }
  });

  const isCellularActivated = activeStory >= 1;

  // Surface 1: Call (Left flank) - emerges 0.44, visible 0.49-0.85, fades at 0.85-0.88
  const callOpacity = useTransform(connScroll, [0.44, 0.49, 0.85, 0.88], [0, 1, 1, 0]);
  const callScale = useTransform(connScroll, [0.44, 0.49, 0.85, 0.88], [0.92, 1, 1, 0.94]);
  const callX = useTransform(connScroll, [0.44, 0.49], [-16, 0]);

  // Surface 2: Messages (Top flank) - emerges 0.56, visible 0.61-0.85, fades at 0.85-0.88
  const msgOpacity = useTransform(connScroll, [0.56, 0.61, 0.85, 0.88], [0, 1, 1, 0]);
  const msgScale = useTransform(connScroll, [0.56, 0.61, 0.85, 0.88], [0.92, 1, 1, 0.94]);
  const msgY = useTransform(connScroll, [0.56, 0.61], [-16, 0]);

  // Surface 3: Maps (Right flank) - emerges 0.67, visible 0.72-0.85, fades at 0.85-0.88
  const mapsOpacity = useTransform(connScroll, [0.67, 0.72, 0.85, 0.88], [0, 1, 1, 0]);
  const mapsScale = useTransform(connScroll, [0.67, 0.72, 0.85, 0.88], [0.92, 1, 1, 0.94]);
  const mapsX = useTransform(connScroll, [0.67, 0.72], [16, 0]);

  // Surface 4: Music (Bottom flank) - emerges 0.77, visible 0.81-0.85, fades at 0.85-0.88
  const musicOpacity = useTransform(connScroll, [0.77, 0.81, 0.85, 0.88], [0, 1, 1, 0]);
  const musicScale = useTransform(connScroll, [0.77, 0.81, 0.85, 0.88], [0.92, 1, 1, 0.94]);
  const musicY = useTransform(connScroll, [0.77, 0.81], [16, 0]);

  // Technical disclaimer fade-in at the end (0.90 -> 0.96)
  const disclaimerOpacity = useTransform(connScroll, [0.90, 0.96], [0, 1]);

  // ── 03 SAFETY SCROLL (Quiet, Light Sticky ~360vh - Extended Display Duration) ──
  const safetyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: safetyScroll } = useScroll({
    target: safetyRef,
    offset: ['start start', 'end end'],
  });

  // Track active safety feature row (0 = Fall Detection, 1 = Crash Detection, 2 = Emergency SOS, 3 = Conclusion)
  const [activeSafetyStep, setActiveSafetyStep] = useState(0);
  useMotionValueEvent(safetyScroll, 'change', (latest) => {
    if (latest >= 0.72) {
      setActiveSafetyStep(3); // Conclusion phase (Reassurance & CTA)
    } else if (latest >= 0.48) {
      setActiveSafetyStep(2); // Emergency SOS (Row 03)
    } else if (latest >= 0.24) {
      setActiveSafetyStep(1); // Crash Detection (Row 02)
    } else {
      setActiveSafetyStep(0); // Fall Detection (Row 01)
    }
  });

  // Smooth opacity curves for the 3 rows:
  // Row 01 (Fall): Active at start (1.0), dims to 0.45 when Row 02 activates, dims to 0.30 when Row 03 activates
  const safetyRow1Opacity = useTransform(safetyScroll, [0, 0.20, 0.28, 0.48, 0.72], [1.0, 1.0, 0.45, 0.30, 0.25]);
  // Row 02 (Crash): Starts dim (0.30), brightens to 1.0 at 0.24-0.46, dims to 0.45 at 0.54+
  const safetyRow2Opacity = useTransform(safetyScroll, [0, 0.18, 0.26, 0.46, 0.54, 0.72], [0.30, 0.30, 1.0, 1.0, 0.45, 0.25]);
  // Row 03 (SOS): Starts dim (0.25), brightens to 1.0 at 0.48-0.68, active 0.68-0.74, dims gently to 0.45 at conclusion
  const safetyRow3Opacity = useTransform(safetyScroll, [0, 0.42, 0.50, 0.70, 0.76], [0.25, 0.25, 1.0, 1.0, 0.45]);

  // Divider lines expansion (scaleX from 0 -> 1)
  const safetyLine1Scale = useTransform(safetyScroll, [0, 0.10], [0, 1]);
  const safetyLine2Scale = useTransform(safetyScroll, [0.20, 0.28], [0, 1]);
  const safetyLine3Scale = useTransform(safetyScroll, [0.44, 0.52], [0, 1]);

  // Emotional conclusion sentence reveal (fades up smoothly at 0.68 -> 0.74, stays solidly 100% visible through 1.00)
  const safetyEndingOpacity = useTransform(safetyScroll, [0.68, 0.74, 1.0], [0, 1, 1]);
  const safetyEndingY = useTransform(safetyScroll, [0.68, 0.74], [18, 0]);

  return (
    <section
      id="se3-battery"
      className="relative w-full se3-bcs-bg se3-text-black-luminous text-[#111113] select-none scroll-mt-16 overflow-x-clip"
    >
      {/* ─────────────────────────────────────────────────────────────
          INTRO: SIMPLE REVEAL (~75-80vh)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-[75vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="se3-eyebrow text-xs font-bold tracking-[0.2em] text-[#0071e3] uppercase mb-5 block"
        >
          {sectionEyebrow}
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="se3-heading text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-5"
        >
          <span className="se3-text-black-luminous text-[#111113]">{headlineLine1}</span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent filter drop-shadow-[0_2px_12px_rgba(37,99,235,0.12)]">
            {headlineLine2}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.22 }}
          className="se3-body text-sm sm:text-base se3-text-black-luminous text-[#111113] max-w-xl leading-relaxed"
        >
          {subheadline}
        </motion.p>
      </div>

      <div className="w-full max-w-6xl mx-auto h-px bg-black/[0.06]" />

      {/* ─────────────────────────────────────────────────────────────
          CHAPTER 01: BATTERY (~120-130vh Scroll Narrative)
          ───────────────────────────────────────────────────────────── */}
      <div ref={batteryRef} className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 sm:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center lg:text-left"
        >
          <span className="se3-eyebrow text-[11px] font-black tracking-[0.2em] text-emerald-700 uppercase mb-2 block">
            {battery.eyebrow}
          </span>
          <h3 className="se3-heading se3-text-black-luminous text-4xl sm:text-5xl font-black text-[#111113] tracking-tight leading-tight mb-2">
            {battery.headline}
          </h3>
          <p className="se3-heading text-xl sm:text-2xl font-bold text-emerald-700 mb-2">
            {battery.headlineSub}
          </p>
          <p className="se3-body text-sm se3-text-black-luminous text-[#111113] max-w-lg leading-relaxed font-normal">
            {battery.description}
          </p>
        </motion.div>

        {/* Narrative Layout: Left (Seamless Ring + Battery) & Right (Step-by-step revealed cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Seamless Battery visual (No card border/background) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6">
            <BatteryWatchVisual active={batteryStage >= 1} />
          </div>

          {/* Right Column: Distinct Choreographed Cards */}
          <div ref={cardsRef} className="lg:col-span-7 flex flex-col gap-4">
            {/* Card 1: FAST CHARGE (Nhanh / Directional / Energetic) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isCardsActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              className="se3-bcs-card p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all duration-300 border border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_12px_28px_rgba(6,182,212,0.12),0_2px_8px_rgba(0,0,0,0.04)]"
              style={{
                background:
                  'radial-gradient(circle at 18% 30%, rgba(6,182,212,0.11) 0%, rgba(6,182,212,0.02) 48%, #ffffff 80%)',
                boxShadow: '0 4px 20px rgba(6,182,212,0.06), 0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* One-time Cyan Energy Streak sweeping across card background */}
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={isCardsActive ? { x: '180%', opacity: [0, 0.75, 0] } : { x: '-100%', opacity: 0 }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent skew-x-[-20deg]"
              />

              {/* Card Header: Badge & Metadata */}
              <div className="relative z-10 flex items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-600/10 border border-cyan-600/25">
                  <Zap className="w-3.5 h-3.5 text-cyan-700" />
                  <span className="text-[10px] font-black tracking-wider text-cyan-800 uppercase">
                    SẠC NHANH
                  </span>
                </div>
                <span className="text-[11px] se3-text-black-luminous text-[#111113] font-semibold">Cáp sạc từ tính USB-C</span>
              </div>

              {/* Cause-and-Effect Visual: 15 PHÚT ───→ 8 GIỜ SỬ DỤNG */}
              <div className="relative z-10 mb-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  {/* 15 PHÚT count-up rapidly at 150ms */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="se3-heading text-4xl sm:text-5xl font-black text-cyan-700 tabular-nums leading-none">
                      <CountUp target={15} duration={0.45} delay={0.15} active={isCardsActive} />
                    </span>
                    <span className="se3-heading text-xl font-bold text-cyan-700 uppercase tracking-wider">
                      phút
                    </span>
                  </div>

                  {/* Directional arrow with energy streak */}
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={isCardsActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    transition={{ duration: 0.35, delay: 0.3 }}
                    className="text-cyan-600/80 font-bold text-xl select-none"
                  >
                    →
                  </motion.span>

                  {/* 8 GIỜ reveals at 350ms */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={isCardsActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base sm:text-lg font-bold se3-text-black-luminous text-[#111113]"
                  >
                    đến <span className="text-cyan-700 font-black">8 giờ</span> sử dụng
                  </motion.div>
                </div>

                {/* Hairline 2px energy connector from 15 phút -> 8 giờ */}
                <div className="mt-2.5 h-[2px] w-full max-w-[210px] rounded-full bg-cyan-950/10 overflow-hidden relative">
                  <motion.div
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={isCardsActive ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 rounded-full"
                  />
                </div>
              </div>

              <p className="relative z-10 se3-body text-xs sm:text-sm se3-text-black-luminous text-[#111113] max-w-md leading-relaxed font-normal">
                Chỉ 15 phút sạc nhanh mang lại thêm 8 giờ sử dụng thông thường, kịp giờ ra ngoài hay trước khi ngủ.
              </p>
            </motion.div>

            {/* Block 3: Two Complementary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 2: ALL DAY / SỬ DỤNG THÔNG THƯỜNG (Ổn định / Full / Calm) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isCardsActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                className="se3-bcs-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between border border-black/[0.08] bg-[#fbfbfd] hover:border-emerald-600/30 hover:shadow-[0_12px_28px_rgba(34,197,94,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black tracking-[0.16em] text-emerald-800 uppercase block">
                      SỬ DỤNG THÔNG THƯỜNG
                    </span>

                    {/* Animated Apple Battery Icon filling from 70% to 100% at 600ms + gentle glow */}
                    <div className="relative flex items-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={isCardsActive ? { opacity: [0, 0.85, 0.35] } : { opacity: 0 }}
                        transition={{ duration: 0.65, delay: 1.05 }}
                        className="absolute -inset-1 rounded-md bg-emerald-500/25 blur-[3px] pointer-events-none"
                      />
                      <div className="relative w-6 h-3 rounded-[3px] border-[1.5px] border-emerald-800 bg-white p-[1px] flex items-center overflow-hidden">
                        <motion.div
                          initial={{ width: '68%' }}
                          animate={isCardsActive ? { width: '100%' } : { width: '68%' }}
                          transition={{ duration: 0.55, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-[1.5px] bg-emerald-600"
                        />
                      </div>
                      <div className="w-[1.5px] h-[5px] rounded-r-[1px] bg-emerald-800 ml-[1px]" />
                    </div>
                  </div>

                  {/* Headline 'Cả ngày' reveals at 480ms */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={isCardsActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.45, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    className="se3-heading se3-text-black-luminous text-3xl font-black text-[#111113] mb-1"
                  >
                    Cả ngày
                  </motion.div>

                  {/* Subheadline 'Lên đến 18 giờ' reveals at 650ms */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={isCardsActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                    transition={{ duration: 0.45, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="text-xs font-bold text-emerald-800 mb-2"
                  >
                    Lên đến 18 giờ
                  </motion.div>
                </div>

                <p className="text-xs se3-text-black-luminous text-[#111113] leading-relaxed mt-2 font-normal">
                  Đủ cho toàn bộ các buổi tập, nhận thông báo liên tục và theo dõi giấc ngủ.
                </p>
              </motion.div>

              {/* Card 3: LOW POWER / NGUỒN ĐIỆN THẤP (Chậm / Tiết kiệm / Endurance) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isCardsActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                className="se3-bcs-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between border border-black/[0.08] bg-[#fbfbfd] hover:border-purple-600/30 hover:shadow-[0_12px_28px_rgba(147,51,234,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black tracking-[0.16em] text-purple-800 uppercase block">
                      NGUỒN ĐIỆN THẤP
                    </span>

                    {/* Low Power Mode Battery Icon with gentle status breathing pulse */}
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={
                          isCardsActive
                            ? {
                                scale: [1, 1.35, 1],
                                opacity: [0.2, 0.55, 0.2],
                              }
                            : { scale: 1, opacity: 0.2 }
                        }
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          delay: 1.1,
                          ease: 'easeInOut',
                        }}
                        className="absolute -inset-1 rounded-full bg-purple-500/25 blur-[3px] pointer-events-none"
                      />
                      <motion.div
                        animate={
                          isCardsActive
                            ? {
                                scale: [1, 1.06, 1],
                                opacity: [0.85, 1, 0.85],
                              }
                            : { scale: 1, opacity: 0.85 }
                        }
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          delay: 1.1,
                          ease: 'easeInOut',
                        }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <Leaf className="w-5 h-5 text-purple-700 filter drop-shadow-[0_0_6px_rgba(126,34,206,0.35)]" strokeWidth={2.2} />
                      </motion.div>
                    </div>
                  </div>

                  {/* 32 GIỜ with soft localized purple glow behind it */}
                  <div className="relative inline-flex items-baseline gap-1.5 mb-1">
                    <div className="absolute -inset-2 bg-purple-500/10 blur-md rounded-full pointer-events-none" />
                    <span className="relative se3-heading text-3xl font-black text-purple-800 tabular-nums leading-none">
                      <CountUp target={32} duration={0.8} delay={0.9} active={isCardsActive} />
                    </span>
                    <span className="relative se3-heading text-base font-bold text-purple-800 uppercase">giờ</span>
                  </div>

                  {/* Subtitle 'Khi bạn cần lâu hơn' */}
                  <div className="text-xs font-bold text-purple-900 mb-2">
                    Khi bạn cần lâu hơn
                  </div>
                </div>

                <p className="text-xs se3-text-black-luminous text-[#111113] leading-relaxed mt-2 font-normal">
                  Tiết kiệm năng lượng thông minh khi bạn có những chuyến đi xa dài ngày.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto h-px bg-black/[0.06]" />

      {/* ─────────────────────────────────────────────────────────────
          CHAPTER 02: CONNECTIVITY (~160-180vh Watch-centered Story)
          ───────────────────────────────────────────────────────────── */}
      {/* DESKTOP VIEW: STICKY SCROLL STORY */}
      <div ref={connRef} className="relative hidden md:block" style={{ height: '280vh' }}>
        <motion.div
          style={{ backgroundColor: stageBg }}
          className="sticky top-0 h-screen flex flex-col justify-between py-10 px-6 overflow-hidden transition-colors duration-500"
        >
          {/* Top Editorial Header */}
          <div className="text-center max-w-2xl mx-auto h-24 flex items-center justify-center">
            <div className="text-center w-full">
              <span className="se3-eyebrow text-[11px] font-bold tracking-[0.2em] text-[#0071e3] uppercase mb-2 block">
                {connectivity.eyebrow}
              </span>
              <h3 className="se3-heading se3-text-black-luminous text-4xl lg:text-5xl font-black text-[#111113] tracking-tight leading-tight mb-1">
                {connectivity.headline}
              </h3>
              <p className="se3-heading text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                {connectivity.headlineSub}
              </p>
              <p className="se3-body text-xs lg:text-sm se3-text-black-luminous text-[#111113] leading-relaxed max-w-lg mx-auto">
                {connectivity.description}
              </p>
            </div>
          </div>

          {/* Central Stage: Watch at Center + Floating Mini Apple Watch UI Surfaces */}
          <div className="relative w-full max-w-[860px] h-[520px] mx-auto flex items-center justify-center">
            {/* Ambient Center Glow */}
            <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Concentric Signal Rings Reacting to State */}
            <motion.div
              style={{ opacity: ringsBaseOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            >
              <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-800/40" />
              <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-cyan-800/30" />
              <div className="absolute w-[580px] h-[580px] rounded-full border border-cyan-800/20" />
            </motion.div>

            {/* Dynamic Signal Waves Radiating from Watch once Cellular is Activated */}
            {isCellularActivated && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0.25 }}
                  animate={{ scale: [0.92, 1.08, 1.22], opacity: [0.25, 0.10, 0] }}
                  transition={{ duration: 3.0, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-[280px] h-[280px] rounded-full border border-cyan-400/30"
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0.25 }}
                  animate={{ scale: [0.92, 1.08, 1.22], opacity: [0.25, 0.10, 0] }}
                  transition={{ duration: 3.0, repeat: Infinity, delay: 0.3, ease: 'easeOut' }}
                  className="absolute w-[280px] h-[280px] rounded-full border border-cyan-400/25"
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0.25 }}
                  animate={{ scale: [0.92, 1.08, 1.22], opacity: [0.25, 0.10, 0] }}
                  transition={{ duration: 3.0, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
                  className="absolute w-[280px] h-[280px] rounded-full border border-cyan-400/20"
                />
              </div>
            )}

            {/* Single Ripple when a new capability activates */}
            <AnimatePresence>
              {activeStory >= 2 && (
                <motion.div
                  key={`story-ripple-${activeStory}`}
                  initial={{ scale: 0.92, opacity: 0.32 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute w-[280px] h-[280px] rounded-full border border-cyan-400/40 pointer-events-none z-0"
                />
              )}
            </AnimatePresence>


            {/* Microinteraction: iPhone Left at Home (Pulled away, tilting, shrinking into the distance) */}
            {activeStory <= 1 && (
              <motion.div
                style={{
                  x: iphoneX,
                  y: iphoneY,
                  scale: iphoneScale,
                  rotate: iphoneRotate,
                  opacity: iphoneOpacity,
                  filter: iphoneBlur,
                }}
                className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-[135px] pointer-events-none z-10 flex flex-col items-center select-none"
              >
                {/* Authentic Apple-style iPhone Lock Screen resting at home */}
                <div className="w-[82px] h-[164px] rounded-[24px] p-1 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 shadow-[0_18px_36px_rgba(0,0,0,0.18)] relative flex flex-col items-center">
                  {/* Glossy Bezel border */}
                  <div className="w-full h-full rounded-[20px] bg-gradient-to-b from-slate-900 via-neutral-900 to-black p-1.5 flex flex-col justify-between items-center text-white relative overflow-hidden border border-white/10 shadow-inner">
                    {/* Dynamic Island */}
                    <div className="w-5 h-1.5 rounded-full bg-black border border-white/10 z-10 mt-0.5" />

                    {/* Subtle Lock Screen Time & Date */}
                    <div className="flex flex-col items-center -mt-1">
                      <span className="text-[6.5px] text-white/60 font-medium">Thứ Bảy, 5/9</span>
                      <span className="text-sm font-bold tracking-tight text-white/95 leading-none mt-0.5">10:09</span>
                    </div>

                    {/* Visual representation: Home desk indicator */}
                    <div className="flex flex-col items-center gap-0.5 my-auto">
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <Home className="w-3 h-3 text-blue-300" />
                      </div>
                      <span className="text-[7px] font-bold text-neutral-300 uppercase tracking-widest font-mono">
                        TẠI NHÀ
                      </span>
                    </div>

                    {/* Bottom Home Indicator Bar */}
                    <div className="w-6 h-[2px] rounded-full bg-white/40 mb-0.5" />
                  </div>
                </div>

                {/* Tabletop resting contact shadow that scales as iPhone pulls away */}
                <motion.div
                  style={{ scale: shadowScale, opacity: shadowOpacity }}
                  className="w-16 h-2 rounded-full bg-black/20 blur-[2px] mt-1"
                />

                {/* Status Badges Conveying "Left iPhone at home" */}
                <div className="flex flex-col items-center gap-1 mt-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-xs">
                    <Home className="w-3 h-3 text-[#0071e3] shrink-0" />
                    <span className="text-[9.5px] se3-text-black-luminous text-[#111113] font-bold tracking-wide whitespace-nowrap">
                      Để quên ở nhà
                    </span>
                  </div>

                  {/* Disconnecting status indicator when moving far away */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50/90 border border-amber-200/80 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[7.5px] font-bold text-amber-700 uppercase tracking-wider">
                      Ngoài tầm Bluetooth
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Central Apple Watch Hero with Live Micro-story OLED Screen */}
            <motion.div
              style={{ scale: watchScale, opacity: watchOpacity }}
              className="relative z-20 flex flex-col items-center select-none"
            >
              <div className="relative w-[280px] h-[340px] flex items-center justify-center">
                {/* Watch Chassis Render (Orthogonal Front View) */}
                <img
                  src="/images/watch/se3-chassis-front.png"
                  alt="Apple Watch SE 3 Cellular"
                  className="w-full h-full object-contain filter drop-shadow-[0_22px_45px_rgba(0,0,0,0.18)] pointer-events-none select-none"
                />

                {/* OLED Display Overlay Showing Synchronized Micro-Story Screens */}
                <div className="se3-watch-screen absolute w-[102px] h-[124px] rounded-[24px] bg-black overflow-hidden flex flex-col justify-between p-2 z-10 select-none">
                  <AnimatePresence mode="wait">
                    {/* Screen 0: Standby / Leaving iPhone Behind (0 - 35%) */}
                    {activeStory === 0 && (
                      <motion.div
                        key="story-standby"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-1"
                      >
                        <div className="flex items-center justify-between w-full px-1.5">
                          <span className="text-[10px] font-bold tracking-tight" style={{ color: '#ffffff' }}>10:09</span>
                          <div className="flex gap-1">
                            <span className="w-1 h-1 rounded-full bg-neutral-400" />
                            <span className="w-1 h-1 rounded-full bg-neutral-400" />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center my-auto shadow-sm">
                          <Smartphone className="w-4 h-4 text-neutral-300" />
                        </div>
                        <span className="text-[8px] font-black tracking-wider uppercase" style={{ color: '#d4d4d8' }}>
                          IPHONE Ở NHÀ
                        </span>
                      </motion.div>
                    )}

                    {/* Screen 1: Cellular Active (35 - 45%) */}
                    {activeStory === 1 && (
                      <motion.div
                        key="story-cellular"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-1"
                      >
                        <div className="flex items-center justify-between w-full px-1.5">
                          <span className="text-[10px] font-bold tracking-tight" style={{ color: '#ffffff' }}>10:09</span>
                          <div className="flex gap-1">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center my-auto shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                          <Signal className="w-4 h-4 text-cyan-300 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-black tracking-widest uppercase text-cyan-300">
                          CELLULAR
                        </span>
                      </motion.div>
                    )}

                    {/* Screen 2: Incoming Call (45 - 60%) */}
                    {activeStory === 2 && (
                      <motion.div
                        key="story-call"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 w-fit">
                          <Phone className="w-2.5 h-2.5 text-emerald-300 fill-emerald-300/30" />
                          <span className="text-[8px] text-emerald-300 font-extrabold uppercase tracking-wider">ĐANG GỌI</span>
                        </div>
                        <div className="my-auto flex flex-col items-center">
                          <span className="text-[11px] font-black tracking-tight leading-snug" style={{ color: '#ffffff' }}>
                            Nguyễn Minh
                          </span>
                          <span className="text-[9px] text-emerald-300 font-mono font-bold mt-0.5">
                            00:04
                          </span>
                        </div>
                        <div className="w-full flex items-center justify-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-2.5 bg-emerald-400 rounded-full animate-bounce shadow-[0_0_6px_#34d399]" />
                          <span className="w-1.5 h-4.5 bg-emerald-400 rounded-full animate-bounce delay-75 shadow-[0_0_6px_#34d399]" />
                          <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce delay-150 shadow-[0_0_6px_#34d399]" />
                        </div>
                      </motion.div>
                    )}

                    {/* Screen 3: Messages (60 - 72%) */}
                    {activeStory === 3 && (
                      <motion.div
                        key="story-messages"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 w-fit">
                          <MessageSquare className="w-2.5 h-2.5 text-sky-300 fill-sky-300/30" />
                          <span className="text-[8px] text-sky-300 font-extrabold uppercase tracking-wider">TIN NHẮN</span>
                        </div>
                        <div className="my-auto px-1 flex flex-col items-center text-center">
                          <span className="text-[11px] font-black tracking-tight" style={{ color: '#ffffff' }}>
                            Minh
                          </span>
                          <div className="bg-sky-500/25 border border-sky-400/40 rounded-lg px-2 py-0.5 mt-1">
                            <span className="text-[9px] font-bold text-sky-100 leading-tight block">
                              Đến đâu rồi?
                            </span>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          Trả lời nhanh →
                        </span>
                      </motion.div>
                    )}

                    {/* Screen 4: Maps (72 - 84%) */}
                    {activeStory === 4 && (
                      <motion.div
                        key="story-maps"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 w-fit">
                          <Navigation className="w-2.5 h-2.5 text-amber-300 fill-amber-300/30" />
                          <span className="text-[8px] text-amber-300 font-extrabold uppercase tracking-wider">BẢN ĐỒ</span>
                        </div>
                        <div className="my-auto flex flex-col items-center text-center">
                          <span className="text-sm font-black text-amber-300 tracking-tight leading-none">
                            ↰ 120m
                          </span>
                          <span className="text-[11px] font-black tracking-tight mt-1" style={{ color: '#ffffff' }}>
                            Nguyễn Huệ
                          </span>
                          <span className="text-[8px] font-bold text-amber-200/90 mt-0.5">
                            Sau 3 phút
                          </span>
                        </div>
                        <div className="w-12 bg-neutral-800 rounded-full h-1 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full w-[70%]" />
                        </div>
                      </motion.div>
                    )}

                    {/* Screen 5: Music (80 - 88%) */}
                    {activeStory === 5 && (
                      <motion.div
                        key="story-music"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full flex flex-col justify-between items-center text-center py-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 w-fit">
                          <Music className="w-2.5 h-2.5 text-pink-300" />
                          <span className="text-[8px] text-pink-300 font-extrabold uppercase tracking-wider">NOW PLAYING</span>
                        </div>
                        <div className="my-auto flex flex-col items-center text-center">
                          <span className="text-[11px] font-black tracking-tight truncate max-w-[88px] block" style={{ color: '#ffffff' }}>
                            Running Mix
                          </span>
                          <span className="text-[8px] text-pink-300 font-bold mt-0.5">
                            Apple Music
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                          <Volume2 className="w-3 h-3 text-white/90" style={{ color: '#ffffff' }} />
                        </div>
                      </motion.div>
                    )}

                    {/* Screen 6: Apple Logo Conclusion (>= 88% - All cards faded out) */}
                    {activeStory === 6 && (
                      <motion.div
                        key="story-apple-logo"
                        initial={{ opacity: 0, scale: 0.82 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.82 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full flex flex-col items-center justify-center text-center p-2 relative"
                      >
                        {/* Specular soft glow behind Apple Logo */}
                        <div className="absolute w-14 h-14 rounded-full bg-white/15 blur-md pointer-events-none" />

                        {/* Iconic Apple Logo */}
                        <motion.svg
                          initial={{ scale: 0.82, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className="w-10 h-10 text-white fill-white relative z-10 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.25-.57 2.95-1.39z"
                          />
                        </motion.svg>

                        {/* Subtle Premium "WATCH SE" Branding */}
                        <motion.span
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="text-[8px] font-bold tracking-[0.25em] text-white/90 uppercase mt-2 font-mono"
                          style={{ color: 'rgba(255,255,255,0.9)' }}
                        >
                          WATCH SE
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Status Pill: CELLULAR ACTIVE */}
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-700 ${
                  isCellularActivated
                    ? 'bg-cyan-50/90 border border-cyan-400/50 shadow-[0_0_14px_rgba(6,182,212,0.22)]'
                    : 'bg-neutral-100/70 border border-neutral-200/80 shadow-none'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    isCellularActivated ? 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-neutral-400'
                  }`}
                />
                <span
                  className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-500 ${
                    isCellularActivated ? 'text-cyan-800 opacity-100' : 'text-neutral-500 opacity-40'
                  }`}
                >
                  CELLULAR ACTIVE
                </span>
              </div>
            </motion.div>

            {/* ─── 4 MINI APPLE WATCH UI SURFACES SPATIALLY POSITIONED ─── */}

            {/* Surface 1: CALL (Bên trái Watch) */}
            <motion.div
              style={{ opacity: callOpacity, scale: callScale, x: callX }}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 pointer-events-none w-[230px]"
            >
              <div className="se3-mini-surface p-4 rounded-[22px] border border-emerald-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.08),0_0_20px_rgba(16,185,129,0.12)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <Phone className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-700 tracking-wider uppercase">CUỘC GỌI ĐẾN</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">00:04</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111113] leading-tight">Nguyễn Minh</h4>
                  <p className="text-[11px] text-[#111113]/70">Cuộc gọi trực tiếp qua Cellular</p>
                </div>
                {/* Mini Audio Equalizer & Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-black/[0.05]">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="w-1 h-4 rounded-full bg-emerald-500 animate-pulse delay-75" />
                    <span className="w-1 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                    <span className="text-[10px] text-emerald-800 font-semibold ml-1">Đang nói</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                      <Phone className="w-2.5 h-2.5 text-red-600 rotate-[135deg]" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <Phone className="w-2.5 h-2.5 text-emerald-700" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Surface 2: MESSAGES (Phía trên Watch) */}
            <motion.div
              style={{ opacity: msgOpacity, scale: msgScale, y: msgY }}
              className="absolute left-1/2 -translate-x-1/2 top-3 z-30 pointer-events-none w-[260px]"
            >
              <div className="se3-mini-surface p-3.5 rounded-[22px] border border-sky-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.08),0_0_20px_rgba(56,189,248,0.12)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200">
                    <MessageSquare className="w-3 h-3 text-sky-600" />
                    <span className="text-[9px] font-black text-sky-700 tracking-wider uppercase">TIN NHẮN MỚI</span>
                  </div>
                  <span className="text-[10px] text-sky-600 font-medium">Vừa xong</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#111113]">Minh</div>
                    <p className="text-[11px] text-[#111113] leading-snug bg-neutral-100/90 rounded-xl px-2.5 py-1.5 mt-1 border border-black/[0.04]">
                      “Đến đâu rồi? Hẹn gặp ở bờ hồ nhé!”
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-sky-700 font-semibold px-1">
                  <span>Trả lời nhanh: Đang tới ngay →</span>
                </div>
              </div>
            </motion.div>

            {/* Surface 3: MAPS (Bên phải Watch) */}
            <motion.div
              style={{ opacity: mapsOpacity, scale: mapsScale, x: mapsX }}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-none w-[230px]"
            >
              <div className="se3-mini-surface p-4 rounded-[22px] border border-amber-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.08),0_0_20px_rgba(245,158,11,0.12)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    <Navigation className="w-3 h-3 text-amber-600" />
                    <span className="text-[9px] font-black text-amber-800 tracking-wider uppercase">BẢN ĐỒ CỔ TAY</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold">3 phút</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-600">↰ 120m</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111113] leading-tight">Nguyễn Huệ</h4>
                  <p className="text-[11px] text-[#111113]/70">Rung phản hồi Taptic Engine</p>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[70%]" />
                </div>
              </div>
            </motion.div>

            {/* Surface 4: MUSIC & APPLE PAY (Phía dưới Watch) */}
            <motion.div
              style={{ opacity: musicOpacity, scale: musicScale, y: musicY }}
              className="absolute left-1/2 -translate-x-1/2 bottom-2 z-30 pointer-events-none w-[280px]"
            >
              <div className="se3-mini-surface p-3.5 rounded-[22px] border border-pink-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.08),0_0_20px_rgba(236,72,153,0.12)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200">
                    <Music className="w-3 h-3 text-pink-600" />
                    <span className="text-[9px] font-black text-pink-700 tracking-wider uppercase">NOW PLAYING</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[9px] font-bold text-purple-700">
                    <Wifi className="w-2.5 h-2.5" />
                    <span>Pay</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#111113] truncate">Running Mix</h4>
                    <p className="text-[10px] text-[#111113]/70 truncate">Apple Music · AirPods</p>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Volume2 className="w-3 h-3 text-neutral-600" />
                  </div>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden relative">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full w-[45%]" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Cellular Disclaimer */}
          <motion.div
            style={{ opacity: disclaimerOpacity }}
            className="max-w-xl mx-auto px-5 py-2.5 rounded-full flex items-center justify-center gap-3 text-center bg-neutral-100 border border-neutral-200 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <p className="text-xs se3-text-black-luminous text-[#111113] font-medium">
              Yêu cầu Apple Watch SE 3 phiên bản GPS + Cellular và gói cước nhà mạng hỗ trợ eSIM.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* MOBILE VIEW: VERTICAL NATURAL SCROLL (Bỏ sticky phức tạp trên mobile) */}
      <div className="block md:hidden px-6 py-16">
        <div className="text-center max-w-md mx-auto mb-10">
          <span className="se3-eyebrow text-[11px] font-bold tracking-[0.2em] text-[#0071e3] uppercase mb-2 block">
            {connectivity.eyebrow}
          </span>
          <h3 className="se3-heading se3-text-black-luminous text-3xl font-black text-[#111113] tracking-tight leading-tight mb-1">
            {connectivity.headline}
          </h3>
          <p className="se3-heading text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            {connectivity.headlineSub}
          </p>
          <p className="se3-body text-xs se3-text-black-luminous text-[#111113] leading-relaxed">
            {connectivity.description}
          </p>
        </div>

        {/* Mobile Center Watch */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-48 h-56 flex items-center justify-center">
            <img
              src="/images/watch/se3-chassis-front.png"
              alt="Apple Watch SE 3 Cellular"
              className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)] pointer-events-none select-none"
            />
            {/* Live OLED Screen on Mobile */}
            <div className="absolute w-[68px] h-[84px] rounded-[16px] bg-black overflow-hidden flex flex-col justify-between p-1.5 z-10 text-center">
              <div className="flex items-center justify-between w-full px-0.5">
                <span className="text-[7px] text-white/80 font-semibold">10:09</span>
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
                  <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
                  <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
                  <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center my-auto mx-auto shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                <Signal className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
              </div>
              <span className="text-[6px] font-bold text-cyan-300 tracking-wider uppercase">
                CELLULAR
              </span>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] font-bold text-cyan-700 tracking-wider uppercase">CELLULAR ACTIVE</span>
          </div>
        </div>

        {/* 3 Sequential Micro-Story Feature Cards */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {/* 1. Call Demo */}
          <div className="se3-bcs-card p-4 rounded-2xl flex items-center gap-3.5 border-emerald-500/25 bg-emerald-50/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">CUỘC GỌI ĐỘC LẬP</p>
              <p className="text-sm font-bold se3-text-black-luminous text-[#111113] mt-0.5">Nghe gọi trực tiếp từ cổ tay</p>
              <p className="text-[11px] se3-text-black-luminous text-[#111113] mt-0.5">Không cần iPhone bên cạnh khi chạy bộ hay đi chợ.</p>
            </div>
          </div>

          {/* 2. Maps Demo */}
          <div className="se3-bcs-card p-4 rounded-2xl flex items-center gap-3.5 border-amber-500/25 bg-amber-50/40">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">BẢN ĐỒ & CHỈ ĐƯỜNG</p>
              <p className="text-sm font-bold se3-text-black-luminous text-[#111113] mt-0.5">Rung phản hồi Taptic Engine</p>
              <p className="text-[11px] se3-text-black-luminous text-[#111113] mt-0.5">Chỉ đường từng ngã rẽ mà không cần nhìn màn hình điện thoại.</p>
            </div>
          </div>

          {/* 3. Music Demo */}
          <div className="se3-bcs-card p-4 rounded-2xl flex items-center gap-3.5 border-pink-500/25 bg-pink-50/40">
            <div className="w-10 h-10 rounded-xl bg-pink-100/80 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">ÂM NHẠC & PODCASTS</p>
              <p className="text-sm font-bold se3-text-black-luminous text-[#111113] mt-0.5">Stream trực tuyến qua Cellular</p>
              <p className="text-[11px] se3-text-black-luminous text-[#111113] mt-0.5">Hàng triệu bài hát từ Apple Music kết nối trực tiếp với AirPods.</p>
            </div>
          </div>

          {/* Messages & Pay Badges */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="se3-bcs-card p-3 rounded-xl flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-xs font-bold se3-text-black-luminous text-[#111113]">Tin nhắn</span>
            </div>
            <div className="se3-bcs-card p-3 rounded-xl flex items-center gap-2">
              <Wifi className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-xs font-bold se3-text-black-luminous text-[#111113]">Apple Pay</span>
            </div>
          </div>

          {/* Mobile Technical Disclaimer */}
          <p className="text-center text-[10px] se3-text-black-luminous text-[#111113]/70 mt-6 max-w-xs mx-auto">
            Yêu cầu Apple Watch SE 3 phiên bản GPS + Cellular và gói cước nhà mạng hỗ trợ eSIM.
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto h-px bg-black/[0.06]" />

      {/* ─────────────────────────────────────────────────────────────
          CHAPTER 03: SAFETY (Quiet, Serious, Sequential Reveal, Trust)
          ───────────────────────────────────────────────────────────── */}
      {/* DESKTOP VIEW: LIGHT STICKY STORY (~360vh - Extended Display Runway) */}
      <div ref={safetyRef} className="relative hidden md:block se3-bcs-safety-bg" style={{ height: '360vh' }}>
        <div className="sticky top-0 h-screen flex flex-col justify-between py-10 px-8 overflow-hidden">
          {/* Top Section: Eyebrow + 2-Beat Headline + Subtitle */}
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="se3-eyebrow text-[11px] font-bold tracking-[0.25em] text-neutral-500 uppercase mb-3 block"
            >
              {safety.eyebrow}
            </motion.span>

            {/* Headline revealed in 2 distinct beats */}
            <h3 className="se3-heading se3-text-black-luminous text-3xl lg:text-4xl xl:text-5xl font-black text-[#111113] tracking-tight leading-[1.18] mb-2">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {safety.headline}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="block font-bold text-[#111113]/90"
              >
                {safety.headlineSub}
              </motion.span>
            </h3>

            {/* Subtitle appearing last (700-900ms total entrance) */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="se3-body text-xs lg:text-sm se3-text-black-luminous text-[#111113]/80 max-w-lg leading-relaxed"
            >
              {safety.description}
            </motion.p>
          </div>

          {/* Central Stage: 3 Feature Rows (Left 7 cols) + Quiet Apple Watch Safety Screen (Right 5 cols) */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-12 gap-8 lg:gap-14 items-center my-auto">
            {/* Left Column: 3 Sequential Feature Rows with Active Row Focus */}
            <div className="col-span-7 flex flex-col gap-1.5">
              {/* Row 01: Phát Hiện Ngã */}
              <motion.div
                style={{ opacity: safetyRow1Opacity }}
                onClick={() => setActiveSafetyStep(0)}
                className={`group flex flex-col transition-all duration-300 py-3.5 px-3.5 -mx-3.5 rounded-2xl cursor-pointer select-none ${
                  activeSafetyStep === 0
                    ? 'bg-white/80 border border-neutral-200/90 shadow-sm backdrop-blur-xs'
                    : 'hover:bg-neutral-100/50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`text-xs font-mono font-bold tabular-nums shrink-0 mt-2 transition-colors duration-300 ${
                      activeSafetyStep === 0 ? 'text-rose-600' : 'text-neutral-400'
                    }`}
                  >
                    01
                  </span>
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        activeSafetyStep === 0
                          ? 'border border-rose-500/90 bg-rose-50/90 text-rose-600 shadow-xs scale-105'
                          : 'border border-neutral-300/80 bg-neutral-100/60 text-neutral-400 shadow-none group-hover:border-neutral-400'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    {activeSafetyStep === 0 && (
                      <motion.span
                        key="halo-fall"
                        initial={{ scale: 0.92, opacity: 0.5 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-xl border border-rose-500/80 pointer-events-none"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`se3-heading text-base lg:text-lg font-bold tracking-tight transition-colors duration-300 ${
                          activeSafetyStep === 0 ? 'text-[#111113]' : 'text-neutral-600'
                        }`}
                      >
                        {safety.features[0].title}
                      </h4>
                      {activeSafetyStep === 0 && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0"
                        >
                          <span>Hiển thị bên phải</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.span>
                      )}
                    </div>
                    <p className="se3-body text-xs text-neutral-600 leading-relaxed mt-0.5 max-w-md">
                      {safety.features[0].sub}
                    </p>
                  </div>
                </div>
                {/* Divider Line Expanding Left-to-Right */}
                <motion.div
                  style={{ scaleX: safetyLine1Scale, transformOrigin: 'left' }}
                  className="w-full h-px bg-neutral-200/90 mt-3"
                />
              </motion.div>

              {/* Row 02: Phát Hiện Va Chạm */}
              <motion.div
                style={{ opacity: safetyRow2Opacity }}
                onClick={() => setActiveSafetyStep(1)}
                className={`group flex flex-col transition-all duration-300 py-3.5 px-3.5 -mx-3.5 rounded-2xl cursor-pointer select-none ${
                  activeSafetyStep === 1
                    ? 'bg-white/80 border border-neutral-200/90 shadow-sm backdrop-blur-xs'
                    : 'hover:bg-neutral-100/50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`text-xs font-mono font-bold tabular-nums shrink-0 mt-2 transition-colors duration-300 ${
                      activeSafetyStep === 1 ? 'text-amber-600' : 'text-neutral-400'
                    }`}
                  >
                    02
                  </span>
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        activeSafetyStep === 1
                          ? 'border border-amber-500/90 bg-amber-50/90 text-amber-600 shadow-xs scale-105'
                          : 'border border-neutral-300/80 bg-neutral-100/60 text-neutral-400 shadow-none group-hover:border-neutral-400'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    {activeSafetyStep === 1 && (
                      <motion.span
                        key="halo-crash"
                        initial={{ scale: 0.92, opacity: 0.5 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-xl border border-amber-500/80 pointer-events-none"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`se3-heading text-base lg:text-lg font-bold tracking-tight transition-colors duration-300 ${
                          activeSafetyStep === 1 ? 'text-[#111113]' : 'text-neutral-600'
                        }`}
                      >
                        {safety.features[1].title}
                      </h4>
                      {activeSafetyStep === 1 && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0"
                        >
                          <span>Hiển thị bên phải</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.span>
                      )}
                    </div>
                    <p className="se3-body text-xs text-neutral-600 leading-relaxed mt-0.5 max-w-md">
                      {safety.features[1].sub}
                    </p>
                  </div>
                </div>
                {/* Divider Line Expanding Left-to-Right */}
                <motion.div
                  style={{ scaleX: safetyLine2Scale, transformOrigin: 'left' }}
                  className="w-full h-px bg-neutral-200/90 mt-3"
                />
              </motion.div>

              {/* Row 03: SOS Khẩn Cấp */}
              <motion.div
                style={{ opacity: safetyRow3Opacity }}
                onClick={() => setActiveSafetyStep(2)}
                className={`group flex flex-col transition-all duration-300 py-3.5 px-3.5 -mx-3.5 rounded-2xl cursor-pointer select-none ${
                  activeSafetyStep >= 2
                    ? 'bg-white/80 border border-neutral-200/90 shadow-sm backdrop-blur-xs'
                    : 'hover:bg-neutral-100/50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`text-xs font-mono font-bold tabular-nums shrink-0 mt-2 transition-colors duration-300 ${
                      activeSafetyStep >= 2 ? 'text-red-600' : 'text-neutral-400'
                    }`}
                  >
                    03
                  </span>
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        activeSafetyStep >= 2
                          ? 'border border-red-500/90 bg-red-50/90 text-red-600 shadow-xs scale-105'
                          : 'border border-neutral-300/80 bg-neutral-100/60 text-neutral-400 shadow-none group-hover:border-neutral-400'
                      }`}
                    >
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    {activeSafetyStep >= 2 && (
                      <motion.span
                        key="halo-sos"
                        initial={{ scale: 0.92, opacity: 0.5 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-xl border border-red-500/80 pointer-events-none"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`se3-heading text-base lg:text-lg font-bold tracking-tight transition-colors duration-300 ${
                          activeSafetyStep >= 2 ? 'text-[#111113]' : 'text-neutral-600'
                        }`}
                      >
                        {safety.features[2].title}
                      </h4>
                      {activeSafetyStep >= 2 && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 shrink-0"
                        >
                          <span>Hiển thị bên phải</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.span>
                      )}
                    </div>
                    <p className="se3-body text-xs text-neutral-600 leading-relaxed mt-0.5 max-w-md">
                      {safety.features[2].sub}
                    </p>
                  </div>
                </div>
                {/* Divider Line Expanding Left-to-Right */}
                <motion.div
                  style={{ scaleX: safetyLine3Scale, transformOrigin: 'left' }}
                  className="w-full h-px bg-neutral-200/90 mt-3"
                />
              </motion.div>
            </div>

            {/* Right Column: Dynamic Detail Card with Floating Effect & Realistic Ground Shadow */}
            <div className="col-span-5 flex flex-col justify-center items-center relative">
              {/* Floating Card Wrapper */}
              <motion.div
                animate={{ y: [-7, 7, -7] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full max-w-[420px] mx-auto relative z-10"
              >
                {/* Card Container with Morphing Accent Border & Ambient Shadow - Locked Dimensions */}
                <div
                  className={`w-full h-[450px] max-h-[450px] bg-white/95 backdrop-blur-2xl rounded-[28px] relative flex flex-col justify-between select-none overflow-hidden transition-colors duration-500 ${
                    activeSafetyStep === 0
                      ? 'border border-rose-200/90 shadow-[0_28px_60px_-14px_rgba(244,63,94,0.15),0_10px_20px_-6px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)]'
                      : activeSafetyStep === 1
                      ? 'border border-amber-200/90 shadow-[0_28px_60px_-14px_rgba(245,158,11,0.15),0_10px_20px_-6px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)]'
                      : 'border border-red-200/90 shadow-[0_28px_60px_-14px_rgba(239,68,68,0.16),0_10px_20px_-6px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* Top Animated Accent Bar Matching Left Active Row */}
                  <div
                    className={`h-1.5 w-full shrink-0 bg-gradient-to-r transition-all duration-500 ${
                      activeSafetyStep === 0
                        ? 'from-rose-500 via-pink-500 to-rose-400'
                        : activeSafetyStep === 1
                        ? 'from-amber-500 via-orange-500 to-amber-400'
                        : 'from-red-600 via-rose-600 to-red-500'
                    }`}
                  />

                  {/* Locked Height Viewport for Flawless Non-Shifting Transitions */}
                  <div className="relative w-full flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {/* Card State 0: Chi tiết Phát Hiện Ngã */}
                      {activeSafetyStep === 0 && (
                        <motion.div
                          key="safety-detail-fall"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 p-6 lg:p-7 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Badge */}
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 }}
                              className="flex items-center justify-between mb-3.5"
                            >
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold tracking-wider uppercase font-mono">
                                <Shield className="w-3.5 h-3.5 text-rose-600" />
                                <span>01 — CƠ CHẾ PHÁT HIỆN NGÃ</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-rose-600/80 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                01 / 03
                              </span>
                            </motion.div>

                            {/* Title & Description */}
                            <motion.h4
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.08 }}
                              className="se3-heading text-lg lg:text-xl font-bold text-[#111113] tracking-tight leading-snug mb-2"
                            >
                              Nhận diện cú rơi & va đập mạnh
                            </motion.h4>
                            <motion.p
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.12 }}
                              className="se3-body text-xs text-neutral-600 leading-relaxed mb-4"
                            >
                              Khi phát hiện bạn ngã mạnh, Apple Watch sẽ lập tức rung Taptic và phát âm thanh cảnh báo tăng dần trên cổ tay.
                            </motion.p>

                            {/* Feature bullets with cascade reveal */}
                            <div className="flex flex-col gap-2.5 mb-4">
                              {[
                                'Tự động gọi cấp cứu 112 nếu bạn bất động sau 60 giây.',
                                'Gửi tin nhắn kèm tọa độ GPS trực tiếp cho người liên hệ khẩn cấp.',
                                'Tự động bật chế độ phát hiện ngã khi bắt đầu các bài tập ngoài trời.',
                              ].map((bullet, idx) => (
                                <motion.div
                                  key={`fall-bullet-${idx}`}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: 0.15 + idx * 0.06,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-xs" />
                                  <span>{bullet}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom Specs Grid */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.25 }}
                            className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-neutral-100 mt-auto"
                          >
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Thời gian chờ</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">60 Giây</span>
                            </div>
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Cảm biến lực G</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">Tối đa 256G</span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Card State 1: Chi tiết Phát Hiện Va Chạm */}
                      {activeSafetyStep === 1 && (
                        <motion.div
                          key="safety-detail-crash"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 p-6 lg:p-7 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Badge */}
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 }}
                              className="flex items-center justify-between mb-3.5"
                            >
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold tracking-wider uppercase font-mono">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                <span>02 — CÔNG NGHỆ SENSOR FUSION</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-amber-600/80 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                02 / 03
                              </span>
                            </motion.div>

                            {/* Title & Description */}
                            <motion.h4
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.08 }}
                              className="se3-heading text-lg lg:text-xl font-bold text-[#111113] tracking-tight leading-snug mb-2"
                            >
                              Phát hiện tai nạn ô tô nghiêm trọng
                            </motion.h4>
                            <motion.p
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.12 }}
                              className="se3-body text-xs text-neutral-600 leading-relaxed mb-4"
                            >
                              Hợp nhất dữ liệu từ con quay hồi chuyển, gia tốc kế và micrô để nhận diện chính xác các vụ tai nạn giao thông nghiêm trọng.
                            </motion.p>

                            {/* Feature bullets with cascade reveal */}
                            <div className="flex flex-col gap-2.5 mb-4">
                              {[
                                'Nhận diện 4 loại va chạm: đâm trực diện, tông sau, hông xe và lật xe.',
                                'Khí áp kế nhận biết sự thay đổi áp suất khi túi khí ô tô bung.',
                                'Đếm ngược cảnh báo 10 giây trước khi tự động liên hệ trung tâm cứu hộ.',
                              ].map((bullet, idx) => (
                                <motion.div
                                  key={`crash-bullet-${idx}`}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: 0.15 + idx * 0.06,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-xs" />
                                  <span>{bullet}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom Specs Grid */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.25 }}
                            className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-neutral-100 mt-auto"
                          >
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Loại tai nạn</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">4 Dạng sự cố</span>
                            </div>
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Dữ liệu kiểm thử</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">1M+ giờ lái xe</span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Card State 2 & 3: Chi tiết SOS Khẩn Cấp */}
                      {activeSafetyStep >= 2 && (
                        <motion.div
                          key="safety-detail-sos"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 p-6 lg:p-7 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Badge */}
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 }}
                              className="flex items-center justify-between mb-3.5"
                            >
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-[10px] font-bold tracking-wider uppercase font-mono">
                                <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                                <span>03 — KẾT NỐI CỨU HỘ TOÀN CẦU</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-red-600/80 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                03 / 03
                              </span>
                            </motion.div>

                            {/* Title & Description */}
                            <motion.h4
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.08 }}
                              className="se3-heading text-lg lg:text-xl font-bold text-[#111113] tracking-tight leading-snug mb-2"
                            >
                              Cứu trợ tức thì với một nút bấm
                            </motion.h4>
                            <motion.p
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.12 }}
                              className="se3-body text-xs text-neutral-600 leading-relaxed mb-4"
                            >
                              Chỉ cần nhấn và giữ nút sườn để gọi ngay đến các dịch vụ cấp cứu địa phương mà không cần lấy điện thoại ra khỏi túi.
                            </motion.p>

                            {/* Feature bullets with cascade reveal */}
                            <div className="flex flex-col gap-2.5 mb-4">
                              {[
                                'Hiển thị ID Y Tế trên màn hình giúp nhân viên cứu hộ sơ cứu chuẩn xác.',
                                'Cập nhật liên tục vị trí thời gian thực cho người thân khẩn cấp.',
                                'Hỗ trợ cuộc gọi khẩn cấp quốc tế ngay cả khi đang chuyển vùng nước ngoài.',
                              ].map((bullet, idx) => (
                                <motion.div
                                  key={`sos-bullet-${idx}`}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: 0.15 + idx * 0.06,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-xs" />
                                  <span>{bullet}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom Specs Grid */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.25 }}
                            className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-neutral-100 mt-auto"
                          >
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Thao tác gọi</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">Giữ nút sườn</span>
                            </div>
                            <div className="bg-neutral-50/90 rounded-2xl p-2.5 border border-neutral-100 transition-colors hover:bg-neutral-100/70">
                              <span className="text-[10px] text-neutral-400 font-medium block">Dữ liệu gửi kèm</span>
                              <span className="text-sm font-bold text-[#111113] font-mono">GPS + ID Y Tế</span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Multi-layered Realistic Floating Ground Shadow */}
              <div className="w-full max-w-[400px] h-10 relative flex items-center justify-center pointer-events-none select-none -mt-2">
                <motion.div
                  animate={{
                    scaleX: [1.05, 0.95, 1.05],
                    scaleY: [1.1, 0.9, 1.1],
                    opacity: [0.65, 0.95, 0.65],
                  }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-full h-full relative flex items-center justify-center"
                >
                  {/* Outer atmospheric ambient floor glow */}
                  <div
                    className="absolute w-[94%] h-9 rounded-[100%] filter blur-[16px] opacity-40"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.08) 55%, transparent 75%)',
                    }}
                  />
                  {/* Mid penumbra shadow */}
                  <div
                    className="absolute w-[82%] h-6 rounded-[100%] filter blur-[9px] opacity-65"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.15) 55%, transparent 75%)',
                    }}
                  />
                  {/* Inner dark core contact shadow (Umbra) */}
                  <div
                    className="absolute w-[68%] h-3.5 rounded-[100%] filter blur-[4px] opacity-80"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 65%, transparent 85%)',
                    }}
                  />
                  {/* Razor contact focal center */}
                  <div
                    className="absolute w-[46%] h-2 rounded-[100%] filter blur-[1.5px] opacity-85"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 70%, transparent 90%)',
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Bottom Emotional Conclusion & Action Button (Reveals only after SOS, 0.76 -> 0.88) */}
          <motion.div
            style={{ opacity: safetyEndingOpacity, y: safetyEndingY }}
            className="text-center max-w-xl mx-auto pb-4"
          >
            <p className="se3-heading text-sm lg:text-base font-bold se3-text-black-luminous text-[#111113] leading-relaxed mb-4">
              {safety.conclusion}
            </p>
            <button
              type="button"
              onClick={onOpenSpecs}
              className="bg-[#1d1d1f] hover:bg-black text-white px-6 py-2.5 rounded-full font-bold text-xs tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Xem đầy đủ thông số kỹ thuật</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* MOBILE VIEW: VERTICAL QUIET REVEAL */}
      <div className="block md:hidden px-6 py-20 se3-bcs-safety-bg">
        <div className="text-center max-w-md mx-auto mb-12">
          <span className="se3-eyebrow text-[11px] font-bold tracking-[0.25em] text-neutral-500 uppercase mb-3 block">
            {safety.eyebrow}
          </span>
          <h3 className="se3-heading se3-text-black-luminous text-3xl font-black text-[#111113] tracking-tight leading-tight mb-2">
            <span>{safety.headline}</span>
            <br />
            <span className="font-bold text-[#111113]/90">{safety.headlineSub}</span>
          </h3>
          <p className="se3-body text-xs se3-text-black-luminous text-[#111113]/80 leading-relaxed max-w-xs mx-auto">
            {safety.description}
          </p>
        </div>

        {/* 3 Sequential Feature Rows */}
        <div className="flex flex-col gap-5 max-w-sm mx-auto">
          {safety.features.map((feature, i) => {
            const FeatureIcon = feature.icon as React.ComponentType<{ className?: string }>;
            return (
              <motion.div
                key={`m-safety-${feature.id}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4 pb-4 border-b border-neutral-200/80"
              >
                <span className="text-xs font-mono font-bold text-neutral-400 tabular-nums shrink-0 mt-1">
                  0{i + 1}
                </span>
                <div className="w-8 h-8 rounded-lg border border-neutral-900 bg-white text-[#111113] shadow-xs flex items-center justify-center shrink-0">
                  <FeatureIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="se3-heading text-sm font-bold text-[#111113] tracking-tight">
                    {feature.title}
                  </h4>
                  <p className="se3-body text-[11px] text-neutral-600 leading-relaxed mt-0.5">
                    {feature.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Conclusion & Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center mt-12 max-w-xs mx-auto"
        >
          <p className="se3-heading text-xs font-bold text-[#111113] leading-relaxed mb-5">
            {safety.conclusion}
          </p>
          <button
            type="button"
            onClick={onOpenSpecs}
            className="bg-[#1d1d1f] hover:bg-black text-white px-6 py-2.5 rounded-full font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Xem đầy đủ thông số kỹ thuật</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Smooth feather gradient transition into Final CTA */}
      <div className="w-full h-24 bg-gradient-to-b from-[#f8f8fa] via-[#ECEEF1]/60 to-[#0a0a0c] pointer-events-none" />
    </section>
  );
}
