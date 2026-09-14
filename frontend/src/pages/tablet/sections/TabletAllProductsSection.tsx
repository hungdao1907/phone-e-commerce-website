import { useMemo, useState } from 'react';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, BadgePercent, Sparkles, Star } from 'lucide-react';
import { TabletProductCard } from '@/components/product-cards/TabletProductCard';
import type { TabletBrandConfig, TabletModel } from '../types';

type TabletFilter = 'popular' | 'promotion' | 'price-asc' | 'price-desc';

const filters = [
  { id: 'popular', label: 'Phổ biến', icon: Star },
  { id: 'promotion', label: 'Khuyến mãi HOT', icon: BadgePercent },
  { id: 'price-asc', label: 'Giá Thấp - Cao', icon: ArrowUpNarrowWide },
  { id: 'price-desc', label: 'Giá Cao - Thấp', icon: ArrowDownNarrowWide },
] as const;

interface TabletAllProductsSectionProps {
  config: TabletBrandConfig;
  products: TabletModel[];
}

export function TabletAllProductsSection({ config, products }: TabletAllProductsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<TabletFilter>('popular');
  const filteredProducts = useMemo(() => {
    const next = [...products];
    if (activeFilter === 'promotion') {
      return next.sort(
        (first, second) =>
          (second.originalPrice ?? second.price) - second.price - ((first.originalPrice ?? first.price) - first.price),
      );
    }
    if (activeFilter === 'price-asc') return next.sort((first, second) => first.price - second.price);
    if (activeFilter === 'price-desc') return next.sort((first, second) => second.price - first.price);
    return next;
  }, [activeFilter, products]);

  return (
    <section
      id="tablet-all-products"
      aria-labelledby="tablet-all-products-title"
      className="scroll-mt-16 bg-[#f6f7f9] px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
            <Sparkles className="h-3.5 w-3.5 text-[var(--tablet-accent)]" />
            TẤT CẢ SẢN PHẨM
          </span>
          <h2 id="tablet-all-products-title" className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Tìm {config.label} dành cho bạn
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">{config.allProductsDescription}</p>
        </header>

        <div className="mt-12 overflow-x-auto pb-2 no-scrollbar">
          <div
            className="flex w-max min-w-full justify-start gap-3 sm:justify-center"
            role="group"
            aria-label={'Lọc sản phẩm ' + config.label}
          >
            {filters.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveFilter(filter.id)}
                  className={
                    'inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-3 text-base font-medium transition-all ' +
                    (active
                      ? 'border-[var(--tablet-accent)] bg-white text-[var(--tablet-accent)] shadow-[0_4px_14px_rgba(15,23,42,0.08)]'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300')
                  }
                >
                  <Icon className="h-5 w-5" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <TabletProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}