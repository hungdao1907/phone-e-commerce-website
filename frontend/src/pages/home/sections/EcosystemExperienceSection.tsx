import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { GlassButton } from '../components/glass-button';
import { GlassDescriptionBadge } from '../components/glass-description-badge';

export type EcosystemDeviceId = 'smartphone' | 'laptop' | 'tablet' | 'watch';

interface EcosystemDeviceData {
  id: EcosystemDeviceId;
  index: string;
  title: string;
  category: string;
  description: string;
  tagline: string;
  accent: string;
  halo: string;
  image: string;
  alt: string;
  sizeClass: string;
  aspectRatio: number;
  /** Central display width in px (desktop). Used to compute target size for flying clone. */
  centralWidth: number;
}

const ECOSYSTEM_DEVICES: Record<EcosystemDeviceId, EcosystemDeviceData> = {
  smartphone: {
    id: 'smartphone',
    index: '01',
    title: 'Kết nối',
    category: 'Trung tâm điều khiển',
    description: 'Điểm trung tâm của mọi trải nghiệm.',
    tagline: 'Mọi thiết bị, một nhịp.',
    accent: '#475569',
    halo: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(203,213,225,0.45) 45%, transparent 74%)',
    image: '/images/ecosystem/ecosystem-phone.webp',
    alt: 'Điện thoại thông minh màu xanh',
    sizeClass: 'product-size--phone',
    aspectRatio: 309 / 543,
    centralWidth: 165,
  },
  laptop: {
    id: 'laptop',
    index: '02',
    title: 'Làm việc',
    category: 'Hiệu suất cao',
    description: 'Tiếp tục công việc ở bất cứ đâu.',
    tagline: 'Liền mạch mọi tác vụ.',
    accent: '#2563eb',
    halo: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(219,234,254,0.5) 45%, transparent 74%)',
    image: '/images/ecosystem/ecosystem-laptop.webp',
    alt: 'Máy tính xách tay màu đen',
    sizeClass: 'product-size--laptop',
    aspectRatio: 970 / 586,
    centralWidth: 275,
  },
  tablet: {
    id: 'tablet',
    index: '03',
    title: 'Sáng tạo',
    category: 'Không gian mở',
    description: 'Không gian linh hoạt cho mọi ý tưởng.',
    tagline: 'Không gian cho mọi ý tưởng.',
    accent: '#7c3aed',
    halo: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(243,232,255,0.5) 45%, transparent 74%)',
    image: '/images/ecosystem/ecosystem-tablet.webp',
    alt: 'Máy tính bảng',
    sizeClass: 'product-size--tablet',
    aspectRatio: 277 / 318,
    centralWidth: 195,
  },
  watch: {
    id: 'watch',
    index: '04',
    title: 'Đồng hành',
    category: 'Sức khỏe & Kết nối',
    description: 'Thông tin cần thiết luôn gần bạn.',
    tagline: 'Luôn gần bên bạn.',
    accent: '#059669',
    halo: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(209,250,229,0.5) 45%, transparent 74%)',
    image: '/images/ecosystem/ecosystem-watch.webp',
    alt: 'Đồng hồ thông minh màu đen',
    sizeClass: 'product-size--watch',
    aspectRatio: 335 / 388,
    centralWidth: 150,
  },
};

const DEVICE_LIST: EcosystemDeviceData[] = [
  ECOSYSTEM_DEVICES.smartphone,
  ECOSYSTEM_DEVICES.laptop,
  ECOSYSTEM_DEVICES.tablet,
  ECOSYSTEM_DEVICES.watch,
];

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;
const ENTER_EASE = [0.22, 1, 0.36, 1] as const;

const getTargetCentralWidth = (deviceId: EcosystemDeviceId): number => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  switch (deviceId) {
    case 'laptop':
      return isDesktop ? 275 : 235;
    case 'smartphone':
      return isDesktop ? 165 : 140;
    case 'tablet':
      return isDesktop ? 195 : 170;
    case 'watch':
      return isDesktop ? 150 : 135;
  }
};

