import React, { useState, useEffect, useRef } from 'react';

export function WatchHeroSection() {
  const [showActions, setShowActions] = useState<boolean>(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInteractionTimer = () => {
    setShowActions(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowActions(false);
    }, 2800);
  };

  const handleMouseMove = () => {
    resetInteractionTimer();
  };

  const handleMouseLeave = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setShowActions(false);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleScrollToModels = () => {
    const el = document.getElementById('watch-models');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToHealth = () => {
    const el = document.getElementById('watch-health');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="watch-hero-video-section relative w-full h-[100dvh] min-h-[640px] overflow-hidden select-none bg-black flex items-end"
    >
      {/* 1. Full-Bleed Video Background (with PiP/browser overlay disabled) */}
      <video
        src="/videos/watch/apple-watch-hero.mp4"
        poster="/images/watch/watch-hero.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="watch-hero-video absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 2. Readability Gradient Overlay */}
      <div className="watch-hero-video-overlay absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-10" />

      {/* 3. Bottom-Left Minimal Campaign Content */}
      <div className="relative z-20 w-full max-w-[620px] p-6 sm:p-10 lg:p-14 flex flex-col items-start text-left">
        {/* Eyebrow */}
        <div className="watch-hero-entry-1 text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-white/90 mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
          APPLE WATCH
        </div>

        {/* Scaled-down Compact Headline */}
        <h1 className="watch-hero-entry-2 text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.12] text-white mb-4 sm:mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          Đeo công nghệ. <br />
          Sống theo cách của bạn.
        </h1>

        {/* Action Group: Automatically hides when idle and smoothly reveals when mouse moves/interacts */}
        <div
          className={`watch-hero-entry-3 flex items-center gap-3 sm:gap-3.5 transition-all duration-500 ease-out ${
            showActions
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleScrollToModels}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm bg-white text-black hover:bg-neutral-200 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            Khám phá các dòng
          </button>
          <button
            type="button"
            onClick={handleScrollToHealth}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm bg-black/45 hover:bg-black/70 text-white border border-white/45 hover:border-white/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            Tính năng sức khỏe
          </button>
        </div>
      </div>
    </section>
  );
}
