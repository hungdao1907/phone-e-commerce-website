import { Cpu, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LaptopBrandConfig } from '../../../types/laptop/types/index';

const icons = [Cpu, Zap, ShieldCheck, Sparkles];

export function LaptopWhySection({ config }: { config: LaptopBrandConfig }) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="laptop-why-title"
      className="relative overflow-hidden bg-[#f7f8fa] px-4 py-24 sm:px-6 sm:py-28 lg:px-8"
    >
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 select-none -translate-x-1/2 translate-y-[18%] text-[clamp(7rem,19vw,17rem)] font-black leading-none tracking-[-0.07em] text-black/[0.025]"
        aria-hidden="true"
      >
        {config.label}
      </div>
      <div className="relative mx-auto w-full max-w-7xl">
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-16 max-w-2xl text-center sm:mb-20"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--laptop-accent)]">{config.eyebrow}</p>
          <h2 id="laptop-why-title" className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            {config.whyTitle}
          </h2>
        </motion.header>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {config.whyPillars.map((pillar, index) => {
            const Icon = icons[index] ?? Cpu;
            return (
              <motion.article
                key={pillar.title}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={
                  'group px-0 py-8 sm:px-8 sm:py-2 ' +
                  (index > 0 ? 'border-t border-neutral-900/[0.08] sm:border-l sm:border-t-0' : '')
                }
              >
                <span className="text-[11px] font-medium tracking-[0.12em] text-neutral-300">0{index + 1}</span>
                <div className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--laptop-accent-soft)] text-[var(--laptop-accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 h-0.5 w-6 rounded-full bg-[var(--laptop-accent)] opacity-50 transition-all duration-300 group-hover:w-10" />
                <h3 className="mt-5 text-sm font-bold uppercase tracking-[0.08em] text-neutral-800">{pillar.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">{pillar.copy}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
