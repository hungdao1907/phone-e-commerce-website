import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { Link } from 'react-router-dom';
import { HeroBackground } from '@/components/ui/HeroBackground';

const cinematicEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

type HeroSectionProps = {
  isCovered?: boolean;
};

export function HeroSection({ isCovered = false }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() === true;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 70, damping: 26, mass: 0.45 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 70, damping: 26, mass: 0.45 });

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (
      reducedMotion
      || isCovered
      || event.pointerType !== 'mouse'
      || window.innerWidth < 768
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
    pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  }

  function resetPointerDepth() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <section
      ref={heroRef}
      className="cosmic-hero relative z-0 -mt-[44px] flex min-h-[100svh] w-full overflow-hidden pt-[44px] text-white"
      aria-labelledby="home-hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointerDepth}
    >
      <HeroBackground
        pointerX={smoothPointerX}
        pointerY={smoothPointerY}
        reducedMotion={reducedMotion}
      />

      <div className="relative z-30 mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-6 py-20 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="flex w-full max-w-[77rem] flex-col items-center text-center">
          <motion.div
            className="mb-7 flex items-center gap-3.5 sm:mb-9"
            initial={reducedMotion ? false : { opacity: 0, y: 12, letterSpacing: '0.52em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.32em' }}
            transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.34, ease: cinematicEase }}
          >
            <span className="h-px w-7 bg-white/25" />
            <p className="text-[10px] font-semibold uppercase text-violet-100/80 sm:text-[11px]">
              The Next Device
            </p>
            <span className="h-px w-7 bg-white/25" />
          </motion.div>

          <h1
            id="home-hero-title"
            className="max-w-[11ch] text-[clamp(4.35rem,10.5vw,10rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-white sm:max-w-none"
          >
            <span className="cosmic-hero__headline-mask">
              <motion.span
                className="block"
                initial={reducedMotion ? false : { opacity: 0, y: '112%' }}
                animate={{ opacity: 1, y: '0%' }}
                transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.48, ease: cinematicEase }}
              >
                Chạm vào
              </motion.span>
            </span>
            <span className="cosmic-hero__headline-mask mt-[0.03em]">
              <motion.span
                className="block text-white/74"
                initial={reducedMotion ? false : { opacity: 0, y: '112%' }}
                animate={{ opacity: 1, y: '0%' }}
                transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.61, ease: cinematicEase }}
              >
                thế hệ <em className="not-italic text-violet-100">mới.</em>
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mt-9 max-w-[33rem] text-[0.94rem] font-medium leading-7 text-white/68 sm:mt-10 sm:text-base sm:leading-7"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.62, delay: reducedMotion ? 0 : 0.9, ease: cinematicEase }}
          >
            Khám phá những thiết bị được tạo ra cho cách bạn sống và sáng tạo.
          </motion.p>

          <div className="mt-8 sm:mt-10">
            <motion.div
              className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.58, delay: reducedMotion ? 0 : 1.04, ease: cinematicEase }}
            >
              <a
                href="#home-experience"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0a0712] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_36px_rgba(40,17,97,0.22)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_44px_rgba(61,30,156,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Khám phá ngay
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <Link
                to="/iphone"
                className="group inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-white/68 transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Xem iPhone
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
