import { motion, useReducedMotion } from 'framer-motion';
import type { WatchBrandConfig, WatchBrandModel } from '../../../../types/watch/brand/types/index';

interface WatchBrandExperienceSectionProps {
  config: WatchBrandConfig;
  products: WatchBrandModel[];
}

export function WatchBrandExperienceSection({ config, products }: WatchBrandExperienceSectionProps) {
  const reducedMotion = useReducedMotion();
  const primary = products[0];
  const secondary = products[1] ?? products[0];

  if (!primary) return null;

  return (
    <section aria-labelledby="watch-experience-title" className="watch-experience overflow-hidden bg-[var(--watch-dark)] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-white/50">{config.experience.eyebrow}</p>
          <h2 id="watch-experience-title" className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">{config.experience.title}</h2>
          <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">{config.experience.copy}</p>
          <p className="mt-8 border-l-2 border-[var(--watch-accent)] pl-4 text-sm leading-relaxed text-white/55">{config.experience.detail}</p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 28 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="watch-experience__visual relative mx-auto min-h-[300px] w-full max-w-2xl sm:min-h-[380px]"
        >
          <div className="watch-experience__halo" aria-hidden="true" />
          <img src={secondary.image} alt="" loading="lazy" className="watch-experience__device watch-experience__device--back" />
          <img src={primary.image} alt={primary.name + ' productivity prototype visual'} loading="lazy" className="watch-experience__device watch-experience__device--front" />
        </motion.div>
      </div>
    </section>
  );
}