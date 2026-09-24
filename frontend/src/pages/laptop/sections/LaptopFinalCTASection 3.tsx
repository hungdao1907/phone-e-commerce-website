import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LaptopBrandConfig } from '../types';

export function LaptopFinalCTASection({ config }: { config: LaptopBrandConfig }) {
  const reducedMotion = useReducedMotion();
  const scrollToProducts = () =>
    document.getElementById('laptop-all-products')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section aria-label={'Khám phá ' + config.label} className="overflow-hidden bg-white px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-10 overflow-hidden rounded-[2rem] bg-[#f6f7f9] px-6 py-12 sm:px-10 lg:flex-row lg:px-16">
        <div className="laptop-final__glow" aria-hidden="true" />
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55 }}
          className="relative z-10 max-w-xl"
        >
          <p className="text-xs font-bold tracking-[0.18em] text-neutral-500">{config.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">{config.finalTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600">{config.finalCopy}</p>
          <button
            type="button"
            onClick={scrollToProducts}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--laptop-accent)] focus-visible:ring-offset-2"
          >
            Khám phá sản phẩm
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
        <motion.img
          initial={reducedMotion ? false : { opacity: 0, x: 24, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.1 }}
          src={config.heroImage}
          alt={config.label + ' prototype visual'}
          loading="lazy"
          className="relative z-10 h-auto w-full max-w-sm object-contain"
        />
      </div>
    </section>
  );
}
