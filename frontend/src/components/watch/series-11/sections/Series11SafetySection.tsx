import React, { useState, useEffect, useRef } from 'react';
import { SERIES_11_SAFETY_FEATURES } from '../../../../data/watch/series-11/data/series11Data';

export function Series11SafetySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Trigger animation when the section appears in the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Subtle interactive 3D perspective on mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12; // -6 to 6 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Render exact official Apple Safety Vector Icons
  const renderSafetyIcon = (iconType: string) => {
    switch (iconType) {
      case 'sos':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17.5" stroke="#e30000" strokeWidth="2" />
              <text
                x="20"
                y="24.5"
                textAnchor="middle"
                fill="#e30000"
                fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif"
                fontWeight="700"
                fontSize="13"
                letterSpacing="-0.02em"
              >
                SOS
              </text>
            </svg>
          </div>
        );

      case 'fall':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17.5" stroke="#e30000" strokeWidth="2" />
              <circle cx="19.5" cy="14" r="2.2" fill="#e30000" />
              <line x1="20" y1="16.5" x2="22.5" y2="23.5" stroke="#e30000" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="20.5" y1="17.5" x2="24.5" y2="13" stroke="#e30000" strokeWidth="2.2" strokeLinecap="round" />
              <polyline points="19.5,18 16,19.5 16,23.5" stroke="#e30000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22.5,23.5 25.5,21.5 29.5,23" stroke="#e30000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="22.5" y1="23.5" x2="27" y2="28.5" stroke="#e30000" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        );

      case 'crash':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path
                d="M17.8 6.5 C18.7 5 21.3 5 22.2 6.5 L36.2 28.5 C37.1 30 35.8 32 34 32 L6 32 C4.2 32 2.9 30 3.8 28.5 Z"
                stroke="#e30000"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <line x1="20" y1="14" x2="20" y2="22" stroke="#e30000" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="20" cy="26" r="1.3" fill="#e30000" />
            </svg>
          </div>
        );

      case 'checkin':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17.5" stroke="#e30000" strokeWidth="2" />
              <polyline points="13.5,20.5 18,25 26.5,15.5" stroke="#e30000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      case 'backtrack':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="26" cy="11" r="2.8" stroke="#e30000" strokeWidth="2.2" />
              <path
                d="M23.2 11 H17 C13.2 11 10 13.8 10 17.5 C10 21.2 13.2 24 17 24 H23 C26.8 24 30 26.8 30 30.5 C30 34.2 26.8 37 23 37 H17.8"
                stroke="#e30000"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="15" cy="37" r="3.2" fill="#e30000" />
            </svg>
          </div>
        );

      case 'medical':
        return (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17.5" stroke="#e30000" strokeWidth="2" />
              <line x1="20" y1="11" x2="20" y2="29" stroke="#e30000" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="12.2" y1="15.5" x2="27.8" y2="24.5" stroke="#e30000" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="12.2" y1="24.5" x2="27.8" y2="15.5" stroke="#e30000" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section
      ref={sectionRef}
      className="series11-safety-section relative w-full bg-white text-black py-20 sm:py-28 overflow-hidden border-t border-black/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="text-center mb-3">
          <span className="text-sm sm:text-base font-semibold text-[#d70015] tracking-wide uppercase">
            An Toàn
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-black leading-[1.1] mb-6 text-center">
          Đường dây cứu hộ
          <br />
          đích thực.
        </h2>

        {/* Subtitle / Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 font-normal leading-relaxed text-center mb-12 sm:mb-16">
          Một chiếc đồng hồ thông minh được trang bị những tính năng an toàn mang tính đột phá. Series 11 được thiết kế để gọi trợ giúp khi bạn cần nhất, ngay cả khi bạn không thể tiếp cận iPhone của mình.
        </p>

        {/* Center Visual: Two Watches Facing Each Other with Cinematic Entrance & Motion */}
        <div className="flex justify-center items-center my-6 sm:my-10">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative max-w-lg sm:max-w-xl w-full flex justify-center cursor-pointer select-none transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-16 scale-90'
            }`}
            style={{
              perspective: '1200px',
            }}
          >
            {/* Soft Red Safety Pulse Aura in the background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-red-500/10 blur-3xl animate-pulse" />
            </div>

            {/* Floating Container */}
            <div
              className={`relative z-10 w-full flex flex-col items-center justify-center transition-transform duration-300 ease-out ${
                isVisible ? 'series11-safety-float' : ''
              }`}
              style={{
                transform: `rotateX(${mouseOffset.y}deg) rotateY(${mouseOffset.x}deg)`,
              }}
            >
              {/* Watch Pair High-Res 100% Transparent Cutout */}
              <img
                src="/images/watch/watch-safety-duo-transparent.png"
                alt="Tính năng an toàn trên Apple Watch Series 11"
                className="w-full max-w-[520px] h-auto object-contain select-none transition-transform duration-500 hover:scale-[1.03]"
                loading="lazy"
              />

              {/* Soft Ambient Studio Floor Shadow Underneath */}
              <div className="w-3/5 h-6 -mt-3 bg-black/10 blur-xl rounded-full pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mt-14 sm:mt-20 max-w-6xl mx-auto">
          {SERIES_11_SAFETY_FEATURES.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col items-start text-left group transition-all duration-700 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{
                transitionDelay: `${200 + idx * 80}ms`,
              }}
            >
              {/* Icon */}
              <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                {renderSafetyIcon(item.iconType)}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-black mb-2 leading-snug">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-[15px] text-neutral-600 font-normal leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
