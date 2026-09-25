import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WatchModelCard } from '@/components/watch/WatchModelCard';
import { WATCH_MODELS_DATA } from '../../../data/watch/data/index';

export function WatchModelsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const navigate = useNavigate();

  const handleModelSelect = (id?: string) => {
    if (id === 'watch-series-11') {
      navigate('/watch/series-11');
      return;
    }
    if (id === 'watch-se-3') {
      navigate('/watch/se-3');
      return;
    }
    if (id === 'watch-ultra-3') {
      navigate('/watch/ultra-3');
      return;
    }
    navigate('/watch/series-11');
  };

  /**
   * Dynamic Magnetic Push Displacement
   * When center card (Series 11) is hovered:
   *  - Left card (SE 3) is pushed outward to the left (-26px)
   *  - Right card (Ultra 3) is pushed outward to the right (+26px)
   *  - Center card elevates (-14px) and scales up (1.04) for focal brilliance
   */
  const getCardInteractiveStyle = (idx: number) => {
    if (!isDesktop) {
      if (hoveredIndex === idx) {
        return {
          transform: 'translate3d(0, -8px, 0)',
          zIndex: 10,
          opacity: 1,
        };
      }
      return {
        transform: 'translate3d(0, 0, 0)',
        zIndex: 1,
        opacity: 1,
      };
    }

    // Default rest position
    if (hoveredIndex === null) {
      return {
        transform: 'translate3d(0, 0, 0) scale(1)',
        zIndex: 1,
        opacity: 1,
      };
    }

    // Case 1: Hovering the Center Card (Series 11) -> Push left and right outward
    if (hoveredIndex === 1) {
      if (idx === 0) {
        // Left Card (SE 3) pushed left
        return {
          transform: 'translate3d(-26px, 0, 0) scale(0.97)',
          zIndex: 2,
          opacity: 0.9,
        };
      }
      if (idx === 1) {
        // Center Card (Series 11) focused & elevated
        return {
          transform: 'translate3d(0, -14px, 0) scale(1.04)',
          zIndex: 25,
          opacity: 1,
        };
      }
      if (idx === 2) {
        // Right Card (Ultra 3) pushed right
        return {
          transform: 'translate3d(26px, 0, 0) scale(0.97)',
          zIndex: 2,
          opacity: 0.9,
        };
      }
    }

    // Case 2: Hovering the Left Card (SE 3) -> Center & Right pushed right
    if (hoveredIndex === 0) {
      if (idx === 0) {
        return {
          transform: 'translate3d(0, -12px, 0) scale(1.03)',
          zIndex: 20,
          opacity: 1,
        };
      }
      if (idx === 1) {
        return {
          transform: 'translate3d(18px, 0, 0) scale(0.98)',
          zIndex: 2,
          opacity: 0.92,
        };
      }
      if (idx === 2) {
        return {
          transform: 'translate3d(28px, 0, 0) scale(0.97)',
          zIndex: 1,
          opacity: 0.88,
        };
      }
    }

    // Case 3: Hovering the Right Card (Ultra 3) -> Left & Center pushed left
    if (hoveredIndex === 2) {
      if (idx === 2) {
        return {
          transform: 'translate3d(0, -12px, 0) scale(1.03)',
          zIndex: 20,
          opacity: 1,
        };
      }
      if (idx === 1) {
        return {
          transform: 'translate3d(-18px, 0, 0) scale(0.98)',
          zIndex: 2,
          opacity: 0.92,
        };
      }
      if (idx === 0) {
        return {
          transform: 'translate3d(-28px, 0, 0) scale(0.97)',
          zIndex: 1,
          opacity: 0.88,
        };
      }
    }

    return {
      transform: 'translate3d(0, 0, 0) scale(1)',
      zIndex: 1,
      opacity: 1,
    };
  };

  return (
    <section
      id="watch-models"
      ref={sectionRef}
      className="py-20 sm:py-28 bg-[#fbfbfd] text-[#1d1d1f] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimalist Section Header with Staggered Scroll Reveal */}
        <div className="text-center max-w-2xl lg:max-w-3xl mx-auto mb-12 sm:mb-16">
          <span
            className={`text-xs font-bold tracking-widest text-[#0071e3] uppercase mb-2.5 block transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{ transitionDelay: '60ms' }}
          >
            BỘ SƯU TẬP APPLE WATCH
          </span>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1d1d1f] mb-3.5 leading-tight transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '140ms' }}
          >
            Khám phá các mẫu Apple Watch.
          </h2>
          <p
            className={`text-base sm:text-lg text-[#86868b] leading-relaxed max-w-xl mx-auto font-normal transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '220ms' }}
          >
            Ba thiết kế độc bản. Mọi công nghệ đột phá sẵn sàng đồng hành cùng phong cách sống của bạn.
          </p>
        </div>

        {/* 3-Column Apple Bento Cards Grid with Magnetic Push Interaction */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {WATCH_MODELS_DATA.map((model, idx) => {
            const cardStyle = getCardInteractiveStyle(idx);
            return (
              <div
                key={model.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                className={`will-change-transform ${
                  isVisible
                    ? 'translate-y-0'
                    : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
                style={{
                  transition:
                    hoveredIndex !== null
                      ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease'
                      : isVisible
                      ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.7s ease'
                      : undefined,
                  transitionDelay:
                    isVisible && hoveredIndex === null ? `${280 + idx * 120}ms` : '0ms',
                  transform: isVisible ? cardStyle.transform : undefined,
                  zIndex: cardStyle.zIndex,
                  opacity: isVisible ? cardStyle.opacity : 0,
                }}
              >
                <WatchModelCard model={model} onSelect={handleModelSelect} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
