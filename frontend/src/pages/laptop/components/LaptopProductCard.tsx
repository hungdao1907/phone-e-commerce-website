import { Battery, Cpu, HardDrive, Monitor, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LaptopModel } from '../types';

interface LaptopProductCardProps {
  product: LaptopModel;
  priority?: boolean;
}

const formatLaptopPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export function LaptopProductCard({ product, priority = false }: LaptopProductCardProps) {
  return (
    <article className="laptop-product-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="laptop-product-card__visual relative mb-6 flex aspect-[1.35/1] items-center justify-center overflow-hidden rounded-[1.25rem]">
        <img
          src={product.image}
          alt={product.name + ' prototype visual'}
          loading={priority ? 'eager' : 'lazy'}
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-black/5 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-600 backdrop-blur-sm">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--laptop-accent)]">{product.family}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{product.name}</h3>
        <p className="mt-2 text-sm font-medium text-neutral-700">{product.tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">{product.description}</p>

        <div className="mt-5 grid gap-2.5 border-t border-neutral-100 pt-5 text-xs text-neutral-600">
          <span className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="truncate">{product.specs.display}</span></span>
          <span className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="truncate">{product.specs.processor}</span></span>
          {product.specs.gpu ? (
            <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="truncate">{product.specs.gpu}</span></span>
          ) : null}
          <span className="flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="truncate">{product.specs.ram} • {product.specs.storage}</span></span>
          <span className="flex items-center gap-2"><Battery className="h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="truncate">{product.specs.battery}</span></span>
        </div>

        <div className="mt-5 flex items-center gap-2" aria-label={'Màu có sẵn cho ' + product.name}>
          {product.colors.map((color) => (
            <span
              key={color.name}
              title={color.name}
              className="h-5 w-5 rounded-full border border-black/10 shadow-inner transition-transform hover:scale-110"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-neutral-100 pt-5">
          <div>
            <p className="text-xs text-neutral-500">Giá tham khảo</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-neutral-950">{formatLaptopPrice(product.price)}</p>
            {product.originalPrice ? (
              <p className="mt-0.5 text-xs text-neutral-400 line-through">{formatLaptopPrice(product.originalPrice)}</p>
            ) : null}
          </div>
          <Link
            to={'/product/' + product.slug}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--laptop-accent)] focus-visible:ring-offset-2"
          >
            Chọn mua
          </Link>
        </div>
      </div>
    </article>
  );
}
