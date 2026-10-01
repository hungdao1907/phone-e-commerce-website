import { useRef } from 'react';
import { useScroll } from 'motion/react';
import { HeroSection } from './HeroSection';

interface CinematicVideoSectionProps {
  id?: string;
}

export function CinematicVideoSection({ id }: CinematicVideoSectionProps) {
  return (
    <section
      id={id}
      className="cinematic-video-section relative min-h-[100svh] overflow-hidden bg-[#0b0f12] text-white"
    >
      <div className="cinematic-video-section__fallback pointer-events-none absolute inset-0 z-0" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="cinematic-video-section__video pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center"
        aria-hidden="true"
      >
        <source src="/videos/Video%20Project%202.mp4" type="video/mp4" />
      </video>
      <div className="cinematic-video-section__overlay pointer-events-none absolute inset-0 z-[2]" />
    </section>
  );
}

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
