import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TabletProductCard } from '../components/TabletProductCard';
import type { TabletBrandConfig, TabletModel } from '../types';

interface TabletFeaturedProductsSectionProps {
  config: TabletBrandConfig;
  products: TabletModel[];
}

export function TabletFeaturedProductsSection({ config, products }: TabletFeaturedProductsSectionProps) {
  const reducedMotion = useReducedMotion();
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  return (
    <section aria-labelledby="tablet-featured-title" className="bg-white px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
            <Sparkles className="h-3.5 w-3.5 text-[var(--tablet-accent)]" />
            SẢN PHẨM NỔI BẬT
          </span>
          <h2 id="tablet-featured-title" className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            {config.label} nổi bật
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Ba lựa chọn tiêu biểu cho những cách làm việc, sáng tạo và giải trí khác nhau.
          </p>
        </motion.header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
            >
              <TabletProductCard product={product} priority={index === 0} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}