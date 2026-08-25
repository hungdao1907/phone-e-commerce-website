import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Lazy load Spline — chỉ import khi được yêu cầu
const SplineLazy = lazy(() => import('@splinetool/react-spline'));

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [loadSpline, setLoadSpline] = useState(false);

  useGSAP(() => {
    gsap.from(".hero-text", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: "power3.out",
      delay: 0.1
    });
  }, { scope: containerRef });

  // Trì hoãn Spline tối đa: đợi 2 giây SAU KHI trang render xong,
  // rồi đợi browser idle (requestIdleCallback) mới bắt đầu tải Spline.
  // Mục đích: giữ main thread hoàn toàn trống cho user tương tác ban đầu.
  useEffect(() => {
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setLoadSpline(true), { timeout: 4000 });
      } else {
        setLoadSpline(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden z-30 -mt-[44px] pt-[44px] pointer-events-none">

      {/* Interactive 3D Spline Background — only loads after page is idle */}
      <div className="absolute top-[-10%] right-[-30%] w-full md:w-[75%] h-[120%] z-0 pointer-events-none -rotate-90 origin-center scale-150">
        {loadSpline && (
          <Suspense fallback={null}>
            <SplineLazy
              scene="https://prod.spline.design/nBX5qfesRG7JFJrj/scene.splinecode"
              className="w-full h-full object-cover pointer-events-auto"
            />
          </Suspense>
        )}
      </div>

      <main ref={containerRef} className="w-full max-w-[1200px] mx-auto px-6 md:px-12 relative z-10 pt-10 pb-16 pointer-events-auto">
        <section className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="w-full md:w-3/5 space-y-8">
            <h1 className="hero-text text-5xl md:text-[72px] font-bold tracking-tighter text-[#0a2540] leading-[1.05]">
              Thế giới công nghệ nằm gọn trong <span className="liquid-glass-text">tầm tay bạn.</span>
            </h1>
            <p className="hero-text text-xl md:text-[22px] font-medium text-[#425466] leading-relaxed max-w-[90%]">
              Sở hữu ngay những siêu phẩm công nghệ <span className="text-[#84cc16]">mới nhất, </span> 
              với chính sách bảo hành chính hãng và vô vàn ưu đãi—<span className="text-[#84cc16]">trải nghiệm mua sắm tuyệt vời chưa từng có.</span>
            </p>
            <div className="hero-text flex items-center space-x-4 pt-2">
              <button 
                className="px-8 py-4 group rounded-full font-bold transition-all duration-300 flex items-center bg-[#22c55e] hover:bg-[#0a2540] text-white shadow-lg shadow-green-500/30"
              >
                Mua sắm ngay <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 text-[#0a2540] font-medium hover:text-[#22c55e] transition-colors flex items-center">
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

