import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { FirstVisitHelloIntro, shouldShowIntro } from '@/components/ui/FirstVisitHelloIntro';
import {
  HeroCinematicTransition,
  FeaturedProductsSection,
  FinalCTASection,
  EcosystemExperienceSection,
  WaveGallery,
  TrustBenefitsSection,
} from '@/components/home/sections';
import { readHomeSectionReturn } from '@/lib/homeSectionHistory';
import '@/css/home.css';

export function HomePage() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredLocationKey = useRef<string | null>(null);
  const [isIntroPlaying, setIsIntroPlaying] = useState(shouldShowIntro);

  useEffect(() => {
    if (navigationType !== 'POP' || restoredLocationKey.current === location.key) return;

    const marker = readHomeSectionReturn();
    if (!marker || marker.homeLocationKey !== location.key) return;

    restoredLocationKey.current = location.key;
    let cancelled = false;
    let attempts = 0;
    let frameId = 0;

    const restoreSection = () => {
      if (cancelled) return;

      const section = document.getElementById(marker.sectionId);
      if (!section) {
        if (attempts < 30) {
          attempts += 1;
          frameId = window.requestAnimationFrame(restoreSection);
        }
        return;
      }

      section.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    };

    frameId = window.requestAnimationFrame(restoreSection);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [location.key, navigationType]);

  return (
    <div className="home-page bg-white min-h-screen font-sans text-[#1d1d1f]">
      {/* Màn hình chào mừng phong cách Apple khi lần đầu ghé thăm */}
      <FirstVisitHelloIntro onFadeOutStart={() => setIsIntroPlaying(false)} />

      <main className="relative z-10 bg-white">
        {/* 1–2. Hero và phim thương hiệu chuyển cảnh chồng lớp theo native scroll */}
        <HeroCinematicTransition isIntroPlaying={isIntroPlaying} />

        {/* 3. Sản phẩm nổi bật */}
        <FeaturedProductsSection />

        {/* 4. Hướng dẫn chọn thiết bị & Kêu gọi hành động */}
        <FinalCTASection />

        {/* 5. Trải nghiệm hệ sinh thái kết nối (Ecosystem Experience) */}
        <EcosystemExperienceSection />

        {/* 6. Bộ sưu tập ảnh 3D Wave */}
        <WaveGallery />

        {/* 7. Trải nghiệm mua sắm & Lợi ích an tâm */}
        <TrustBenefitsSection />
      </main>
    </div>
  );
}
