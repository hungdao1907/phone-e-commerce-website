import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import { ShiningText } from '@/components/ui/shining-text';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function WatchLogoTransitionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const getLogoScale = () => Math.max(32, Math.min(58, window.innerWidth / 28));

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        // 1. Chữ cuộn xuống để tiếp tục bị đẩy mạnh xuống dưới và biến mất ngay khi bắt đầu cuộn
        timeline
          .to(
            hintRef.current,
            {
              autoAlpha: 0,
              y: 75,
              duration: 0.15,
              ease: 'power2.in',
            },
            0,
          )
          // 2. Tiêu đề phía trên lùi nhẹ lên trên và biến mất
          .to(
            headerRef.current,
            {
              autoAlpha: 0,
              y: -35,
              duration: 0.16,
              ease: 'power2.in',
            },
            0,
          )
          // 3. Quả táo lớn dần theo quá trình cuộn, phóng đại bao trọn toàn bộ màn hình
          .to(
            logoRef.current,
            {
              scale: getLogoScale,
              duration: 0.88,
              ease: 'power2.in',
              transformOrigin: '50% 55%',
            },
            0.02,
          )
          // 4. Quả táo hòa tan dần vào nền trắng khi đạt cực đại, chuyển tiếp mượt sang WatchHealthSection
          .to(
            logoRef.current,
            {
              autoAlpha: 0,
              duration: 0.22,
              ease: 'power2.out',
            },
            0.78,
          );
      });

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="watch-logo-transition relative w-full h-[250vh] bg-white select-none"
      aria-labelledby="watch-logo-transition-headline"
    >
      <div className="watch-logo-transition__stage sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-white">
        {/* Overhead Brand & Ecosystem Title */}
        <div
          ref={headerRef}
          className="watch-logo-transition__header"
        >
          <h2
            id="watch-logo-transition-headline"
            className="watch-logo-transition__headline"
          >
            Trái tim của hệ sinh thái Apple.
          </h2>
          <p className="watch-logo-transition__subheadline">
            Nơi mọi thiết bị Apple hội tụ và cộng hưởng sức mạnh diệu kỳ,
            <br className="hidden sm:inline" />
            đồng điệu cùng từng nhịp sống của bạn.
          </p>
        </div>

        {/* Central Scaling Retail Logo */}
        <div className="watch-logo-transition__logo-wrap relative flex items-center justify-center w-full h-full pointer-events-none" aria-hidden="true">
          <img
            ref={logoRef}
            src="/images/watch/apple-logo-retail.png"
            alt="Apple Retail Logo"
            width={2880}
            height={1612}
            decoding="async"
            className="watch-logo-transition__logo max-w-[240px] sm:max-w-[300px] md:max-w-[360px] w-auto h-auto object-contain select-none pointer-events-none will-change-transform"
          />
        </div>

        {/* Scroll Hint with Shining Text */}
        <div ref={hintRef} className="watch-logo-transition__hint" aria-hidden="true">
          <ShiningText
            text="CUỘN XUỐNG ĐỂ TIẾP TỤC"
            baseColor="#9ca3af"
            shineColor="#111827"
            duration={2.6}
            className="text-[11px] sm:text-xs font-semibold tracking-[0.24em] uppercase font-['SF_Pro_Text',-apple-system,BlinkMacSystemFont,sans-serif]"
          />
          <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] animate-bounce" />
        </div>
      </div>
    </section>
  );
}
