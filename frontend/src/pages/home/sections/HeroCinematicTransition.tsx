import { useRef } from 'react';
import { useScroll } from 'motion/react';
import { CinematicVideoSection } from './CinematicVideoSection';
import { HeroSection } from './HeroSection';

interface HeroCinematicTransitionProps {
  isIntroPlaying?: boolean;
}

export function HeroCinematicTransition({ isIntroPlaying = false }: HeroCinematicTransitionProps) {
  const transitionRef = useRef<HTMLElement>(null);

  // Track scroll progress along the 200svh transition container
  const { scrollYProgress } = useScroll({
    target: transitionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section
      ref={transitionRef}
      className="hero-cinematic-transition relative -mt-[44px] h-[200svh] bg-[#030712]"
      aria-label="Chuyển cảnh từ giới thiệu sang phim thương hiệu"
    >
      {/* 1. HERO STAGE — Stable Sticky Background Layer (Floating Product Gallery Hero) */}
      <div
        className="hero-cinematic-transition__hero-stage sticky top-0 z-0 h-[100svh] overflow-hidden bg-[#030712]"
      >
        <div className="absolute inset-0 pt-[44px]">
          <HeroSection scrollYProgress={scrollYProgress} isIntroPlaying={isIntroPlaying} />
        </div>
      </div>

      {/* 2. CINEMATIC STAGE — Foreground Curtain Layer that naturally covers the Hero */}
      <div
        className="hero-cinematic-transition__cinematic-stage relative z-20 min-h-[100svh] overflow-hidden rounded-t-[28px] sm:rounded-t-[36px] lg:rounded-t-[44px] bg-[#0b0f12] shadow-[0_-24px_50px_-10px_rgba(0,0,0,0.35)]"
      >
        <CinematicVideoSection id="home-experience" />
      </div>
    </section>
  );
}
