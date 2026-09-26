import { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useScroll } from 'motion/react';
import { CinematicVideoSection } from './CinematicVideoSection';
import { HeroSection } from './HeroSection';

/**
 * Reverse Curtain Transition: Hero (sticky background) + Cinematic (foreground curtain).
 *
 * Main movement is 100% native document flow + CSS z-index stacking.
 * Hero is the persistent background layer (z-0); Cinematic is the foreground curtain (z-20).
 * Video in CinematicVideoSection plays continuously from mount.
 *
 * One semantic threshold detected via IntersectionObserver:
 *   1. Hello reveal — ~46% scroll progress (one-shot SVG trigger)
 *
 * Hero is ALWAYS rendered naturally in the background — zero JS visibility toggles,
 * eliminating all flashes / observer latency during high-speed scrolling.
 */

export function HeroCinematicTransition() {
  const transitionRef = useRef<HTMLElement>(null);
  const helloSentinelRef = useRef<HTMLDivElement>(null);
  const [helloReady, setHelloReady] = useState(false);
  const shouldReduceMotion = useReducedMotion() === true;

  // Track scroll progress along the 200svh transition container
  const { scrollYProgress } = useScroll({
    target: transitionRef,
    offset: ['start start', 'end end'],
  });

  // Immediate check for reduced motion or already-scrolled state
  useEffect(() => {
    if (shouldReduceMotion) {
      setHelloReady(true);
    }
  }, [shouldReduceMotion]);

  // IntersectionObserver for Hello reveal sentinel (~46% progress)
  useEffect(() => {
    const sentinel = helloSentinelRef.current;
    if (!sentinel || shouldReduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHelloReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  return (
    <section
      ref={transitionRef}
      className="hero-cinematic-transition relative -mt-[44px] h-[200svh] bg-[#F7F7F5]"
      aria-label="Chuyển cảnh từ giới thiệu sang phim thương hiệu"
    >
      {/* Sentinel: Hello reveal — positioned at ~46% of the 200svh track */}
      <div
        ref={helloSentinelRef}
        className="pointer-events-none absolute left-0 top-[46%] h-px w-px"
        aria-hidden="true"
      />

      {/* 1. HERO STAGE — Stable Sticky Background Layer (Floating Product Gallery Hero) */}
      <div
        className="hero-cinematic-transition__hero-stage sticky top-0 z-0 h-[100svh] overflow-hidden bg-[#F7F7F5]"
      >
        <div className="absolute inset-0 pt-[44px]">
          <HeroSection scrollYProgress={scrollYProgress} />
        </div>
      </div>

      {/* 2. CINEMATIC STAGE — Foreground Curtain Layer that naturally covers the Hero */}
      <div
        className="hero-cinematic-transition__cinematic-stage relative z-20 min-h-[100svh] overflow-hidden rounded-t-[28px] sm:rounded-t-[36px] lg:rounded-t-[44px] bg-[#0b0f12] shadow-[0_-24px_50px_-10px_rgba(0,0,0,0.35)]"
      >
        <CinematicVideoSection
          id="home-experience"
          helloReady={helloReady}
        />
      </div>
    </section>
  );
}
