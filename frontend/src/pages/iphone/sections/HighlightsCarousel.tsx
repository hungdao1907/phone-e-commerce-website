import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* ─────────── DATA ─────────── */
const highlightsSlides = [
  {
    id: 1,
    textLists: [
      'Thiết kế nguyên khối nhôm rèn nhiệt',
      'cho năng lực pro vượt trội.',
    ],
    video: '/videos/ipcase1.mp4',
  },
  {
    id: 2,
    textLists: [
      'Mặt kính Ceramic Shield 2',
      'giúp tăng khả năng chống trầy xước',
      'gấp 3 lần so với thế hệ trước.',
    ],
    video: '/videos/shieldip.mp4',
  },
  {
    id: 3,
    textLists: [
      'A19 Pro, tản nhiệt hơi nước',
      'cho hiệu năng thần tốc.',
      'Thời lượng pin đột phá.',
    ],
    video: '/videos/a19pro.mp4',
  },
  {
    id: 4,
    textLists: [
      'Hệ thống camera pro.',
      'Chụp cận hơn nữa với thu phóng',
      'chất lượng quang học 8x',
      'và camera sau 48MP.',
    ],
    video: '/videos/cam.mp4',
  },
  {
    id: 5,
    textLists: [
      'Apple Intelligence.',
      'Các tính năng hữu ích và dễ dùng,',
      'từ tạo hình ảnh đến Dịch Trực Tiếp.',
    ],
    video: '/videos/appleAI.mp4',
  },
];

/* ─────────── SVG ICONS ─────────── */
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" className="w-6 h-6 fill-white">
    <path d="m23.7555 36.6237c.4478 0 .8598-.1343 1.4241-.4568l10.9178-6.3322c.8598-.5016 1.3614-1.021 1.3614-1.8361 0-.8061-.5016-1.3255-1.3614-1.8271l-10.9178-6.3322c-.5643-.3314-.9762-.4657-1.4241-.4657-.9315 0-1.7555.7165-1.7555 1.9435v13.3629c0 1.227.824 1.9435 1.7555 1.9435z" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" className="w-6 h-6 fill-white">
    <path d="m21.7334 36.67h2.5342c1.1483 0 1.7324-.5796 1.7324-1.7193v-13.9015c0-1.12-.5841-1.6898-1.7324-1.7193h-2.5342c-1.1483 0-1.7324.5698-1.7324 1.7193v13.9015c-.0297 1.1396.5544 1.7193 1.7324 1.7193zm9.9992 0h2.5347c1.1485 0 1.7327-.5796 1.7327-1.7193v-13.9015c0-1.12-.5842-1.7193-1.7327-1.7193h-2.5347c-1.1485 0-1.7327.5698-1.7327 1.7193v13.9015c0 1.1396.5545 1.7193 1.7327 1.7193z" />
  </svg>
);

const ReplayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" className="w-6 h-6 fill-white">
    <path d="m36.2448 26.6447c-1.1073 0-2.0052.8978-2.0052 2.0052 0 3.4405-2.7992 6.2397-6.2397 6.2397s-6.2397-2.7992-6.2397-6.2397 2.7992-6.2397 6.2397-6.2397c.0283 0 .0546-.0072.0825-.0083l-1.2839 1.2841c-.7833.7828-.7833 2.0526 0 2.8354.3911.3916.9047.5874 1.4177.5874s1.0266-.1958 1.4177-.5874l4.4406-4.4406c.7833-.7828.7833-2.0526 0-2.8354l-4.657-4.657c-.7823-.7833-2.0531-.7833-2.8354 0-.7833.7828-.7833 2.0526 0 2.8354l.9973.9974c-5.4561.223-9.8295 4.7189-9.8295 10.2287 0 5.6517 4.5983 10.25 10.25 10.25s10.25-4.5983 10.25-10.25c0-1.1073-.8978-2.0052-2.0052-2.0052z" />
  </svg>
);

