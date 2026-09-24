import { useState } from 'react';
import { FirstVisitHelloIntro, shouldShowIntro } from '@/components/ui/FirstVisitHelloIntro';
import { CategoryShowcaseSection } from './sections/CategoryShowcaseSection';
import { EcosystemExperienceSection } from './sections/EcosystemExperienceSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { HeroCinematicTransition } from './sections/HeroCinematicTransition';
import { WaveGallery } from './sections/WaveGallery';
import { TrustBenefitsSection } from './sections/TrustBenefitsSection';
import { FinalCTASection } from './sections/FinalCTASection';
import '@/css/home.css';

export function HomePage() {
  const [isIntroPlaying, setIsIntroPlaying] = useState(shouldShowIntro);

  return (
    <div className="bg-white min-h-screen font-sans text-[#1d1d1f]">
      {/* Màn hình chào mừng phong cách Apple khi lần đầu ghé thăm */}
      <FirstVisitHelloIntro onFadeOutStart={() => setIsIntroPlaying(false)} />

      <main className="relative z-10 bg-white">
        {/* 1–2. Hero và phim thương hiệu chuyển cảnh chồng lớp theo native scroll */}
        <HeroCinematicTransition isIntroPlaying={isIntroPlaying} />

        {/* 3. Sản phẩm nổi bật */}
        <FeaturedProductsSection />

        {/* 4. Danh mục sản phẩm công nghệ (Expanding Cards) */}
        <CategoryShowcaseSection />

        {/* 5. Trải nghiệm hệ sinh thái kết nối (Ecosystem Experience) */}
        <EcosystemExperienceSection />

        {/* 6. Bộ sưu tập ảnh 3D Wave */}
        <WaveGallery />

        {/* 7. Trải nghiệm mua sắm & Lợi ích an tâm */}
        <TrustBenefitsSection />

        {/* 8. Hướng dẫn chọn thiết bị & Kêu gọi hành động cuối trang */}
        <FinalCTASection />
      </main>
    </div>
  );
}