// ─── Flying Clone geometry (all in viewport px, for position:fixed) ───────────
interface FlyingCloneGeometry {
  /** Viewport-space rect of the mini-product image inside the clicked sphere */
  srcLeft: number;
  srcTop: number;
  srcWidth: number;
  srcHeight: number;
  /** Viewport-space center of the central stage target area */
  dstCenterX: number;
  dstCenterY: number;
  /** Rendered pixel width/height of the product at CENTER scale */
  dstWidth: number;
  dstHeight: number;
}

export function EcosystemExperienceSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion() === true;

  // ─── Stage and Central target refs ─────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement>(null);
  const centralTargetRef = useRef<HTMLDivElement>(null);
  const centralProductWrapRef = useRef<HTMLDivElement>(null);

  // ─── Dual-layer refs for orbit slots ─────────────────────────────────────────
  // 1. Permanent glass sphere elements (never unmounted)
  const slotSphereRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  // 2. Mini product image elements
  const slotProductRefs = useRef<(HTMLImageElement | null)[]>([null, null, null]);

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activeDeviceId, setActiveDeviceId] = useState<EcosystemDeviceId>('smartphone');
  const [displayedIndexId, setDisplayedIndexId] = useState<EcosystemDeviceId>('smartphone');
  const [orbitalSlots, setOrbitalSlots] = useState<[EcosystemDeviceId, EcosystemDeviceId, EcosystemDeviceId]>([
    'laptop', // Slot 0
    'tablet', // Slot 1
    'watch',  // Slot 2
  ]);

  // Synchronous mirror refs to completely eliminate any stale closure in timers / rAF callbacks
  const activeDeviceIdRef = useRef<EcosystemDeviceId>(activeDeviceId);
  activeDeviceIdRef.current = activeDeviceId;

  const orbitalSlotsRef = useRef<[EcosystemDeviceId, EcosystemDeviceId, EcosystemDeviceId]>(orbitalSlots);
  orbitalSlotsRef.current = orbitalSlots;

  const isTransitioningRef = useRef<boolean>(false);

  // Monotonically increasing transition identity counter
  const transitionIdRef = useRef<number>(0);
  const [transitionId, setTransitionId] = useState<number>(0);

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionSlotIndex, setTransitionSlotIndex] = useState<number>(-1);
  const [transitionIncomingId, setTransitionIncomingId] = useState<EcosystemDeviceId | null>(null);
  const [transitionOutgoingId, setTransitionOutgoingId] = useState<EcosystemDeviceId | null>(null);
  const [showReplacementInOrb, setShowReplacementInOrb] = useState<boolean>(false);
  // Whether the real central renderer is visible (hidden during clone flight, restored on handoff)
  const [showRealCenter, setShowRealCenter] = useState<boolean>(true);

  // Flying clone geometry (fixed viewport coords)
  const [flyingGeo, setFlyingGeo] = useState<FlyingCloneGeometry | null>(null);

  const [hoveredOrbId, setHoveredOrbId] = useState<EcosystemDeviceId | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbFadeInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (orbFadeInTimerRef.current) clearTimeout(orbFadeInTimerRef.current);
      if (indexSyncTimeoutRef.current) clearTimeout(indexSyncTimeoutRef.current);
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    };
  }, []);

  // ─── HELPER: Bulletproof Snapshot of Slot Source Geometry ───────────────────
  const getSlotSourceRect = useCallback((slotIndex: number): DOMRect | null => {
    // 1. Try actual mini-image element
    const imgEl = slotProductRefs.current[slotIndex];
    if (imgEl && imgEl.isConnected) {
      const r = imgEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }

    // 2. Fallback: derive from permanent liquid-glass-sphere container (which is 100% permanent)
    const sphereEl = slotSphereRefs.current[slotIndex];
    if (sphereEl && sphereEl.isConnected) {
      const sr = sphereEl.getBoundingClientRect();
      if (sr.width > 0 && sr.height > 0) {
        // Mini image is 62% centered inside the sphere (19% padding each side)
        const padX = sr.width * 0.19;
        const padY = sr.height * 0.19;
        const w = sr.width * 0.62;
        const h = sr.height * 0.62;
        return new DOMRect(sr.left + padX, sr.top + padY, w, h);
      }
    }
    return null;
  }, []);

  // ─── COMMIT TRANSITION ─────────────────────────────────────────────────────
  const commitTransition = useCallback(
    (targetId: EcosystemDeviceId, targetSlotIndex: number, geo: FlyingCloneGeometry | null) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (orbFadeInTimerRef.current) clearTimeout(orbFadeInTimerRef.current);
      if (indexSyncTimeoutRef.current) clearTimeout(indexSyncTimeoutRef.current);
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);

      const incomingDuration = shouldReduceMotion ? 300 : 760;
      const handoffDuration = shouldReduceMotion ? 80 : 120;

      const currentActive = activeDeviceIdRef.current;

      const nextId = ++transitionIdRef.current;
      setTransitionId(nextId);

      isTransitioningRef.current = true;
      setIsTransitioning(true);
      setTransitionSlotIndex(targetSlotIndex);
      setTransitionIncomingId(targetId);
      setTransitionOutgoingId(currentActive);
      setShowReplacementInOrb(false);
      setHoveredOrbId(null);
      setShowRealCenter(false); // Hide central display; clone will stand in until handoff
      setFlyingGeo(geo);

      // Sync index at ~45% of incoming travel
      indexSyncTimeoutRef.current = setTimeout(() => {
        setDisplayedIndexId(targetId);
      }, shouldReduceMotion ? 120 : 340);

      // Old center device fades into the clicked orb at ~65% of incoming travel
      orbFadeInTimerRef.current = setTimeout(() => {
        setShowReplacementInOrb(true);
      }, shouldReduceMotion ? 160 : 500);

      // When clone arrives at center: commit state atomically
      transitionTimeoutRef.current = setTimeout(() => {
        const nextOrbitSlots: [EcosystemDeviceId, EcosystemDeviceId, EcosystemDeviceId] = [
          ...orbitalSlotsRef.current,
        ];
        nextOrbitSlots[targetSlotIndex] = currentActive;

        activeDeviceIdRef.current = targetId;
        orbitalSlotsRef.current = nextOrbitSlots;

        setActiveDeviceId(targetId);
        setDisplayedIndexId(targetId);
        setOrbitalSlots(nextOrbitSlots);

        // Enable real central product with immediate 100% scale
        setShowRealCenter(true);

        // Crossfade handoff from clone to real central renderer
        handoffTimerRef.current = setTimeout(() => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          setTransitionSlotIndex(-1);
          setTransitionIncomingId(null);
          setTransitionOutgoingId(null);
          setShowReplacementInOrb(false);
          setFlyingGeo(null);

          // Resume ambient orbit rotation smoothly after grace buffer
          resumeTimerRef.current = setTimeout(() => {
            setIsPaused(false);
          }, 380);
        }, handoffDuration);
      }, incomingDuration);
    },
    [shouldReduceMotion]
  );

  // ─── ONE-WAY ORBIT → CENTER TRANSITION ─────────────────────────────────────
  const selectDevice = useCallback(
    (targetId: EcosystemDeviceId) => {
      if (isTransitioningRef.current || targetId === activeDeviceIdRef.current) return;

      const currentSlots = orbitalSlotsRef.current;
      const targetSlotIndex = currentSlots.indexOf(targetId);
      if (targetSlotIndex === -1) return;

      // ── Step 1: Pause orbit so the sphere is frozen at its current position ──
      setIsPaused(true);

      // ── Step 2: Snapshot rects in the very next frame after animation pauses ──
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const boxRect = getSlotSourceRect(targetSlotIndex);
          if (!boxRect) {
            commitTransition(targetId, targetSlotIndex, null);
            return;
          }

          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
          const targetWidth = getTargetCentralWidth(targetId);
          const incomingDevice = ECOSYSTEM_DEVICES[targetId];
          const ratio = incomingDevice.aspectRatio;

          // Compute exact rendered product bounds inside the mini-orb (object-fit: contain)
          let srcWidth: number;
          let srcHeight: number;
          let srcLeft: number;
          let srcTop: number;

          if (ratio >= 1) {
            // Landscape (Laptop) - width constrained
            srcWidth = boxRect.width;
            srcHeight = boxRect.width / ratio;
            srcLeft = boxRect.left;
            srcTop = boxRect.top + (boxRect.height - srcHeight) / 2;
          } else {
            // Portrait (Phone, Tablet, Watch) - height constrained
            srcHeight = boxRect.height;
            srcWidth = boxRect.height * ratio;
            srcLeft = boxRect.left + (boxRect.width - srcWidth) / 2;
            srcTop = boxRect.top;
          }

          // Exact rendered dimensions at center
          const dstWidth = targetWidth;
          const dstHeight = targetWidth / ratio;

          const centralWrapEl = centralProductWrapRef.current;
          const stageEl = stageRef.current;

          let dstCenterX: number;
          let dstCenterY: number;

          if (centralWrapEl && centralWrapEl.isConnected) {
            const wrapRect = centralWrapEl.getBoundingClientRect();
            dstCenterX = wrapRect.left + wrapRect.width / 2;
            dstCenterY = wrapRect.top + wrapRect.height / 2;
          } else if (stageEl && stageEl.isConnected) {
            const stageRect = stageEl.getBoundingClientRect();
            dstCenterX = stageRect.left + stageRect.width / 2;
            dstCenterY = stageRect.top + stageRect.height / 2 - (isDesktop ? 28 : 22);
          } else {
            const centralEl = centralTargetRef.current;
            const dstRect = centralEl?.getBoundingClientRect();
            dstCenterX = (dstRect?.left ?? 0) + (dstRect?.width ?? 0) / 2;
            dstCenterY = (dstRect?.top ?? 0) + (dstRect?.height ?? 0) / 2 - (isDesktop ? 28 : 22);
          }

          const geo: FlyingCloneGeometry = {
            srcLeft,
            srcTop,
            srcWidth,
            srcHeight,
            dstCenterX,
            dstCenterY,
            dstWidth,
            dstHeight,
          };

          commitTransition(targetId, targetSlotIndex, geo);
        });
      });
    },
    [getSlotSourceRect, commitTransition]
  );

  const handleMouseEnterOrb = (id: EcosystemDeviceId) => {
    if (isTransitioningRef.current) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsPaused(true);
    setHoveredOrbId(id);
  };

  const handleMouseLeaveOrb = () => {
    if (isTransitioningRef.current) return;
    setHoveredOrbId(null);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1000);
  };

  const activeData = ECOSYSTEM_DEVICES[activeDeviceId];

  // Header Animation Variants
  const eyebrowVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.2 : 0.5, ease: ENTER_EASE },
    },
  };

  const headlineVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.65,
        delay: shouldReduceMotion ? 0 : 0.1,
        ease: ENTER_EASE,
      },
    },
  };

  const copyVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.6,
        delay: shouldReduceMotion ? 0 : 0.2,
        ease: ENTER_EASE,
      },
    },
  };

  const stageVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.8,
        delay: shouldReduceMotion ? 0 : 0.25,
        ease: ENTER_EASE,
      },
    },
  };

  // ─── FLYING CLONE: rendered into document.body via createPortal ─────────────
  // Uses position:fixed so it's in pure viewport space — immune to any ancestor transforms.
  const renderFlyingClone = () => {
    if (!isTransitioning || !transitionIncomingId || !flyingGeo || shouldReduceMotion) return null;

    const device = ECOSYSTEM_DEVICES[transitionIncomingId];
    const geo = flyingGeo;

    const srcCenterX = geo.srcLeft + geo.srcWidth / 2;
    const srcCenterY = geo.srcTop + geo.srcHeight / 2;
    const deltaX = geo.dstCenterX - srcCenterX;
    const deltaY = geo.dstCenterY - srcCenterY;
    const scaleTarget = geo.dstWidth / geo.srcWidth;

    return createPortal(
      <motion.div
        key={`flying-clone-${transitionIncomingId}-${transitionId}`}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: geo.srcTop,
          left: geo.srcLeft,
          width: geo.srcWidth,
          height: geo.srcHeight,
          pointerEvents: 'none',
          zIndex: 9999,
          transformOrigin: 'center center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        }}
        animate={{
          x: deltaX,
          y: deltaY,
          scale: scaleTarget,
          opacity: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0.3 : 0.76,
          ease: PREMIUM_EASE,
        }}
      >
        <img
          src={device.image}
          alt=""
          draggable={false}
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 20px 32px rgba(15,23,42,0.14))',
          }}
        />
      </motion.div>,
      document.body
    );
  };

  return (
    <section
      ref={containerRef}
      className="ecosystem-experience-section relative overflow-hidden py-10 sm:py-12 lg:py-14 select-none border-t border-black/[0.04]"
      aria-labelledby="ecosystem-section-title"
    >
      {/* Background Ambience Layer */}
      <div className="ecosystem-atmosphere" aria-hidden="true" />

      {/* ─── POSITION:FIXED FLYING CLONE PORTAL ─── */}
      {renderFlyingClone()}

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* 2-COLUMN FLAGSHIP LAYOUT */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10 xl:gap-12">
          {/* ═══ LEFT COLUMN: EDITORIAL NARRATIVE & INDEX ═══ */}
          <div className="lg:w-[40%] xl:w-[38%] flex flex-col justify-center z-20">
            <motion.p
              className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.22em] text-[#6e6e73] uppercase flex items-center gap-2"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={eyebrowVariants}
            >
              <span className="w-2.5 h-[1.5px] bg-slate-400/80 rounded-full" />
              HỆ SINH THÁI
            </motion.p>

            <motion.h2
              id="ecosystem-section-title"
              className="mt-2 text-[clamp(1.65rem,2.7vw,2.5rem)] font-bold leading-[1.18] tracking-[-0.03em] text-[#1d1d1f]"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={headlineVariants}
            >
              Mọi thiết bị. Một trải nghiệm.
            </motion.h2>

            <motion.p
              className="mt-2.5 text-sm sm:text-base text-[#515154] leading-relaxed max-w-md"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={copyVariants}
            >
              Kết nối công việc, sáng tạo và những khoảnh khắc mỗi ngày.
            </motion.p>

            {/* ECOSYSTEM INDEX — Glass Button Controls */}
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={copyVariants}
              className="mt-6 sm:mt-8 flex flex-col gap-2 max-w-[400px]"
              role="tablist"
              aria-label="Danh mục thiết bị hệ sinh thái"
            >
              {DEVICE_LIST.map((device) => {
                const isActive = displayedIndexId === device.id;
                return (
                  <GlassButton
                    key={device.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    disabled={isTransitioning}
                    active={isActive}
                    accentColor={device.accent}
                    onClick={() => selectDevice(device.id)}
                    onMouseEnter={() => !isActive && handleMouseEnterOrb(device.id)}
                    onMouseLeave={handleMouseLeaveOrb}
                    onFocus={() => !isActive && handleMouseEnterOrb(device.id)}
                    onBlur={handleMouseLeaveOrb}
                  >
                    {/* Number */}
                    <span
                      className={`font-mono text-[11px] tabular-nums transition-colors duration-200 shrink-0 ${
                        isActive
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {device.index}
                    </span>

                    {/* Accent Dot */}
                    <span
                      className="w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-300 ml-2.5"
                      style={{
                        backgroundColor: device.accent,
                        opacity: isActive ? 1 : 0.25,
                        transform: isActive ? 'scale(1)' : 'scale(0.7)',
                      }}
                    />

                    {/* Title */}
                    <span
                      className={`text-[14px] tracking-tight transition-all duration-200 ml-3 ${
                        isActive
                          ? 'text-slate-950 font-semibold'
                          : 'text-slate-500 font-medium'
                      }`}
                    >
                      {device.title}
                    </span>

                    {/* Category — revealed on active */}
                    <span
                      className="ml-auto text-[11px] font-mono tracking-wide transition-all duration-300 shrink-0"
                      style={{
                        color: device.accent,
                        opacity: isActive ? 0.85 : 0,
                        transform: isActive ? 'translateX(0)' : 'translateX(-6px)',
                      }}
                    >
                      {device.category}
                    </span>
                  </GlassButton>
                );
              })}
            </motion.div>
          </div>

          {/* ═══ RIGHT COLUMN: ORBITAL FIELD ═══ */}
          <motion.div
            className="lg:w-[60%] xl:w-[62%] flex items-center justify-center relative"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={stageVariants}
          >
            <div ref={stageRef} className="ecosystem-stage relative">
              {/* Atmospheric Halo */}
              <div
                className="ecosystem-hub-halo"
                style={{
                  background: activeData.halo,
                  transform: 'translate(-50%, -50%) scale(1.15)',
                }}
                aria-hidden="true"
              />
              {/* Ripple */}
              <div className="ecosystem-hub-ripple" aria-hidden="true" />
              {/* Orbit Tracks */}
              <div className="ecosystem-guide-ring ecosystem-guide-ring--inner" aria-hidden="true" />
              <div className="ecosystem-guide-ring ecosystem-guide-ring--main" aria-hidden="true" />
              <div className="ecosystem-guide-ring ecosystem-guide-ring--outer" aria-hidden="true" />

              {/* ── ORBITAL ROTATOR ── */}
              <div
                className={`orbital-rotator ${
                  isPaused || isTransitioning || shouldReduceMotion ? 'orbital-rotator--paused' : ''
                }`}
              >
                {orbitalSlots.map((deviceId, slotIdx) => {
                  const isClickedSlot = isTransitioning && transitionSlotIndex === slotIdx;

                  // Occupant: during transition on clicked slot, either empty or outgoing device
                  const currentOccupantId = isClickedSlot
                    ? showReplacementInOrb && transitionOutgoingId
                      ? transitionOutgoingId
                      : null
                    : deviceId;

                  const device = currentOccupantId ? ECOSYSTEM_DEVICES[currentOccupantId] : null;
                  const isHovered = hoveredOrbId === deviceId;

                  // Which slot CSS class to use (slot-0, slot-1, slot-2)
                  const slotClass = `orbital-node-anchor--slot-${slotIdx}`;

                  return (
                    <div
                      key={`fixed-slot-${slotIdx}`}
                      className={`orbital-node-anchor ${slotClass}`}
                      style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
                    >
                      <div className="orbital-counter-rotator relative">
                        <button
                          type="button"
                          id={`orb-slot-${slotIdx}-${deviceId}`}
                          aria-label={
                            device
                              ? `Đưa ${device.title} vào trung tâm: ${device.description}`
                              : 'Quả cầu hệ sinh thái'
                          }
                          disabled={isTransitioning}
                          onMouseEnter={() => handleMouseEnterOrb(deviceId)}
                          onMouseLeave={handleMouseLeaveOrb}
                          onFocus={() => handleMouseEnterOrb(deviceId)}
                          onBlur={handleMouseLeaveOrb}
                          onClick={() => selectDevice(deviceId)}
                          className={`ecosystem-node-btn ${
                            isHovered ? 'is-active' : ''
                          } focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-full`}
                        >
                          {/* Glass Sphere */}
                          <div
                            ref={(el) => {
                              slotSphereRefs.current[slotIdx] = el;
                            }}
                            className="liquid-glass-sphere"
                            style={{
                              borderColor: isHovered
                                ? `${ECOSYSTEM_DEVICES[deviceId].accent}99`
                                : 'rgba(255, 255, 255, 0.85)',
                            }}
                          >
                            {/* Accent Glow */}
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
                              style={{
                                background: `radial-gradient(circle, ${
                                  device ? device.accent : '#94a3b8'
                                }25 0%, transparent 70%)`,
                                opacity: isHovered ? 1 : 0.3,
                              }}
                            />

                            {/* Mini Product inside glass */}
                            {device && (
                              <motion.img
                                key={`occupant-${device.id}-slot${slotIdx}`}
                                ref={(el) => {
                                  if (el) slotProductRefs.current[slotIdx] = el;
                                }}
                                src={device.image}
                                alt={device.alt}
                                draggable={false}
                                decoding="async"
                                loading="lazy"
                                initial={
                                  isClickedSlot && showReplacementInOrb
                                    ? { opacity: 0, scale: 0.88 }
                                    : isClickedSlot
                                    ? { opacity: 0 }
                                    : { opacity: 1, scale: 1 }
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="liquid-glass-mini-img"
                                style={{
                                  visibility: isClickedSlot && !showReplacementInOrb ? 'hidden' : 'visible',
                                }}
                              />
                            )}
                          </div>

                          {/* Tooltip Label */}
                          {device && !isClickedSlot && (
                            <div className="precision-label" role="status">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-slate-400 font-semibold">
                                  {device.index}
                                </span>
                                <span
                                  className="block text-[10.5px] font-bold tracking-wider uppercase"
                                  style={{ color: device.accent }}
                                >
                                  {device.title}
                                </span>
                              </div>
                              <small className="block text-xs text-slate-700 font-medium mt-0.5 leading-snug">
                                {device.description}
                              </small>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── CENTRAL HERO PRODUCT ── */}
              {/* This ref is used to measure where the clone should land */}
              <div
                ref={centralTargetRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <AnimatePresence mode="wait">
                  {showRealCenter && (
                    <motion.div
                      key={activeDeviceId}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: isTransitioning ? 0.12 : 0.35, ease: 'easeOut' },
                      }}
                      exit={{
                        opacity: 0,
                        y: 4,
                        transition: { duration: 0.22, ease: 'easeOut' },
                      }}
                      className="flex flex-col items-center justify-center cursor-default"
                    >
                      <div
                        ref={centralProductWrapRef}
                        className={`ecosystem-product-wrap ${activeData.sizeClass}`}
                      >
                        <img
                          src={activeData.image}
                          alt={activeData.alt}
                          draggable={false}
                          decoding="async"
                          className="ecosystem-product-img"
                        />
                      </div>

                      {/* Central Hero Liquid Glass Description Block */}
                      <motion.div
                        className="mt-3.5"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: isTransitioning ? 0.15 : 0.45, ease: ENTER_EASE, delay: isTransitioning ? 0 : 0.04 },
                        }}
                        exit={shouldReduceMotion ? { opacity: 0 } : {
                          opacity: 0,
                          y: -4,
                          transition: { duration: 0.18, ease: 'easeOut' },
                        }}
                      >
                        <GlassDescriptionBadge
                          index={activeData.index}
                          title={activeData.title}
                          tagline={activeData.tagline}
                          accentColor={activeData.accent}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* MOBILE DOCKED STATUS CARD */}
        <div className="mt-8 lg:hidden">
          <div
            className="rounded-2xl p-4 border border-white/95 bg-white/85 backdrop-blur-md shadow-sm transition-all duration-300"
            style={{ borderLeft: `4px solid ${activeData.accent}` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: activeData.accent }}
              >
                {activeData.index} · {activeData.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{activeData.category}</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 font-medium">{activeData.tagline}</p>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>TRẠNG THÁI: TRUNG TÂM HỆ SINH THÁI</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
