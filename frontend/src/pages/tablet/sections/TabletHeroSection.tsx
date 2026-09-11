import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { TabletBrandConfig } from '../types';

export function TabletHeroSection({ config }: { config: TabletBrandConfig }) {
  const reducedMotion = useReducedMotion();

  const scrollToProducts = () => {
    document.getElementById('tablet-all-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section aria-label={'Khám phá ' + config.label} className="tablet-hero relative isolate flex min-h-[72svh] items-center overflow-hidden bg-[var(--tablet-dark)] px-4 pb-16 pt-24 text-white sm:min-h-[78svh] sm:px-6 sm:pt-28 lg:min-h-[82svh] lg:px-8">
      <div className="tablet-hero__glow tablet-hero__glow--one" aria-hidden="true" />
      <div className="tablet-hero__glow tablet-hero__glow--two" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-xl"
        >
          <p className="text-xs font-bold tracking-[0.23em] text-white/55">{config.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-6xl">{config.heroTitle}</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/68 sm:text-lg">{config.heroSubtitle}</p>
          <button type="button" onClick={scrollToProducts} className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tablet-dark)]">
            Khám phá {config.label}<ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: reducedMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="tablet-hero__art relative mx-auto w-full max-w-3xl"
        >
          <img src={config.heroImage} alt={config.label + ' prototype campaign visual'} loading="eager" className="relative z-10 h-auto w-full object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.35)]" />
        </motion.div>
      </div>
    </section>
  );
}