/* ─────────── COMPONENT ─────────── */
export function HighlightsCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<(HTMLVideoElement | null)[]>([]);
  const videoSpanRef = useRef<(HTMLSpanElement | null)[]>([]);
  const videoDivRef = useRef<(HTMLSpanElement | null)[]>([]);
  const textRef = useRef<(HTMLDivElement | null)[]>([]);
  const controlsRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<(() => void) | null>(null);

  const [videoId, setVideoId] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLastVideo, setIsLastVideo] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);

  /* ── Header GSAP animations ── */
  useGSAP(() => {
    gsap.to('.highlights-title', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
    });
    gsap.to('.highlights-link', {
      opacity: 1,
      y: 0,
      stagger: 0.25,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
    });

    // ScrollTrigger: tự động phát video đầu tiên khi cuộn vào tầm nhìn
    ScrollTrigger.create({
      trigger: sliderRef.current,
      start: 'top 85%',
      onEnter: () => {
        if (!hasStarted) {
          setHasStarted(true);
          setIsPlaying(true);
        }
      },
    });

    // Controls visibility: show/hide based on section visibility
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => setControlsVisible(true),
      onLeaveBack: () => setControlsVisible(false),
    });
  }, { scope: sectionRef });

  /* ── Play current video when isPlaying or videoId changes ── */
  useEffect(() => {
    if (!hasStarted) return;

    // Pause all videos first
    videoRef.current.forEach((v, i) => {
      if (v && i !== videoId) {
        v.pause();
      }
    });

    const currentVid = videoRef.current[videoId];
    if (!currentVid) return;

    if (isPlaying) {
      currentVid.play().catch(() => { });
    } else {
      currentVid.pause();
    }
  }, [isPlaying, videoId, hasStarted]);

  /* ── Reset video time when switching ── */
  useEffect(() => {
    const currentVid = videoRef.current[videoId];
    if (currentVid) {
      currentVid.currentTime = 0;
    }
  }, [videoId]);

  /* ── Slide transition animation ── */
  useEffect(() => {
    if (!sliderRef.current) return;

    // Calculate translation in exact pixels to avoid GSAP calc() issues
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1200;
    const itemWidthVW = isMobile ? 85 : 86;
    const itemWidthPx = (window.innerWidth * itemWidthVW) / 100;
    const gapPx = 24; // 1.5rem (gap-6)
    const targetX = -((itemWidthPx + gapPx) * videoId);

    // Animate slider and link dot widths to slide position for a perfect caterpillar ripple
    const maxWidthPx = isMobile ? 36 : 48;
    const minWidthPx = 8;
    
    gsap.to(sliderRef.current, {
      x: targetX,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: function () {
        if (!sliderRef.current) return;
        const currentX = gsap.getProperty(sliderRef.current, 'x') as number;
        const currentIndexFloat = Math.abs(currentX / (itemWidthPx + gapPx));

        videoDivRef.current.forEach((dot, i) => {
          if (!dot) return;
          const dist = Math.abs(currentIndexFloat - i);
          if (dist >= 1) {
            dot.style.width = `${minWidthPx}px`;
          } else {
            // Smooth easeInOut curve for organic ripple (guarantees constant total width)
            const progress = 1 - dist;
            const easeProgress = (1 - Math.cos(Math.PI * progress)) / 2;
            const w = minWidthPx + (maxWidthPx - minWidthPx) * easeProgress;
            dot.style.width = `${w}px`;
          }
        });
      },
      onComplete: function () {
        // Guarantee perfect final widths
        videoDivRef.current.forEach((dot, i) => {
          if (!dot) return;
          dot.style.width = i === videoId ? `${maxWidthPx}px` : `${minWidthPx}px`;
        });
      },
    });

    // Text animation: Handle fading for all slides (useful when jumping)
    textRef.current.forEach((ref, index) => {
      if (!ref) return;
      if (index === videoId) {
        gsap.fromTo(
          ref.children,
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.5 }
        );
      } else {
        gsap.to(ref.children, { x: -60, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power2.in' });
      }
    });

    // Dim inactive videos, light up active video
    videoRef.current.forEach((vid, index) => {
      if (!vid) return;
      if (index === videoId) {
        gsap.to(vid, { opacity: 1, duration: 1.5, ease: 'power2.inOut' });
      } else {
        gsap.to(vid, { opacity: 0.4, duration: 1.5, ease: 'power2.inOut' });
      }
    });
  }, [videoId]);

  /* ── Progress bar animation (synced to video currentTime via gsap.ticker) ── */
  useEffect(() => {
    // Clean up previous ticker
    if (tickerRef.current) {
      gsap.ticker.remove(tickerRef.current);
      tickerRef.current = null;
    }

    const span = videoSpanRef.current[videoId];
    const dot = videoDivRef.current[videoId];
    const vid = videoRef.current[videoId];

    if (!span || !dot || !vid || !hasStarted) return;

    // Reset all other progress spans
    videoSpanRef.current.forEach((s, i) => {
      if (s && i !== videoId) {
        gsap.to(s, { width: '0%', backgroundColor: '#afafaf', duration: 0.1 });
      }
    });

    const updateProgress = () => {
      if (!vid.duration || vid.duration === Infinity) return;
      const progress = (vid.currentTime / vid.duration) * 100;
      gsap.set(span, {
        width: `${progress}%`,
        backgroundColor: 'white',
      });
    };

    if (isPlaying) {
      tickerRef.current = updateProgress;
      gsap.ticker.add(updateProgress);
    }

    return () => {
      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [videoId, isPlaying, hasStarted]);

  /* ── Handle video end ── */
  const handleVideoEnd = useCallback((index: number) => {
    // Collapse current dot
    const dot = videoDivRef.current[index];
    if (dot) gsap.to(dot, { width: '12px', duration: 0.4 });
    const span = videoSpanRef.current[index];
    if (span) gsap.to(span, { width: '100%', backgroundColor: '#afafaf' });

    if (index < highlightsSlides.length - 1) {
      // Go to next slide
      setVideoId(index + 1);
    } else {
      // Last video ended
      setIsLastVideo(true);
      setIsPlaying(false);
    }
  }, []);

  /* ── Handle Jump to specific video ── */
  const handleVideoJump = useCallback((index: number) => {
    if (index === videoId) return;

    setVideoId(index);
    setIsLastVideo(false);
    setIsPlaying(true);

    // Reset the target video to the beginning
    const targetVid = videoRef.current[index];
    if (targetVid) {
      targetVid.currentTime = 0;
    }
  }, [videoId]);

  /* ── Handle play/pause/replay ── */
  const handleControl = useCallback(() => {
    if (isLastVideo) {
      // Replay: reset all
      setVideoId(0);
      setIsLastVideo(false);
      setIsPlaying(true);
      // Reset all videos to beginning
      videoRef.current.forEach((v) => {
        if (v) {
          v.currentTime = 0;
        }
      });
    } else if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isLastVideo, isPlaying]);

  return (
    <section id="highlights" ref={sectionRef} className="bg-[#1d1d1f] pt-20 overflow-clip relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <h2
          className="highlights-title text-[#f5f5f7] text-3xl sm:text-5xl lg:text-[56px] font-semibold opacity-0 translate-y-10"
          style={{ letterSpacing: '-0.015em' }}
        >
          Các điểm nổi bật.
        </h2>
        <div className="flex flex-wrap items-end gap-5">
          <a
            href="#"
            className="highlights-link opacity-0 translate-y-5 text-[#2997ff] hover:underline text-lg font-medium flex items-center gap-2 transition-colors"
          >
            Xem phim
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 8l5 4-5 4" fill="currentColor" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Video Carousel + Sticky Overlay ── */}
      <div className="relative pb-[124px]">
        {/* Video Carousel */}
        <div className="w-full relative mt-10">
          <div ref={sliderRef} className="flex gap-6 pl-[7.5vw] md:pl-[7vw]" style={{ willChange: 'transform' }}>
            {highlightsSlides.map((list, i) => (
              <div
                key={list.id}
                className="w-[85vw] md:w-[86vw] flex-shrink-0 relative rounded-3xl overflow-hidden bg-black"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Video */}
                <video
                  playsInline
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ opacity: i === 0 ? 1 : 0.4 }}
                  preload={i === 0 ? 'auto' : 'metadata'}
                  muted
                  ref={(el) => { videoRef.current[i] = el; }}
                  onEnded={() => handleVideoEnd(i)}
                >
                  <source src={list.video} />
                </video>

                {/* Text overlay */}
                <div
                  className="absolute top-8 sm:top-12 left-6 sm:left-12 flex flex-col items-start z-10"
                  ref={(el) => { textRef.current[i] = el; }}
                >
                  {list.textLists.map((text, j) => (
                    <p
                      key={j}
                      className="text-lg sm:text-2xl md:text-3xl font-semibold text-[#f5f5f7] text-left"
                      style={{ lineHeight: 1.3, opacity: i === 0 ? 1 : 0 }}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Controls Overlay */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            ref={controlsRef}
            className="sticky top-[calc(100vh-100px)] w-full flex items-center justify-center gap-4 transition-opacity duration-500 pointer-events-auto"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          >
            {/* Dot nav */}
            <div className="flex items-center py-5 px-7 bg-[#42424570] backdrop-blur-md rounded-full gap-4">
              {highlightsSlides.map((_, i) => (
                <span
                  key={i}
                  className="h-2 bg-[#afafaf] rounded-full relative cursor-pointer overflow-hidden"
                  ref={(el) => { videoDivRef.current[i] = el; }}
                  style={{ width: i === 0 ? '48px' : '8px' }}
                  onClick={() => handleVideoJump(i)}
                >
                  <span
                    className="absolute top-0 left-0 h-full rounded-full"
                    ref={(el) => { videoSpanRef.current[i] = el; }}
                    style={{ width: '0%', backgroundColor: '#afafaf' }}
                  />
                </span>
              ))}
            </div>

            {/* Play / Pause / Replay button */}
            <button
              className="w-11 h-11 flex items-center justify-center bg-[#42424570] backdrop-blur-md rounded-full cursor-pointer hover:bg-[#52525270] transition-colors"
              onClick={handleControl}
            >
              {isLastVideo ? (
                <ReplayIcon />
              ) : !isPlaying ? (
                <PlayIcon />
              ) : (
                <PauseIcon />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Background Gap ── */}
      <div className="h-[76px] w-full bg-[#1d1d1f]"></div>
    </section>
  );
};

export default HighlightsCarousel;
