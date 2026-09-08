import React, { useEffect } from 'react';
import {
  WatchHeroSection,
  WatchModelsSection,
  WatchLogoTransitionSection,
  WatchHealthSection,
  WatchActivitySection,
  WatchLifestyleSection,
  WatchFacesSection,
  WatchEcosystemSection,
  WatchFinalCTASection,
} from './sections';
import { WatchUltra3Page } from './ultra-3/WatchUltra3Page';
import './watch.css';

export function WatchPage() {
  useEffect(() => {
    document.title = 'Apple Watch - Khám phá các dòng đồng hồ thông minh | Apple Store';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="watch-page w-full min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      <main className="w-full">
        {/* 01. Hero Video Section */}
        <WatchHeroSection />

        {/* 02. Models Overview & Comparison Section */}
        <WatchModelsSection />

        {/* 03. Apple Watch Logo Pinning Transition */}
        <WatchLogoTransitionSection />

        {/* 05. Health & Heart Rate Sensor Suite */}
        <WatchHealthSection />

        {/* 06. Daily Activity Rings & Fitness Tracking */}
        <WatchActivitySection />

        {/* 07. Lifestyle & 24h Rhythm Stories */}
        <WatchLifestyleSection />

        {/* 08. Watch Faces Gallery */}
        <WatchFacesSection />

        {/* 09. Apple Ecosystem Synergy (Hub with iPhone & AirPods) */}
        <WatchEcosystemSection />

        {/* 10. Final Purchase CTA & Store Services */}
        <WatchFinalCTASection />
      </main>
    </div>
  );
}

// Re-export WatchUltra3Page for backwards compatibility
export { WatchUltra3Page };
export default WatchPage;
