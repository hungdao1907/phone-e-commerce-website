import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const VideoProSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textTitleRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const textDescRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Scroll timeline for the entire section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Smooth scrub
      }
    });

    // 1. Initially, mediaContainer is scaled up (e.g. 5x) so the frame's cutout fills the screen.
    // Text title fades out and moves up.
    tl.to(textTitleRef.current, {
      opacity: 0,
      y: -100,
      duration: 1,
      ease: 'power1.inOut'
    }, 0);

    // 2. Scale down the entire media container
    // This makes the frame edges appear as if they are wrapping the video
    tl.fromTo(mediaContainerRef.current, {
      scale: 5,
    }, {
      scale: 1,
      duration: 7.0,
      ease: 'power2.inOut' // Smooth ease for zooming
    }, 0.7); // Starts when the text is mostly faded

    // 3. Bring up the description text below (no fade, just slide up near the end)
    tl.fromTo(textDescRef.current, {
      y: "50vh" // Start completely off-screen below
    }, {
      y: 0,
      duration: 2.0,
      ease: 'power2.out'
    }, 7.2); // Starts near the end of the scale-down animation (0.7 + 7.0 = 7.7)

    // 4. Slightly push the media frame up to make more room for the text at the bottom
    tl.to(mediaContainerRef.current, {
      y: -60, // Push up by 60px
      duration: 2.0,
      ease: 'power2.out'
    }, 7.2);

  }, { scope: containerRef });

  return (
    // Make the section huge (400vh) so we have plenty of scroll distance to animate
    <section ref={containerRef} className="relative w-full h-[400vh] bg-black">

      {/* Sticky container that stays pinned on screen while scrolling */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">

        {/* Large Title Text (initially visible) */}
        <div
          ref={textTitleRef}
          className="absolute z-30 flex flex-col items-center justify-center pointer-events-none text-center w-full"
        >
          <p className="text-[#a1a1a6] text-[21px] md:text-[24px] font-semibold mb-2">Video Pro</p>
          <h2 className="text-white text-[48px] md:text-[80px] font-bold leading-tight tracking-tight max-w-[800px]">
            Cứ như là dân làm phim chuyên nghiệp.
          </h2>
        </div>

        {/* Media Container (Video + Frame) */}
        {/* We start at scale 5 to zoom way into the center of the video */}
        <div
          ref={mediaContainerRef}
          className="relative w-full max-w-[1000px] aspect-[19.5/9] flex items-center justify-center"
        >
          {/* Video element - exactly matching the cutout of the horizontal iPhone */}
          {/* We use padding or absolute positioning to fit it inside the PNG transparent hole */}
          <div className="absolute inset-0 z-10 flex items-center justify-center px-[3%] py-[3.5%]">
            <video
              src="/videos/videozoom.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-[3rem] md:rounded-[4rem]"
            />
          </div>

          {/* iPhone Frame PNG */}
          {/* We assume frameVid.png is a horizontal device frame with a transparent center */}
          <img
            src="/images/frameVid.png"
            alt="iPhone Frame Horizontal"
            className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
          />
        </div>

        {/* Description Text (initially hidden below) */}
        <div
          ref={textDescRef}
          className="absolute bottom-[2%] md:bottom-[4%] w-full z-30 flex justify-center px-4 pointer-events-none"
        >
          <p className="text-[#a1a1a6] text-[17px] md:text-[21px] font-semibold text-center max-w-[700px] leading-relaxed">
            Từ quay phim gia đình đến siêu phẩm đoạt giải thưởng, iPhone 17 Pro đáp ứng được mọi thử thách. Với <span className="text-white">nhiều tính năng video chuyên nghiệp hơn bao giờ hết</span>, như chống rung quang học tiên tiến thế hệ mới và tính năng Audio Mix, bạn có thể thoả sức sáng tạo.
          </p>
        </div>

      </div>
    </section>
  );
};
