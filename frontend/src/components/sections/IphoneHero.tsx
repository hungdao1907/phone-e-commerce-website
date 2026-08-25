import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function IphoneHero() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Fade in CTA buttons from the bottom
    gsap.to(".hero-cta", {
      y: -40,
      opacity: 1,
      delay: 4, // Đợi video chạy xong phần bụi
      stagger: 0.15,
      duration: 1,
      ease: "power2.out",
    });
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="w-full h-[calc(100vh-1px)] bg-black relative flex flex-col justify-between overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex-1 flex flex-col items-center justify-end w-full relative z-10 pt-20">
        
        <div className="w-full flex justify-center items-end relative h-full">
          {/* Video chỉ chạy 1 lần và tự động đóng băng ở frame cuối cùng sắc nét nhất */}
          <video
            className="w-full md:w-[85%] lg:w-[75%] object-contain pointer-events-none z-0"
            style={{ maxHeight: '100%', objectPosition: 'bottom' }}
            autoPlay
            muted
            playsInline
          >
            <source src="/videos/hero17prm.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pb-12 z-20">
        <button
          onClick={() => {
            const modelsSection = document.getElementById('models');
            if (modelsSection) modelsSection.scrollIntoView({ behavior: 'smooth' });
          }}
          className="hero-cta cursor-pointer opacity-0 translate-y-20 bg-white text-black font-semibold text-[15px] px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors"
        >
          Chiêm ngưỡng
        </button>
      </div>
    </section>
  );
}
