import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useMemo, useEffect, useState, type ComponentType } from 'react';
import {
  User,
  Smartphone,
  Laptop,
  Palette,
  Gamepad2,
  Camera,
  Zap,
  BatteryCharging,
  Monitor,
  type LucideProps,
} from 'lucide-react';

export type UsageType = 'everyday' | 'work' | 'creative' | 'gaming';
export type PriorityType = 'camera' | 'performance' | 'battery' | 'display';

interface FinalCTAVisualProps {
  usage: UsageType | null;
  priority: PriorityType | null;
  sweepTrigger?: number;
  mouseOffset?: { x: number; y: number };
}

interface GlowScheme {
  primary: string;
  secondary: string;
  ring: string;
  coreGlow: string;
  tag: string;
}

const USAGE_THEMES: Record<UsageType, GlowScheme> = {
  everyday: {
    primary: 'rgba(56, 189, 248, 0.22)',
    secondary: 'rgba(148, 163, 184, 0.14)',
    ring: 'rgba(186, 230, 253, 0.30)',
    coreGlow: 'rgba(56, 189, 248, 0.45)',
    tag: 'Cân bằng & Linh hoạt',
  },
  work: {
    primary: 'rgba(59, 130, 246, 0.26)',
    secondary: 'rgba(99, 102, 241, 0.16)',
    ring: 'rgba(147, 197, 253, 0.32)',
    coreGlow: 'rgba(59, 130, 246, 0.50)',
    tag: 'Năng suất & Ổn định',
  },
  creative: {
    primary: 'rgba(168, 85, 247, 0.28)',
    secondary: 'rgba(236, 72, 153, 0.18)',
    ring: 'rgba(216, 180, 254, 0.34)',
    coreGlow: 'rgba(168, 85, 247, 0.52)',
    tag: 'Sáng tạo & Đột phá',
  },
  gaming: {
    primary: 'rgba(99, 102, 241, 0.32)',
    secondary: 'rgba(244, 63, 94, 0.16)',
    ring: 'rgba(165, 180, 252, 0.35)',
    coreGlow: 'rgba(99, 102, 241, 0.56)',
    tag: 'Tối đa công suất',
  },
};

const DEFAULT_THEME: GlowScheme = {
  primary: 'rgba(148, 163, 184, 0.16)',
  secondary: 'rgba(56, 189, 248, 0.10)',
  ring: 'rgba(255, 255, 255, 0.18)',
  coreGlow: 'rgba(255, 255, 255, 0.3)',
  tag: 'Định hình nhu cầu',
};

// Deterministic status label mapping
const DYNAMIC_TAGS: Record<string, string> = {
  'gaming-performance': 'Tối đa công suất',
  'gaming-display': 'Tần số quét 120Hz',
  'gaming-battery': 'Chiến game bền bỉ',
  'gaming-camera': 'Livestream sắc nét',
  'creative-camera': 'Sẵn sàng sáng tạo',
  'creative-performance': 'Ý tưởng liền mạch',
  'creative-display': 'Chuẩn sắc điện ảnh',
  'creative-battery': 'Sáng tạo không gián đoạn',
  'work-performance': 'Nhanh cho mọi tác vụ',
  'work-battery': 'Bền bỉ cả ngày dài',
  'work-display': 'Không gian làm việc rõ nét',
  'work-camera': 'Họp trực tuyến chuẩn 4K',
  'everyday-battery': 'Năng lượng cả ngày',
  'everyday-display': 'Trọn vẹn mỗi ngày',
  'everyday-camera': 'Lưu giữ từng khoảnh khắc',
  'everyday-performance': 'Mượt mà mọi trải nghiệm',
};

// Central Usage Icon Mapping (Orbit A)
const USAGE_ICON_MAP: Record<UsageType, ComponentType<LucideProps>> = {
  everyday: Smartphone,
  work: Laptop,
  creative: Palette,
  gaming: Gamepad2,
};

// Orbit Priority Icon Mapping (Orbit B)
const PRIORITY_ICON_MAP: Record<PriorityType, ComponentType<LucideProps>> = {
  camera: Camera,
  performance: Zap,
  battery: BatteryCharging,
  display: Monitor,
};

// Static deterministic perimeter data nodes
const DATA_NODES = [
  { cx: 65, cy: 85, r: 2, id: 'n1' },
  { cx: 275, cy: 85, r: 2, id: 'n2' },
  { cx: 295, cy: 195, r: 2, id: 'n3' },
  { cx: 45, cy: 205, r: 2, id: 'n4' },
  { cx: 115, cy: 305, r: 2, id: 'n5' },
  { cx: 225, cy: 300, r: 2, id: 'n6' },
];

