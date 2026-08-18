import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────── DATA ─────────── */
const IPHONE_VARIANTS = [
  {
    id: 'orange',
    label: 'Desert Titanium',
    model: '/models/iphone_17_promax_orange.glb',
    bg: '#C2592A',
    panel: '#D4734A',
    modelScale: 1,      // will be auto-normalized
    modelRotationY: 0,
  },
  {
    id: 'deepblue',
    label: 'Deep Blue',
    model: '/models/iphone17_promax_deepblue_fix.glb',
    bg: '#1B3A5C',
    panel: '#2A5280',
    modelScale: 1,
    modelRotationY: 0,
  },
  {
    id: 'grey',
    label: 'Natural Titanium',
    model: '/models/iphone_17_promax_grey.glb',
    bg: '#4A4A4A',
    panel: '#636363',
    modelScale: 1,
    modelRotationY: 0,
  },
];

const TRANSITION_MS = 650;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const CSS_STYLES = `
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes noise {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1%, -1%); }
  20% { transform: translate(-2%, 1%); }
  30% { transform: translate(1%, -2%); }
  40% { transform: translate(-1%, 3%); }
  50% { transform: translate(-2%, 1%); }
  60% { transform: translate(2%, 0); }
  70% { transform: translate(0, 2%); }
  80% { transform: translate(1%, 3%); }
  90% { transform: translate(-1%, 1%); }
}

.animate-blob {
  animation: blob 15s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

.grain-animate {
  animation: noise 0.2s steps(2) infinite;
}
`;

const dragState = {
  isDragging: false,
  deltaX: 0,
  deltaY: 0,
};

function lerpAngle(start: number, end: number, t: number) {
  const delta = ((((end - start) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return start + delta * t;
}

/* ─────────── GRAIN OVERLAY ─────────── */
const GRAIN_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E`;

function GrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none mix-blend-overlay overflow-hidden"
      style={{ zIndex: 50, opacity: 0.6 }}
    >
      <div
        className="w-[120%] h-[120%] grain-animate"
        style={{
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: '120px 120px',
          position: 'absolute',
          top: '-10%',
          left: '-10%',
        }}
      />
    </div>
  );
}

/* ─────────── BACKGROUND GRADIENT ─────────── */
function BackgroundGradient({ variant }: { variant: (typeof IPHONE_VARIANTS)[number] }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050505] transition-colors duration-1000">
      <div 
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] min-w-[500px] min-h-[500px] rounded-full animate-blob"
        style={{
          background: `radial-gradient(circle, ${variant.bg} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity: 0.45,
          transition: 'background 1s ease',
        }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] min-w-[600px] min-h-[600px] rounded-full animate-blob animation-delay-2000"
        style={{
          background: `radial-gradient(circle, ${variant.panel} 0%, transparent 60%)`,
          filter: 'blur(100px)',
          opacity: 0.35,
          transition: 'background 1s ease',
        }}
      />
      <div 
        className="absolute top-[20%] left-[20%] w-[80vw] h-[80vw] min-w-[700px] min-h-[700px] rounded-full animate-blob animation-delay-4000"
        style={{
          background: `radial-gradient(circle, ${variant.bg} 0%, transparent 50%)`,
          filter: 'blur(120px)',
          opacity: 0.25,
          transition: 'background 1s ease',
        }}
      />
    </div>
  );
}

/* ─────────── NORMALIZE HELPER ─────────── */
// This function auto-scales any GLB model so that its bounding box
// fits within a target size (default 3 units tall).
function normalizeModel(scene: THREE.Object3D, targetHeight = 3): THREE.Group {
  const cloned = scene.clone();
  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim === 0) return cloned as THREE.Group;

  const scaleFactor = targetHeight / maxDim;
  cloned.scale.multiplyScalar(scaleFactor);

  // Re-center after scaling
  const newBox = new THREE.Box3().setFromObject(cloned);
  const center = new THREE.Vector3();
  newBox.getCenter(center);
  cloned.position.sub(center);

  // Shift so bottom of model is at y=0
  const newBox2 = new THREE.Box3().setFromObject(cloned);
  cloned.position.y -= newBox2.min.y;

  return cloned as THREE.Group;
}

