import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { CardCarousel } from '@/components/ui/CardCarousel';
import type { CarouselProduct } from '@/components/ui/CardCarousel';
import { useHomeSectionReturn } from '@/hooks/useHomeSectionReturn';
import { HOME_SECTION_IDS } from '@/lib/homeSectionHistory';
import {
  fetchHomeFeaturedProducts,
  formatFeaturedProductPrice,
  getFeaturedProductImage,
  type HomeFeaturedProduct,
} from '@/services/homeFeaturedProducts.api';

interface FeaturedProduct extends CarouselProduct {
  brand: string;
  fullName: string;
  fullTagline: string;
  tagline: string;
  price: string;
  image: string;
  imageClassName: string;
  accent: string;
  glow: string;
  href: string;
}

const PREMIUM_EASE = [0.16, 1, 0.3, 1] as const;
const CARD_NAME_LIMIT = 52;
const CARD_TAGLINE_LIMIT = 120;

const BRAND_PRESENTATION: Record<string, Pick<FeaturedProduct, 'accent' | 'glow' | 'imageClassName'>> = {
  apple: { accent: '#8c7a68', glow: 'rgba(164, 143, 121, 0.2)', imageClassName: 'featured-product-card__image--iphone' },
  iphone: { accent: '#8c7a68', glow: 'rgba(164, 143, 121, 0.2)', imageClassName: 'featured-product-card__image--iphone' },
  samsung: { accent: '#1f63c6', glow: 'rgba(31, 99, 198, 0.17)', imageClassName: 'featured-product-card__image--samsung' },
  xiaomi: { accent: '#ef7414', glow: 'rgba(239, 116, 20, 0.18)', imageClassName: 'featured-product-card__image--xiaomi' },
  oppo: { accent: '#2d8c67', glow: 'rgba(45, 140, 103, 0.16)', imageClassName: '' },
};

function plainText(value: string | null): string {
  if (!value) return 'Sản phẩm chính hãng với trải nghiệm được chọn lọc cho bạn.';
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || 'Sản phẩm chính hãng với trải nghiệm được chọn lọc cho bạn.';
}

function truncateCardText(value: string, maxLength: number): string {
  const text = value.trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
}

function toFeaturedProduct(item: HomeFeaturedProduct): FeaturedProduct {
  const brand = (item.product.brand || item.product.category?.name || 'Sản phẩm nổi bật').trim();
  const presentation = BRAND_PRESENTATION[brand.toLowerCase()] ?? {
    accent: '#5f6b7a',
    glow: 'rgba(95, 107, 122, 0.16)',
    imageClassName: '',
  };
  const fullTagline = plainText(item.product.description);

  return {
    id: item.id,
    brand: brand.toUpperCase(),
    fullName: item.product.name,
    name: truncateCardText(item.product.name, CARD_NAME_LIMIT),
    fullTagline,
    tagline: truncateCardText(fullTagline, CARD_TAGLINE_LIMIT),
    price: formatFeaturedProductPrice(item.product),
    image: getFeaturedProductImage(item.product),
    imageClassName: presentation.imageClassName,
    accent: presentation.accent,
    glow: presentation.glow,
    href: `/product/${item.product.id}`,
  };
}

interface RevealOptions {
  y?: number;
  delay: number;
  duration: number;
  reduceMotion: boolean;
}

function makeRevealVariants({ y = 24, delay, duration, reduceMotion }: RevealOptions): Variants {
  return {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.16 : duration, delay: reduceMotion ? 0 : delay, ease: PREMIUM_EASE },
    },
  };
}

function ProductCard({ product, index }: { product: FeaturedProduct; index: number }) {
  const rememberReturn = useHomeSectionReturn(HOME_SECTION_IDS.featuredProducts);
  const cardStyle = {
    '--product-accent': product.accent,
    '--product-glow': product.glow,
    backgroundColor: '#ffffff',
  } as CSSProperties;

  return (
    <article className="featured-product-card bg-white" style={cardStyle}>
      <div className="featured-product-card__stage bg-white" aria-hidden="true">
        <span className="featured-product-card__accent" />
      </div>
      <div className="featured-product-card__media">
        {product.image ? (
          <img className={`featured-product-card__image ${product.imageClassName}`} src={product.image} alt={`${product.brand} ${product.fullName}`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
        ) : (
          <span className="featured-product-card__wordmark">{product.brand}</span>
        )}
      </div>
      <div className="featured-product-card__content">
        <p className="featured-product-card__brand">{product.brand}</p>
        <h3 title={product.fullName}>{product.name}</h3>
        <p className="featured-product-card__tagline" title={product.fullTagline}>{product.tagline}</p>
        <div className="featured-product-card__footer">
          <p>{product.price}</p>
          <Link className="featured-product-card__cta" to={product.href} onClick={rememberReturn} aria-label={`Xem chi tiết ${product.fullName}`}>
            <span>Xem chi tiết</span>
            <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedProductsSection() {
  const shouldReduceMotion = useReducedMotion() === true;
  const [items, setItems] = useState<HomeFeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetchHomeFeaturedProducts(controller.signal)
      .then((featuredProducts) => setItems(featuredProducts))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHasError(true);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const products = useMemo(() => items.map(toFeaturedProduct), [items]);
  if (!isLoading && (hasError || products.length === 0)) return null;

  return (
    <section id={HOME_SECTION_IDS.featuredProducts} data-home-section={HOME_SECTION_IDS.featuredProducts} className="featured-products-section overflow-hidden bg-white py-20 sm:py-24 lg:py-28 xl:py-32" aria-labelledby="featured-products-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <motion.div className="max-w-[1200px]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <motion.p className="text-[0.7rem] font-semibold tracking-[0.2em] text-[#6e6e73] sm:text-xs" variants={makeRevealVariants({ y: 16, delay: 0.05, duration: 0.7, reduceMotion: shouldReduceMotion })}>NỔI BẬT</motion.p>
          <div className="mt-4 overflow-hidden py-2 sm:mt-5 sm:py-3">
            <h2 id="featured-products-title" className="max-w-[1200px] text-[clamp(1.75rem,calc(1.25rem+2vw),3rem)] font-semibold leading-[1.15] tracking-[-0.04em]">
              <motion.span className="inline-block text-[#1d1d1f]" variants={makeRevealVariants({ y: 32, delay: 0.15, duration: 0.95, reduceMotion: shouldReduceMotion })}>Thế hệ mới nhất.</motion.span>{' '}
              <motion.span className="inline-block text-[#6e6e73]" variants={makeRevealVariants({ y: 32, delay: 0.3, duration: 0.95, reduceMotion: shouldReduceMotion })}>Xem ngay có gì mới.</motion.span>
            </h2>
          </div>
          <motion.p className="mt-4 max-w-[620px] text-base leading-relaxed text-[#6e6e73] sm:text-lg" variants={makeRevealVariants({ y: 22, delay: 0.45, duration: 0.85, reduceMotion: shouldReduceMotion })}>
            Những lựa chọn nổi bật cho hiệu năng, thiết kế và trải nghiệm mỗi ngày.
          </motion.p>
        </motion.div>
        <div className="mt-12 sm:mt-14 lg:mt-16">
          {isLoading ? (
            <div className="h-[420px] animate-pulse rounded-[2rem] bg-[#f5f5f7]" role="status" aria-label="Đang tải sản phẩm nổi bật" />
          ) : (
            <CardCarousel products={products} autoplayDelay={4200} ariaLabel="Sản phẩm nổi bật" renderCard={(product, index) => <ProductCard product={product} index={index} />} />
          )}
        </div>
      </div>
    </section>
  );
}
