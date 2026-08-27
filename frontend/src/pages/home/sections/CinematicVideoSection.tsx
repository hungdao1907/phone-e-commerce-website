import { useReducedMotion } from 'motion/react';
import { AppleHelloEnglishEffect } from '../components/apple-hello-effect';

type CinematicVideoSectionProps = {
  helloReady?: boolean;
  id?: string;
};

export function CinematicVideoSection({
  helloReady,
  id,
}: CinematicVideoSectionProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const shouldShowHello = shouldReduceMotion || Boolean(helloReady);

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
        <source src="/videos/qp_4928dbd3222df0c6.mp4" type="video/mp4" />
      </video>
      <div className="cinematic-video-section__overlay pointer-events-none absolute inset-0 z-[2]" />

      <div
        className="cinematic-video-section__hello-layer pointer-events-none absolute bottom-5 right-5 z-[3] sm:bottom-8 sm:right-8 lg:bottom-[clamp(1.75rem,3vw,3rem)] lg:right-[clamp(2rem,3vw,3.5rem)]"
        aria-hidden="true"
      >
        {shouldShowHello && (
          <AppleHelloEnglishEffect
            className="block h-5 w-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.42)]"
            speed={shouldReduceMotion ? 0 : 0.8}
          />
        )}
      </div>
    </section>
  );
}
