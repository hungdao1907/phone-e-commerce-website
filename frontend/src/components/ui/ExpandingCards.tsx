import type { KeyboardEvent, ReactNode } from 'react';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CategoryCardItem {
  id: string;
  title: string;
  eyebrow?: string;
  description: string;
  ctaText?: string;
  href?: string;
  imageSrc?: string | null;
  imageClassName?: string;
  accent?: string;
  glow?: string;
  renderLogo?: (isActive: boolean) => ReactNode;
  renderVisual?: (isActive: boolean) => ReactNode;
}

export interface ExpandingCardsProps {
  items: readonly CategoryCardItem[];
  defaultActiveIndex?: number;
  className?: string;
}

export function ExpandingCards({
  items,
  defaultActiveIndex = 0,
  className = '',
}: ExpandingCardsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <div
      className={`expanding-cards-container flex flex-col md:flex-row gap-3 sm:gap-3.5 lg:gap-4 w-full md:h-[520px] lg:h-[560px] xl:h-[590px] select-none ${className}`}
      role="tablist"
      aria-label="Danh mục công nghệ"
    >
      {items.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <div
            key={item.id}
            role="tab"
            tabIndex={0}
            id={`category-tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`category-panel-${item.id}`}
            aria-label={`${item.title} - ${item.description}`}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`expanding-card category-liquid-card ${
              isActive ? 'expanding-card--active category-liquid-card--active' : ''
            } group select-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
          >
            {/* ═══ LAYER 1: Clear dark-glass base ═══ */}
            <div
              className="category-liquid-glass-base absolute inset-0 rounded-[inherit] pointer-events-none"
              aria-hidden="true"
            />

            {/* ═══ LAYER 2: Category Tint (radial, subtle) ═══ */}
            <div
              className="category-liquid-tint absolute inset-0 rounded-[inherit] pointer-events-none"
              style={{
                background: item.accent
                  ? `radial-gradient(ellipse 90% 70% at 30% 25%, ${item.accent}1c 0%, transparent 68%)`
                  : 'radial-gradient(ellipse 90% 70% at 30% 25%, rgba(255,255,255,0.03) 0%, transparent 68%)',
              }}
              aria-hidden="true"
            />

            {/* ═══ LAYER 3: Specular Highlight ═══ */}
            <div
              className="category-liquid-specular absolute inset-0 pointer-events-none rounded-[inherit]"
              aria-hidden="true"
            />

            {/* ═══ LAYER 4: Restrained surface glint ═══ */}
            <div
              className="category-liquid-surface-glint absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
              aria-hidden="true"
            >
              <span className="category-liquid-surface-glint__line" />
            </div>

            {/* ═══ LAYER 5: Content Scrim ═══ */}
            <div
              className="category-liquid-content-scrim absolute inset-0 pointer-events-none rounded-[inherit]"
              aria-hidden="true"
            />

            {/* ═══ LAYER 6: Brand Logo (Stays in Center and Scales Up when Active) ═══ */}
            <div
              className={`absolute z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? 'top-[34%] sm:top-[36%] lg:top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.7] sm:scale-[2.0] lg:scale-[2.2] origin-center'
                  : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 origin-center'
              }`}
              aria-hidden="true"
            >
              {item.renderLogo ? (
                item.renderLogo(isActive)
              ) : item.imageSrc ? (
                <img
                  src={item.imageSrc}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] object-contain ${
                    item.imageClassName || 'h-8 sm:h-9 max-w-[120px]'
                  } ${
                    isActive
                      ? 'opacity-100 filter-none'
                      : 'opacity-70 grayscale-[20%]'
                  }`}
                />
              ) : null}
            </div>

            {/* ═══ LAYER 7: Inactive Card Label (Centered at bottom of collapsed card) ═══ */}
            <div
              className={`absolute bottom-4 sm:bottom-5 inset-x-0 text-center px-2 pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? 'opacity-0 translate-y-2 pointer-events-none'
                  : 'opacity-90 translate-y-0'
              }`}
              aria-hidden={isActive}
            >
              <span className="category-card-luminous-subtext text-xs sm:text-[13px] font-medium tracking-wide truncate block max-w-full">
                {item.title}
              </span>
            </div>

            {/* ═══ LAYER 8: Active Editorial Content (Eyebrow -> Title -> Description -> CTA) ═══ */}
            <div
              id={`category-panel-${item.id}`}
              className={`relative z-10 w-full h-full p-5 sm:p-6 lg:p-7 flex flex-col justify-end pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <div className="max-w-[480px]">
                {/* Eyebrow */}
                {item.eyebrow && (
                  <span
                    className={`category-card-luminous-eyebrow inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5 transition-all duration-500 delay-75 ${
                      isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    {item.eyebrow}
                  </span>
                )}

                {/* Title */}
                <h3
                  className={`category-card-luminous-title font-bold tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-2.5 transition-all duration-500 delay-100 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  {item.title}
                </h3>

                {/* Story Description (2-4 lines) */}
                <p
                  className={`category-card-luminous-subtext text-xs sm:text-sm lg:text-[14.5px] font-normal leading-relaxed mb-3.5 sm:mb-4 transition-all duration-500 delay-150 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  {item.description}
                </p>

                {/* CTA Link / Button */}
                <div
                  className={`transition-all duration-500 delay-200 ${
                    isActive ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
                >
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="category-card-luminous-cta inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all group/cta py-1 focus-visible:outline-none focus-visible:underline"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${item.ctaText || 'Khám phá'} ${item.title}`}
                    >
                      <span>{item.ctaText || 'Khám phá'}</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover/cta:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : (
                    <span className="category-card-luminous-cta inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold group/cta py-1">
                      <span>{item.ctaText || 'Khám phá'}</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover/cta:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
