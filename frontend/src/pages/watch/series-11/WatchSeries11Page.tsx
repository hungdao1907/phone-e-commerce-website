import React, { useEffect } from 'react';
import {
  Series11HeroSection,
  Series11DesignSection,
  Series11HealthSection,
  Series11LifestyleSection,
  Series11SafetySection,
  Series11FinalCTASection,
} from '../../../components/watch/series-11/sections/index';
import '@/css/watch-series11.css';

export function WatchSeries11Page() {
  useEffect(() => {
    document.title = 'Apple Watch Series 11 - Hiểu cơ thể hơn, sống chủ động hơn | Apple Store';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="series11-page w-full min-h-screen">
      <main className="relative z-10">
        {/* 1. HERO: Định vị Series 11 toàn diện cho mỗi ngày */}
        <Series11HeroSection />

        {/* 2. DESIGN & DISPLAY: Mỏng nhẹ, màn hình OLED góc rộng Always-On */}
        <Series11DesignSection />

        {/* 3. HEALTH & RECOVERY: Tim mạch ECG, Giấc ngủ chuyên sâu & Vitals */}
        <Series11HealthSection />

        {/* 4. FITNESS & EVERYDAY INTELLIGENCE: 3 Vòng hoạt động & Cử chỉ thông minh */}
        <Series11LifestyleSection />

        {/* 5. SAFETY: Đường dây cứu hộ đích thực */}
        <Series11SafetySection />

        {/* 6. FINAL CTA: Chiếc Apple Watch Series 11 của bạn */}
        <Series11FinalCTASection />
      </main>
    </div>
  );
}
