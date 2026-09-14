import React, { useState, useEffect } from 'react';
import {
  SE3HeroSection,
  SE3DesignSection,
  SE3HealthSection,
  SE3FitnessIntelligenceSection,
  SE3BatteryConnectivitySafetySection,
  SE3FinalCTASection,
} from './sections';
import { SE3SpecsModal } from '@/components/watch/SE3SpecsModal';
import '@/css/watch-se3.css';

export function WatchSE3Page() {
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Apple Watch SE 3 - Một nhịp mới. Một lối sống mới. | Apple Store';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="watch-se3-page w-full min-h-screen">
      <main className="relative z-10">
        {/* 1. HERO: Một nhịp mới. Một lối sống mới. */}
        <SE3HeroSection />

        {/* 2. DESIGN & DISPLAY: Đẹp trong mọi chi tiết. Rõ nét mọi khoảnh khắc. */}
        <SE3DesignSection />

        {/* 3. HEALTH & RECOVERY: Hiểu cơ thể bạn. Sống khỏe mỗi ngày. */}
        <SE3HealthSection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 4. FITNESS & EVERYDAY INTELLIGENCE: Năng động hơn. Thông minh hơn mỗi ngày. */}
        <SE3FitnessIntelligenceSection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 5. BATTERY, CONNECTIVITY & SAFETY: Luôn sẵn sàng. Luôn bên bạn. */}
        <SE3BatteryConnectivitySafetySection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 6. FINAL CTA: Bắt đầu nhịp mới. */}
        <SE3FinalCTASection onOpenSpecs={() => setIsSpecsOpen(true)} />
      </main>

      {/* Detailed Specifications Modal */}
      <SE3SpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />
    </div>
  );
}
