import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const AllInOneSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const midPhoneRef = useRef<HTMLDivElement>(null);
  const leftPhoneRef = useRef<HTMLDivElement>(null);
  const rightPhoneRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // We create a timeline that scrubs as you scroll through this 200vh section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 90%',
        end: 'bottom bottom',
        scrub: 1, // Smooth scrub
      }
    });

    // Middle iPhone shrinks
    // Removed ease: 'power1.out' and used ease: 'none' so the zoom is 100% tied to the mouse wheel!
    tl.fromTo(midPhoneRef.current, {
      scale: 1.0625,
      transformOrigin: 'bottom center',
    }, {
      scale: 1,
      ease: 'none'
    }, 0);

    // Left iPhone tilts from the outside (-12 degrees) and pulls in
    tl.fromTo(leftPhoneRef.current, {
      rotation: -2,
      x: "-2vw", // Starts further out
      transformOrigin: 'bottom right', // Pivots from the inner bottom corner for a nice closing effect
    }, {
      rotation: 0,
      x: 0,
      ease: 'none'
    }, 0);

    // Right iPhone tilts from the outside (12 degrees) and pulls in
    tl.fromTo(rightPhoneRef.current, {
      rotation: 2,
      x: "2vw", // Starts further out
      transformOrigin: 'bottom left', // Pivots from the inner bottom corner
    }, {
      rotation: 0,
      x: 0,
      ease: 'none'
    }, 0);

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full bg-black text-white py-[10vh]">
      {/* Sticky pinned container: allows scrolling to scrub the animation without losing the layout */}
      <div className="w-full flex flex-col items-center px-4">

        {/* Top Text Block */}
        <div className="text-center z-30 mb-[8vh] w-full">
          <p className="text-[#f56300] text-[19px] md:text-[21px] font-semibold mb-3">
            Tất cả trong một nhà
          </p>
          <h2 className="text-[32px] md:text-[56px] lg:text-[64px] font-bold leading-tight tracking-tight max-w-[800px] mx-auto">
            Tất cả thứ cần thiết.<br />Tất cả trên iPhone.
          </h2>
        </div>

        {/* 3 iPhones Layout */}
        <div className="relative w-full flex justify-center items-center pointer-events-none">

          {/* Left iPhone */}
          <div ref={leftPhoneRef} className="h-[45vh] md:h-[80vh] z-10 -mr-[15%] md:-mr-[0%]">
            <img
              src="/images/leftip.png"
              alt="iPhone 17 Pro Left"
              className="h-full w-auto object-contain drop-shadow-2xl"
            />
          </div>

          {/* Middle iPhone */}
          <div ref={midPhoneRef} className="h-[45vh] md:h-[80vh] z-20">
            <img
              src="/images/midip.png"
              alt="iPhone 17 Pro Center"
              className="h-full w-auto object-contain drop-shadow-2xl"
            />
          </div>

          {/* Right iPhone */}
          <div ref={rightPhoneRef} className="h-[45vh] md:h-[80vh] z-10 -ml-[15%] md:-ml-[0%]">
            <img
              src="/images/rightip.png"
              alt="iPhone 17 Pro Right"
              className="h-full w-auto object-contain drop-shadow-2xl"
            />
          </div>

        </div>

        {/* Bottom Description Text */}
        <div className="text-center mt-[8vh] z-30 w-full px-4">
          <p className="text-[#86868b] text-[16px] md:text-[21px] max-w-[900px] mx-auto font-medium leading-relaxed">
            Các phiên bản iPhone mới nhất trang bị nhiều tính năng đột phá. Các công cụ Apple Intelligence hữu ích như trí thông minh thị giác và Công Cụ Viết giúp mọi việc hàng ngày của bạn trở nên dễ dàng hơn. Kết nối nhanh và an toàn với <span className="font-semibold text-white">Wi-Fi 7</span>, <span className="font-semibold text-white">Bluetooth 6</span>, kết nối <span className="font-semibold text-white">5G</span> và <span className="font-semibold text-white">eSIM</span>.
          </p>
        </div>

      </div>
    </section>
  );
};