/* ─────────── 3D IPHONE MODEL ─────────── */
function IPhoneModel({
  url,
  role,
  isMobile,
}: {
  url: string;
  role: 'center' | 'left' | 'right' | 'hidden';
  isMobile: boolean;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const normalizedRef = useRef<THREE.Object3D | null>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetScaleVal = useRef(1);

  // Normalize model on first render
  useEffect(() => {
    if (groupRef.current) {
      // Clear previous children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      const normalized = normalizeModel(scene, 3.5);
      groupRef.current.add(normalized);
      normalizedRef.current = normalized;
    }
  }, [scene]);

  useEffect(() => {
    switch (role) {
      case 'center':
        targetPos.current.set(0, isMobile ? -1.5 : -0.75, 0);
        targetScaleVal.current = isMobile ? 0.85 : 0.80;
        break;
      case 'left':
        targetPos.current.set(isMobile ? -3 : -4.5, isMobile ? -1.5 : -1.2, -1.5);
        targetScaleVal.current = isMobile ? 0.4 : 0.55;
        break;
      case 'right':
        targetPos.current.set(isMobile ? 3 : 4.5, isMobile ? -1.5 : -1.2, -1.5);
        targetScaleVal.current = isMobile ? 0.4 : 0.55;
        break;
      case 'hidden':
        targetPos.current.set(0, -5, -3);
        targetScaleVal.current = 0.2;
        break;
    }
  }, [role, isMobile]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = 3.5;

    // Smooth position
    groupRef.current.position.lerp(targetPos.current, speed * delta);

    // Smooth scale
    const s = THREE.MathUtils.lerp(
      groupRef.current.scale.x,
      targetScaleVal.current,
      speed * delta
    );
    groupRef.current.scale.setScalar(s);

    // Rotation logic
    if (role === 'center') {
      if (dragState.isDragging) {
        groupRef.current.rotation.y += dragState.deltaX * 0.01;
        groupRef.current.rotation.x += dragState.deltaY * 0.01;
        groupRef.current.rotation.x = THREE.MathUtils.clamp(
          groupRef.current.rotation.x,
          -Math.PI / 6,
          Math.PI / 6
        );
        // Consume deltas so only the center model uses them
        dragState.deltaX = 0;
        dragState.deltaY = 0;
      } else {
        groupRef.current.rotation.y += 0.004;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          0,
          speed * delta
        );
      }
    } else {
      // If not center, smoothly rotate to show the back (Math.PI)
      groupRef.current.rotation.y = lerpAngle(
        groupRef.current.rotation.y,
        Math.PI,
        speed * delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        speed * delta
      );
    }
  });

  return <group ref={groupRef} />;
}

/* ─────────── NAV COLOR BUTTON ─────────── */
function NavColorButton({
  variant,
  isActive,
  onClick,
}: {
  variant: (typeof IPHONE_VARIANTS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer"
      style={{ outline: 'none' }}
    >
      <div
        className="rounded-full transition-all duration-300"
        style={{
          width: isActive ? 52 : 36,
          height: isActive ? 52 : 36,
          backgroundColor: variant.panel,
          border: isActive
            ? '3px solid white'
            : '2px solid rgba(255,255,255,0.4)',
          boxShadow: isActive
            ? `0 0 20px ${variant.panel}80, 0 0 40px ${variant.panel}40`
            : `0 4px 12px rgba(0,0,0,0.3)`,
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
        }}
      />
      <span
        className="text-white font-medium uppercase tracking-wider transition-opacity duration-300"
        style={{
          fontSize: isActive ? 11 : 10,
          opacity: isActive ? 1 : 0.55,
        }}
      >
        {variant.label}
      </span>
    </button>
  );
}

/* ─────────── SCENE ─────────── */
function Scene({
  activeIndex,
  isMobile,
  onLoaded,
}: {
  activeIndex: number;
  isMobile: boolean;
  onLoaded: () => void;
}) {
  const { camera, gl } = useThree();
  const loadedCountRef = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1, isMobile ? 7 : 6);
    camera.lookAt(0, 0.5, 0);
  }, [camera, isMobile]);

  // Global drag handler
  useEffect(() => {
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragState.isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.isDragging) return;
      dragState.deltaX = e.clientX - prevX;
      dragState.deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => {
      dragState.isDragging = false;
      dragState.deltaX = 0;
      dragState.deltaY = 0;
    };

    const canvas = gl.domElement;
    canvas.style.touchAction = 'none'; // Prevent scroll on mobile while dragging
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl]);

  const getRole = (idx: number): 'center' | 'left' | 'right' | 'hidden' => {
    if (idx === activeIndex) return 'center';
    const len = IPHONE_VARIANTS.length;
    const diff = (idx - activeIndex + len) % len;
    if (diff === 1) return 'right';
    if (diff === len - 1) return 'left';
    return 'hidden';
  };

  // Track loading — call onLoaded when all models are loaded
  useEffect(() => {
    // Models are loaded via useGLTF which is managed by Suspense,
    // so when Scene mounts, all models in Suspense are ready.
    onLoaded();
  }, [onLoaded]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.6}
        castShadow
      />
      <Environment preset="studio" />
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.35}
        scale={14}
        blur={2.5}
        far={5}
      />

      {IPHONE_VARIANTS.map((v, idx) => (
        <IPhoneModel
          key={v.id}
          url={v.model}
          role={getRole(idx)}
          isMobile={isMobile}
        />
      ))}
    </>
  );
}

