import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { CardCarousel } from '../components/card-carousel';
import type { CarouselProduct } from '../components/card-carousel';

interface FeaturedProduct extends CarouselProduct {
  brand: string;
  tagline: string;
  price: string;
  image: string | null;
  imageClassName: string;
  accent: string;
  glow: string;
  href?: string;
}

const featuredProducts: readonly FeaturedProduct[] = [
  {
    id: 'iphone-17-pro-max',
    brand: 'APPLE',
    name: 'iPhone 17 Pro Max',
    tagline: 'Sức mạnh Pro trong một thiết kế tinh giản.',
    price: 'Từ 37.990.000₫',
    image: '/images/iphone.png',
    imageClassName: 'featured-product-card__image--iphone',
    accent: '#8c7a68',
    glow: 'rgba(164, 143, 121, 0.2)',
    href: '/iphone',
  },
  {
    id: 'galaxy-s25-ultra',
    brand: 'SAMSUNG',
    name: 'Galaxy S25 Ultra',
    tagline: 'Trải nghiệm Galaxy đỉnh cao, sắc nét từng chi tiết.',
    price: 'Từ 30.990.000₫',
    image: '/images/samsung.png',
    imageClassName: 'featured-product-card__image--samsung',
    accent: '#1f63c6',
    glow: 'rgba(31, 99, 198, 0.17)',
  },
  {
    id: 'xiaomi-15-ultra',
    brand: 'XIAOMI',
    name: 'Xiaomi 15 Ultra',
    tagline: 'Nhiếp ảnh di động, nâng tầm mọi khoảnh khắc.',
    price: 'Từ 24.990.000₫',
    image: '/images/xiaomi.png',
    imageClassName: 'featured-product-card__image--xiaomi',
    accent: '#ef7414',
    glow: 'rgba(239, 116, 20, 0.18)',
  },
  {
    id: 'oppo-find-x8-pro',
    brand: 'OPPO',
    name: 'OPPO Find X8 Pro',
    tagline: 'Nhiếp ảnh flagship, thiết kế tinh tế.',
    price: 'Từ 29.990.000₫',
    image: null,
    imageClassName: 'featured-product-card__wordmark--oppo',
    accent: '#2d8c67',
    glow: 'rgba(45, 140, 103, 0.16)',
  },
];

const PREMIUM_EASE = [0.16, 1, 0.3, 1] as const;

interface RevealOptions {
  y?: number;
  delay: number;
  duration: number;
  reduceMotion: boolean;
}

function makeRevealVariants({
  y = 24,
  delay,
  duration,
  reduceMotion,
}: RevealOptions): Variants {
  return {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.16 : duration,
        delay: reduceMotion ? 0 : delay,
        ease: PREMIUM_EASE,
      },
    },
  };
}

function ProductCard({
  product,
  index,
}: {
  product: FeaturedProduct;
  index: number;
}) {
  const cardStyle = {
    '--product-accent': product.accent,
    '--product-glow': product.glow,
  } as CSSProperties;

  return (
    <article
      className="featured-product-card"
      style={cardStyle}
    >
      <div className="featured-product-card__stage" aria-hidden="true">
        <span className="featured-product-card__accent" />
      </div>

      <div className="featured-product-card__media">
        {product.image ? (
          <img
            className={`featured-product-card__image ${product.imageClassName}`}
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        ) : (
          <span className={`featured-product-card__wordmark ${product.imageClassName}`}>
            {product.brand}
          </span>
        )}
      </div>

      <div className="featured-product-card__content">
        <p className="featured-product-card__brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <p className="featured-product-card__tagline">{product.tagline}</p>

        <div className="featured-product-card__footer">
          <p>{product.price}</p>
          {product.href ? (
            <Link
              className="featured-product-card__cta"
              to={product.href}
              aria-label={`Xem chi tiết ${product.name}`}
            >
              <span>Xem chi tiết</span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </Link>
          ) : (
            <span className="featured-product-card__availability">Tại cửa hàng</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function FeaturedProductsSection() {
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <section
      className="featured-products-section overflow-hidden bg-[#f5f5f7] py-20 sm:py-24 lg:py-28 xl:py-32"
      aria-labelledby="featured-products-title"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <motion.div
          className="max-w-[1200px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.p
            className="text-[0.7rem] font-semibold tracking-[0.2em] text-[#6e6e73] sm:text-xs"
            variants={makeRevealVariants({
              y: 16,
              delay: 0.05,
              duration: 0.7,
              reduceMotion: shouldReduceMotion,
            })}
          >
            NỔI BẬT
          </motion.p>

          <div className="mt-4 overflow-hidden py-2 sm:mt-5 sm:py-3">
            <h2
              id="featured-products-title"
              className="max-w-[1200px] text-[clamp(1.75rem,calc(1.25rem+2vw),3rem)] font-semibold leading-[1.15] tracking-[-0.04em]"
            >
              <motion.span
                className="inline-block text-[#1d1d1f]"
                variants={makeRevealVariants({
                  y: 32,
                  delay: 0.15,
                  duration: 0.95,
                  reduceMotion: shouldReduceMotion,
                })}
              >
                Thế hệ mới nhất.
              </motion.span>{' '}
              <motion.span
                className="inline-block text-[#6e6e73]"
                variants={makeRevealVariants({
                  y: 32,
                  delay: 0.3,
                  duration: 0.95,
                  reduceMotion: shouldReduceMotion,
                })}
              >
                Xem ngay có gì mới.
              </motion.span>
            </h2>
          </div>

          <motion.p
            className="mt-4 max-w-[620px] text-base leading-relaxed text-[#6e6e73] sm:text-lg"
            variants={makeRevealVariants({
              y: 22,
              delay: 0.45,
              duration: 0.85,
              reduceMotion: shouldReduceMotion,
            })}
          >
            Những lựa chọn nổi bật cho hiệu năng, thiết kế và trải nghiệm mỗi ngày.
          </motion.p>
        </motion.div>

        <div className="mt-12 sm:mt-14 lg:mt-16">
          <CardCarousel
            products={featuredProducts}
            autoplayDelay={4200}
            ariaLabel="Bốn sản phẩm điện thoại nổi bật"
            renderCard={(product, index) => (
              <ProductCard
                product={product}
                index={index}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
