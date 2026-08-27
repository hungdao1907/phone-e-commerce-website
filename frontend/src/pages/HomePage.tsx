import { CategoryShowcaseSection } from '../components/sections/CategoryShowcaseSection';
import { EcosystemExperienceSection } from '../components/sections/EcosystemExperienceSection';
import { FeaturedProductsSection } from '../components/sections/FeaturedProductsSection';
import { HeroCinematicTransition } from '../components/sections/HeroCinematicTransition';
import { WaveGallery } from '../components/sections/WaveGallery';
import { TrustBenefitsSection } from '../components/sections/TrustBenefitsSection';
import { FinalCTASection } from '../components/sections/FinalCTASection';

export function HomePage() {
  return (
    <div className="bg-white min-h-screen font-sans text-[#1d1d1f]">
      <main className="relative z-10 bg-white">
        {/* 1–2. Hero và phim thương hiệu chuyển cảnh chồng lớp theo native scroll */}
        <HeroCinematicTransition />

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
