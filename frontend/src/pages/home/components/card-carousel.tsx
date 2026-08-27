import { useEffect, useRef } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useInView, useReducedMotion } from 'motion/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { A11y, Autoplay, EffectCoverflow, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

export interface CarouselProduct {
  id: string;
  name: string;
}

function updateSlideOpacity(swiper: SwiperInstance) {
  swiper.slides.forEach((slide) => {
    const progress = Math.abs((slide as HTMLElement & { progress?: number }).progress ?? 0);
    const distance = Math.min(progress, 2);
    const opacity = 1 - distance * 0.23;

    slide.style.setProperty('--featured-slide-opacity', opacity.toFixed(3));
  });
}

interface CarouselNavButtonProps {
  direction: 'previous' | 'next';
  onClick: () => void;
  ariaLabel: string;
}

function CarouselNavButton({ direction, onClick, ariaLabel }: CarouselNavButtonProps) {
  const Icon = direction === 'previous' ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      className={`featured-products-carousel__nav featured-products-carousel__nav--${direction}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="featured-products-carousel__nav-fill-wrapper" aria-hidden="true">
        <span className="featured-products-carousel__nav-fill" />
      </span>
      <span className="featured-products-carousel__nav-icon-viewport" aria-hidden="true">
        <span className="featured-products-carousel__nav-icon featured-products-carousel__nav-icon--outgoing">
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <span className="featured-products-carousel__nav-icon featured-products-carousel__nav-icon--incoming">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </span>
    </button>
  );
}

interface CardCarouselProps<T extends CarouselProduct> {
  products: readonly T[];
  renderCard: (product: T, index: number) => ReactNode;
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
  ariaLabel?: string;
}

export function CardCarousel<T extends CarouselProduct>({
  products,
  renderCard,
  autoplayDelay = 4200,
  showPagination = true,
  showNavigation = true,
  ariaLabel = 'Sản phẩm nổi bật',
}: CardCarouselProps<T>) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const shouldReduceMotion = useReducedMotion() === true;
  const isInView = useInView(carouselRef, { amount: 0.25 });

  useEffect(() => {
    const autoplay = swiperRef.current?.autoplay;
    if (!autoplay) return;

    if (shouldReduceMotion || !isInView) {
      autoplay.stop();
      return;
    }

    if (!autoplay.running) autoplay.start();
  }, [isInView, shouldReduceMotion]);

  const pauseAutoplay = () => {
    const autoplay = swiperRef.current?.autoplay;
    if (autoplay?.running && !autoplay.paused) autoplay.pause();
  };

  const resumeAutoplay = () => {
    if (shouldReduceMotion || !isInView) return;

    const autoplay = swiperRef.current?.autoplay;
    if (!autoplay) return;
    if (autoplay.running) autoplay.resume();
    else autoplay.start();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      resumeAutoplay();
    }
  };

  return (
    <div
      ref={carouselRef}
      className="featured-products-carousel relative"
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onFocusCapture={pauseAutoplay}
      onBlurCapture={handleBlur}
    >
      <div className="featured-products-viewport">
        <Swiper
          modules={[A11y, Autoplay, EffectCoverflow, Keyboard, Pagination]}
          effect="coverflow"
          centeredSlides
          slidesPerView="auto"
          spaceBetween={44}
          grabCursor
          loop={products.length > 1}
          slideToClickedSlide
          speed={760}
          keyboard={{ enabled: true, onlyInViewport: true }}
          autoplay={shouldReduceMotion ? false : {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: true,
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 96,
            scale: 0.98,
            modifier: 1.55,
            slideShadows: false,
          }}
          pagination={showPagination ? {
            clickable: true,
            renderBullet: (index, className) => (
              `<button type="button" class="${className}" aria-label="Chuyển đến sản phẩm ${index + 1}"></button>`
            ),
          } : false}
          a11y={{
            enabled: true,
            containerMessage: ariaLabel,
            containerRoleDescriptionMessage: 'băng chuyền',
            itemRoleDescriptionMessage: 'sản phẩm',
            prevSlideMessage: 'Xem sản phẩm trước',
            nextSlideMessage: 'Xem sản phẩm tiếp theo',
            paginationBulletMessage: 'Chuyển đến sản phẩm {{index}}',
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            updateSlideOpacity(swiper);
            if (shouldReduceMotion || !isInView) swiper.autoplay.stop();
          }}
          onSetTranslate={updateSlideOpacity}
          onBeforeDestroy={() => {
            swiperRef.current = null;
          }}
        >
          {products.map((product, index) => (
            <SwiperSlide key={product.id}>
              {renderCard(product, index)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {showNavigation && (
        <>
          <CarouselNavButton
            direction="previous"
            ariaLabel="Xem sản phẩm trước"
            onClick={() => swiperRef.current?.slidePrev()}
          />
          <CarouselNavButton
            direction="next"
            ariaLabel="Xem sản phẩm tiếp theo"
            onClick={() => swiperRef.current?.slideNext()}
          />
        </>
      )}
    </div>
  );
}
