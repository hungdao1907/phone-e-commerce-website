import React, { useState, useEffect } from 'react';
import {
  Ultra3HeroSection,
  Ultra3DesignDisplaySection,
  Ultra3TrainingGPSSection,
  Ultra3OceanDepthSection,
  Ultra3HealthSafetyConnectivitySection,
  Ultra3BatteryCTASection,
} from './sections';
import { Ultra3SpecsModal } from './components/Ultra3SpecsModal';
import '../watch.css';

export function WatchUltra3Page() {
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Apple Watch Ultra 3 - Xa hơn. Cao hơn. Sâu hơn. | Apple Store';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="watch-ultra3-page w-full min-h-screen bg-[#060608] text-white">
      {/* Main 6 Sections Flow */}
      <main className="relative z-10 w-full">
        {/* 01. HERO: Xa hơn. Cao hơn. Sâu hơn. (Built for the Extreme) */}
        <Ultra3HeroSection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 02. TITANIUM DESIGN & ULTRA DISPLAY: Một công cụ thực thụ. Được chế tác bằng titan. */}
        <Ultra3DesignDisplaySection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 03. PRECISION TRAINING & DUAL-FREQUENCY GPS: Tập luyện nghiêm túc. Dữ liệu cũng vậy. */}
        <Ultra3TrainingGPSSection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 04. OCEAN, DEPTH & EXPLORATION: Không chỉ chịu nước. Được sinh ra để xuống sâu. */}
        <Ultra3OceanDepthSection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 05. HEALTH, SAFETY & CONNECTIVITY: Đi xa hơn. Nhưng không đơn độc. */}
        <Ultra3HealthSafetyConnectivitySection onOpenSpecs={() => setIsSpecsOpen(true)} />

        {/* 06. ENDURANCE BATTERY & FINAL CTA: 42 giờ. Và câu chuyện vẫn chưa kết thúc. */}
        <Ultra3BatteryCTASection onOpenSpecs={() => setIsSpecsOpen(true)} />
      </main>

      {/* Technical Specifications Modal */}
      <Ultra3SpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />
    </div>
  );
}

export default WatchUltra3Page;
