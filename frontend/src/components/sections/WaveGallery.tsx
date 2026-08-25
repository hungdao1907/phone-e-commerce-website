import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);
const waveImages = [
  'https://images.unsplash.com/photo-1591337676887-a217a6c9ba82?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1628202926206-c63a34b1618f?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=900&fit=crop',
];

export function WaveGallery() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const waveWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Chữ từ từ bự lên và rõ ra dựa theo khoảng cuộn chuột
    gsap.from(textRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%", // Bắt đầu khi thẻ section vào màn hình 85%
        end: "top 40%",   // Kết thúc hiệu ứng khi cuộn tới 40%
        scrub: 1,         // Kéo chuột quán tính mượt 1s
      },
      y: 80,
      opacity: 0,
      scale: 0.9,
    });

    // 2. Dãy ảnh trượt nhẹ từ phải sang trái khi cuộn
    gsap.from(waveWrapRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5, // Cuộn càng nhiều, hình càng đi qua trái
      },
      x: 150,
      opacity: 0.5,
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="w-full bg-[#0f4a32] py-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 mb-10">
        <h2 ref={textRef} className="text-3xl md:text-4xl font-semibold text-white leading-snug tracking-tight">
          Khám phá bộ sưu tập. <span className="text-emerald-300/70">Trải nghiệm công nghệ đỉnh cao qua từng sản phẩm.</span>
        </h2>
      </div>
      <div ref={waveWrapRef} className="wave-wrapper">
        <div className="wave-items">
          {waveImages.map((url, idx) => (
            <div
              key={idx}
              className="wave-item"
              tabIndex={0}
            >
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