/* ─────────── LOADING SCREEN ─────────── */
function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 100 }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
      <p className="text-white/60 text-sm font-medium tracking-wider uppercase mt-6 animate-pulse">
        Đang tải mô hình 3D...
      </p>
    </div>
  );
}

/* ─────────── MAIN PAGE ─────────── */
export function IphonePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Preload all models
  useEffect(() => {
    IPHONE_VARIANTS.forEach((v) => useGLTF.preload(v.model));
  }, []);

  const navigate = useCallback(
    (targetIdx: number) => {
      if (isAnimating || targetIdx === activeIndex) return;
      setIsAnimating(true);
      setActiveIndex(targetIdx);
      setTimeout(() => setIsAnimating(false), TRANSITION_MS);
    },
    [isAnimating, activeIndex]
  );

  const handleLoaded = useCallback(() => {
    setModelsLoaded(true);
  }, []);

  const current = IPHONE_VARIANTS[activeIndex];

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{CSS_STYLES}</style>
      <div
        className="relative w-full"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <BackgroundGradient variant={current} />

        {/* 1. Grain overlay */}
        <GrainOverlay />

        {/* 2. Giant ghost text */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: '18%' }}
        >
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(60px, 22vw, 320px)',
              fontWeight: 900,
              color: 'white',
              opacity: 0.08,
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            iPHONE 17
          </span>
        </div>

        {/* 3. Top-left brand */}
        <div
          className="absolute top-6 left-4 sm:left-8"
          style={{ zIndex: 60 }}
        >
          <span
            className="text-xs font-semibold uppercase text-white tracking-[0.18em]"
            style={{ opacity: 0.9 }}
          >
            APPLE STORE
          </span>
        </div>

        {/* 4. 3D Canvas — Carousel */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          <Canvas
            shadows
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            camera={{ fov: 35, near: 0.1, far: 100 }}
          >
            <Suspense fallback={null}>
              <Scene
                activeIndex={activeIndex}
                isMobile={isMobile}
                onLoaded={handleLoaded}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Loading screen — shown until models are loaded */}
        {!modelsLoaded && <LoadingScreen />}

        {/* 5. Bottom-left text + description */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-16 sm:left-16"
          style={{
            zIndex: 60,
            maxWidth: 380,
            opacity: modelsLoaded ? 1 : 0,
            transition: 'opacity 500ms ease',
          }}
        >
          <p
            className="font-bold uppercase tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px] text-white"
            style={{ opacity: 0.95, letterSpacing: '0.02em' }}
          >
            iPHONE 17 PRO MAX
          </p>
          <p
            className="hidden sm:block text-xs sm:text-sm text-white mb-5 sm:mb-6"
            style={{ opacity: 0.85, lineHeight: 1.7 }}
          >
            Thiết kế titan. Chip A19 Pro mạnh mẽ nhất. Hệ thống camera chuyên
            nghiệp 48MP. Trải nghiệm Apple Intelligence tiên tiến. Cuộc cách
            mạng mới bắt đầu từ đây.
          </p>

          {/* Color navigation buttons */}
          <div className="flex items-center gap-5 sm:gap-7">
            {IPHONE_VARIANTS.map((v, idx) => (
              <NavColorButton
                key={v.id}
                variant={v}
                isActive={idx === activeIndex}
                onClick={() => navigate(idx)}
              />
            ))}
          </div>
        </div>

        {/* 6. Bottom-right link */}
        <div
          className="absolute bottom-6 right-4 sm:bottom-16 sm:right-10"
          style={{
            zIndex: 60,
            opacity: modelsLoaded ? 1 : 0,
            transition: 'opacity 500ms ease',
          }}
        >
          <a
            href="#"
            className="flex items-center gap-2 no-underline text-white group"
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(18px, 3.5vw, 48px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textTransform: 'uppercase',
              opacity: 0.95,
              transition: 'opacity 200ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.95')}
          >
            MUA NGAY
            <svg
              className="w-5 h-5 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
