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
      className={`expanding-cards-container flex flex-col md:flex-row gap-3 sm:gap-3.5 lg:gap-4 w-full md:h-[540px] lg:h-[600px] xl:h-[640px] select-none ${className}`}
      role="tablist"
      aria-label="Danh mục sản phẩm công nghệ"
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

            {/* ═══ LAYER 2: Category Tint (radial, very subtle) ═══ */}
            <div
              className="category-liquid-tint absolute inset-0 rounded-[inherit] pointer-events-none"
              style={{
                background: item.accent
                  ? `radial-gradient(ellipse 92% 68% at 46% 18%, ${item.accent}14 0%, transparent 66%)`
                  : 'radial-gradient(ellipse 92% 68% at 46% 18%, rgba(255,255,255,0.025) 0%, transparent 66%)',
              }}
              aria-hidden="true"
            />

            {/* ═══ LAYER 3: Visual Container ═══ */}
            <div
              className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 lg:p-10 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              {item.imageSrc ? (
                <img
                  src={item.imageSrc}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className={`w-full h-full object-contain transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${item.imageClassName || ''} ${
                    isActive
                      ? 'scale-100 sm:scale-105 -translate-y-4 opacity-100 filter-none'
                      : 'scale-90 translate-y-0 opacity-60 grayscale-[30%]'
                  }`}
                />
              ) : item.renderVisual ? (
                item.renderVisual(isActive)
              ) : null}
            </div>

            {/* ═══ LAYER 4: Specular Highlight (top-left oval) ═══ */}
            <div
              className="category-liquid-specular absolute inset-0 pointer-events-none rounded-[inherit]"
              aria-hidden="true"
            />

            {/* ═══ LAYER 5: Restrained surface glint ═══ */}
            <div
              className="category-liquid-surface-glint absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
              aria-hidden="true"
            >
              <span className="category-liquid-surface-glint__line" />
            </div>

            {/* ═══ LAYER 6: Content Scrim (localized bottom gradient for readability) ═══ */}
            <div
              className="category-liquid-content-scrim absolute inset-0 pointer-events-none rounded-[inherit]"
              aria-hidden="true"
            />

            {/* ═══ LAYER 7: Edge Refraction (::before + ::after via CSS) ═══ */}
            {/* Handled in CSS .category-liquid-card::before and ::after */}

            {/* ═══ LAYER 8: Content Overlay ═══ */}
            <div className="relative z-10 w-full h-full p-4 sm:p-5 lg:p-6 flex flex-col justify-between pointer-events-none">
              {/* Top Bar: Eyebrow */}
              <div className="flex items-center justify-end w-full">
                {item.eyebrow && (
                  <span
                    className={`text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] font-medium transition-opacity duration-500 uppercase ${
                      isActive ? 'opacity-75 text-white/70' : 'opacity-0 md:opacity-0'
                    }`}
                  >
                    {item.eyebrow}
                  </span>
                )}
              </div>

              {/* Bottom Editorial Content */}
              <div className="w-full">
                <h3
                  className={`font-semibold text-white tracking-[-0.02em] transition-all duration-500 whitespace-nowrap ${
                    isActive
                      ? 'text-xl sm:text-2xl lg:text-3xl'
                      : 'text-base sm:text-lg lg:text-xl text-white/80'
                  }`}
                >
                  {item.title}
                </h3>

                {/* Expanded Description */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? 'max-h-24 opacity-100 mt-2 sm:mt-2.5'
                      : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <p className="text-xs sm:text-sm lg:text-base text-[#a1a1a6] leading-relaxed max-w-[380px]">
                    {item.description}
                  </p>
                </div>

                {/* Expanded CTA */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? 'max-h-16 opacity-100 mt-3.5 sm:mt-4 pointer-events-auto'
                      : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                  }`}
                >
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white hover:text-blue-400 transition-colors group/cta py-1"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${item.ctaText || 'Khám phá'} ${item.title}`}
                    >
                      <span>{item.ctaText || 'Khám phá'}</span>
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover/cta:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/90 group/cta py-1">
                      <span>{item.ctaText || 'Khám phá'}</span>
                      <ArrowRight
                        size={15}
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