// Number of sample steps for orbital path calculation (smooth 60fps interpolation)
const NUM_STEPS = 64;

// Orbit A Parameters: Tilted Ellipse -28deg, rx=120, ry=66
const TILT_A_RAD = (-28 * Math.PI) / 180;
const COS_A = Math.cos(TILT_A_RAD);
const SIN_A = Math.sin(TILT_A_RAD);
const RX_A = 120;
const RY_A = 66;

const ORBIT_A_POINTS = Array.from({ length: NUM_STEPS + 1 }, (_, i) => {
  const alpha = (i / NUM_STEPS) * 2 * Math.PI;
  const u = RX_A * Math.cos(alpha);
  const v = RY_A * Math.sin(alpha);
  const x = 170 + u * COS_A - v * SIN_A;
  const y = 170 + u * SIN_A + v * COS_A;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
});

const ORBIT_A_X = ORBIT_A_POINTS.map((p) => p.x);
const ORBIT_A_Y = ORBIT_A_POINTS.map((p) => p.y);

// Orbit B Parameters: Tilted Ellipse +36deg, rx=114, ry=60, Initial Phase offset = PI
const TILT_B_RAD = (36 * Math.PI) / 180;
const COS_B = Math.cos(TILT_B_RAD);
const SIN_B = Math.sin(TILT_B_RAD);
const RX_B = 114;
const RY_B = 60;
const PHASE_B_OFFSET = Math.PI;

const ORBIT_B_POINTS = Array.from({ length: NUM_STEPS + 1 }, (_, i) => {
  const alpha = PHASE_B_OFFSET + (i / NUM_STEPS) * 2 * Math.PI;
  const u = RX_B * Math.cos(alpha);
  const v = RY_B * Math.sin(alpha);
  const x = 170 + u * COS_B - v * SIN_B;
  const y = 170 + u * SIN_B + v * COS_B;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
});

const ORBIT_B_X = ORBIT_B_POINTS.map((p) => p.x);
const ORBIT_B_Y = ORBIT_B_POINTS.map((p) => p.y);

