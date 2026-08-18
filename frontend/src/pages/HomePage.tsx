import React from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { BrandMarquee } from '../components/sections/BrandMarquee';
import { WaveGallery } from '../components/sections/WaveGallery';

export function HomePage() {
  return (
    <div className="bg-white min-h-screen font-sans text-[#1d1d1f]">
      {/* 1. Hero Header với Spline 3D */}
      <HeroSection />

      {/* 2. Thanh logo thương hiệu trôi ngang */}
      <BrandMarquee />

      {/* 3. Bộ sưu tập ảnh 3D Wave */}
      <WaveGallery />
    </div>
  );
}