export function FinalCTAVisual({
  usage,
  priority,
  sweepTrigger = 0,
  mouseOffset = { x: 0, y: 0 },
}: FinalCTAVisualProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const [pulseActive, setPulseActive] = useState(false);

  // Trigger quick core pulse upon selection change
  useEffect(() => {
    if (usage || priority) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 450);
      return () => clearTimeout(timer);
    }
  }, [usage, priority]);

  const currentTheme = useMemo(() => {
    if (usage && USAGE_THEMES[usage]) {
      return USAGE_THEMES[usage];
    }
    return DEFAULT_THEME;
  }, [usage]);

  const dynamicTag = useMemo(() => {
    const key = `${usage || ''}-${priority || ''}`;
    if (DYNAMIC_TAGS[key]) return DYNAMIC_TAGS[key];
    if (usage && USAGE_THEMES[usage]) return USAGE_THEMES[usage].tag;
    return DEFAULT_THEME.tag;
  }, [usage, priority]);

  // Usage Icon (Orbit A)
  const UsageIcon = usage ? USAGE_ICON_MAP[usage] : Smartphone;

  // Priority Icon (Orbit B)
  const PriorityIcon = priority ? PRIORITY_ICON_MAP[priority] : Zap;

  // Pointer parallax offsets (subtle: 1.5px - 5px)
  const parallaxCore = shouldReduceMotion ? { x: 0, y: 0 } : { x: mouseOffset.x * 4.5, y: mouseOffset.y * 4.5 };
  const parallaxRings = shouldReduceMotion ? { x: 0, y: 0 } : { x: mouseOffset.x * 2.5, y: mouseOffset.y * 2.5 };
  const parallaxField = shouldReduceMotion ? { x: 0, y: 0 } : { x: mouseOffset.x * 1.2, y: mouseOffset.y * 1.2 };

  return (
    <div className="final-cta-visual" aria-hidden="true">
      {/* Background Soft Radial Glow Orbs */}
      <motion.div
        className="final-cta-visual__orb-primary"
        animate={{
          backgroundColor: currentTheme.primary,
          scale: usage ? (priority ? 1.08 : 1.04) : 1,
          x: parallaxField.x * 2,
          y: parallaxField.y * 2,
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="final-cta-visual__orb-secondary"
        animate={{
          backgroundColor: currentTheme.secondary,
          scale: priority ? 1.06 : 1,
          x: parallaxField.x * 1.5,
          y: parallaxField.y * 1.5,
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Main Radar Core & Atomic Orbit Engine */}
      <motion.div
        className="final-cta-visual__core-wrapper"
        animate={{
          scale: pulseActive ? 0.985 : 1,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="final-cta-visual__svg">
          {/* Subtle Radial Coordinate Grid */}
          <motion.g
            animate={{ x: parallaxField.x, y: parallaxField.y }}
            transition={{ duration: 0.2, ease: 'linear' }}
          >
            <line x1="170" y1="16" x2="170" y2="324" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 4" />
            <line x1="16" y1="170" x2="324" y2="170" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 4" />
            <circle cx="170" cy="170" r="154" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4 6" />
          </motion.g>

          {/* Layer 5: Perimeter Data Nodes */}
          {DATA_NODES.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="#ffffff"
              animate={{
                opacity: pulseActive ? 0.6 : 0.15,
                scale: pulseActive ? 1.3 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            />
          ))}

          {/* Layer 2: Atomic Orbit Tracks & Crosshairs */}
          <motion.g
            animate={{ x: parallaxRings.x, y: parallaxRings.y }}
            transition={{ duration: 0.2, ease: 'linear' }}
          >
            {/* Outer Subtle Boundary Ring */}
            <circle cx="170" cy="170" r="148" stroke="rgba(255, 255, 255, 0.04)" />

            {/* Orbit Track A: Usage Ellipse (Tilted -28deg) */}
            <ellipse
              cx="170"
              cy="170"
              rx={RX_A}
              ry={RY_A}
              transform="rotate(-28, 170, 170)"
              stroke={currentTheme.ring}
              strokeWidth="1.2"
              strokeDasharray="4 6"
              fill="none"
              opacity={usage ? 0.45 : 0.2}
            />

            {/* Orbit Track B: Priority Ellipse (Tilted +36deg) */}
            <ellipse
              cx="170"
              cy="170"
              rx={RX_B}
              ry={RY_B}
              transform="rotate(36, 170, 170)"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              fill="none"
              opacity={priority ? 0.4 : 0.18}
            />

            {/* Precision Crosshair Lines (Subtle reference) */}
            <line x1="170" y1="124" x2="170" y2="138" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
            <line x1="170" y1="202" x2="170" y2="216" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
            <line x1="124" y1="170" x2="138" y2="170" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
            <line x1="202" y1="170" x2="216" y2="170" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
          </motion.g>

          {/* Layer 3: Central User Core (Thin Animated Halo & Fixed Anchor) */}
          <motion.g
            animate={{
              x: parallaxCore.x,
              y: parallaxCore.y,
              scale: pulseActive ? 1.025 : 1,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: '170px 170px' }}
          >
            {/* Subtle Diffuse Atmospheric Halo (Soft Radial Falloff) */}
            <defs>
              <radialGradient id="user-core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.4" />
                <stop offset="55%" stopColor={currentTheme.primary} stopOpacity="0.12" />
                <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="170" cy="170" r="58" fill="url(#user-core-glow)" opacity="0.9" />

            {/* Secondary Outer Thin Ring (r=47) */}
            <circle
              cx="170"
              cy="170"
              r="47"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="0.8"
              strokeDasharray="2 4"
              fill="none"
            />

            {/* Secondary Counter Energy Arc (16% arc, 22s counter-clockwise) */}
            <motion.circle
              cx="170"
              cy="170"
              r="47"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="48 247"
              fill="none"
              animate={shouldReduceMotion ? { rotate: 0 } : { rotate: -360 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 22, repeat: Infinity, ease: 'linear' }
              }
              style={{ transformOrigin: '170px 170px' }}
            />

            {/* Primary Inner Thin Ring (r=39) */}
            <circle
              cx="170"
              cy="170"
              r="39"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
              fill="none"
            />

            {/* Primary Energy Arc (22% arc, 15s clockwise) */}
            <motion.circle
              cx="170"
              cy="170"
              r="39"
              stroke={currentTheme.ring}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="54 191"
              fill="none"
              animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 15, repeat: Infinity, ease: 'linear' }
              }
              style={{ transformOrigin: '170px 170px' }}
            />

            {/* Central Glass Disc Surface (User Core ~68px diameter) */}
            <circle
              cx="170"
              cy="170"
              r="34"
              fill="rgba(13, 15, 18, 0.96)"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="1.2"
            />
            <circle
              cx="170"
              cy="170"
              r="29"
              fill="rgba(255, 255, 255, 0.03)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="0.8"
            />

            {/* Center User Icon */}
            <foreignObject x="157" y="157" width="26" height="26" className="final-cta-visual__user-icon-obj">
              <div className="final-cta-visual__user-icon-wrapper">
                <User className="final-cta-visual__user-icon" strokeWidth={2} />
              </div>
            </foreignObject>
          </motion.g>

          {/* Layer 4: Orbiting Body A (Usage Node on Orbit A) */}
          <motion.g
            animate={
              shouldReduceMotion
                ? { x: ORBIT_A_POINTS[16].x + parallaxRings.x, y: ORBIT_A_POINTS[16].y + parallaxRings.y }
                : { x: ORBIT_A_X, y: ORBIT_A_Y }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : { duration: 16, repeat: Infinity, ease: 'linear' }
            }
          >
            {/* Soft Halo */}
            <circle cx="0" cy="0" r="26" fill={currentTheme.coreGlow} opacity="0.25" />

            {/* Usage Glass Node Body (~46px diameter) */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="rgba(13, 15, 18, 0.94)"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
            />
            <circle
              cx="0"
              cy="0"
              r="18"
              fill="rgba(255, 255, 255, 0.03)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />

            {/* Usage Icon with smooth crossfade on selection change */}
            <foreignObject x="-12" y="-12" width="24" height="24" className="final-cta-visual__orbit-icon-obj">
              <AnimatePresence mode="wait">
                <motion.div
                  key={usage || 'default-usage'}
                  className="final-cta-visual__orbit-icon-wrapper"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <UsageIcon className="final-cta-visual__orbit-icon" strokeWidth={2} />
                </motion.div>
              </AnimatePresence>
            </foreignObject>
          </motion.g>

          {/* Layer 4: Orbiting Body B (Priority Node on Orbit B) */}
          <motion.g
            animate={
              shouldReduceMotion
                ? { x: ORBIT_B_POINTS[16].x + parallaxRings.x, y: ORBIT_B_POINTS[16].y + parallaxRings.y }
                : { x: ORBIT_B_X, y: ORBIT_B_Y }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : { duration: 22, repeat: Infinity, ease: 'linear' }
            }
          >
            {/* Soft Halo */}
            <circle cx="0" cy="0" r="26" fill={currentTheme.coreGlow} opacity="0.22" />

            {/* Priority Glass Node Body (~46px diameter, identical size to Usage Node) */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="rgba(13, 15, 18, 0.94)"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
            />
            <circle
              cx="0"
              cy="0"
              r="18"
              fill="rgba(255, 255, 255, 0.03)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />

            {/* Priority Icon with smooth crossfade on selection change */}
            <foreignObject x="-12" y="-12" width="24" height="24" className="final-cta-visual__orbit-icon-obj">
              <AnimatePresence mode="wait">
                <motion.div
                  key={priority || 'default-priority'}
                  className="final-cta-visual__orbit-icon-wrapper"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PriorityIcon className="final-cta-visual__orbit-icon" strokeWidth={2} />
                </motion.div>
              </AnimatePresence>
            </foreignObject>
          </motion.g>

          {/* CTA Radial Focus Pulse (triggers on find button click) */}
          {sweepTrigger > 0 && (
            <motion.circle
              key={sweepTrigger}
              cx="170"
              cy="170"
              initial={{ r: 36, opacity: 0.8 }}
              animate={{ r: 155, opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
            />
          )}
        </svg>

        {/* Ambient Dark Glass Tag Pill Badge inside Visual */}
        <div
          className="final-cta-visual__badge"
          style={
            {
              '--badge-accent': currentTheme.ring,
            } as React.CSSProperties
          }
        >
          {/* Specular Curved Reflection Sheen */}
          <div className="final-cta-visual__badge-specular" aria-hidden="true" />

          {/* Subtle Ambient Back Glow */}
          <div className="final-cta-visual__badge-glow" aria-hidden="true" />

          {/* Luminous Status Dot */}
          <span className="final-cta-visual__badge-dot" aria-hidden="true" />

          {/* Tagline Text with smooth micro-fade transition */}
          <AnimatePresence mode="wait">
            <motion.span
              key={dynamicTag}
              className="final-cta-visual__badge-text"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {dynamicTag}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
