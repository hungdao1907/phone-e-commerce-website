import React from 'react';
import Spline from '@splinetool/react-spline';
import { ArrowRight, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative w-full min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden z-30 -mt-[44px] pt-[44px] pointer-events-none">
      {/* SVG filter removed because it breaks CSS backdrop-filter on Chrome/Safari */}

      {/* Interactive 3D Spline Background on the right */}
      <div className="absolute top-[-10%] right-[-30%] w-full md:w-[75%] h-[120%] z-0 pointer-events-none -rotate-90 origin-center scale-150">
        <Spline
          scene="https://prod.spline.design/nBX5qfesRG7JFJrj/scene.splinecode"
          className="w-full h-full object-cover pointer-events-auto"
        />
      </div>

      <main className="w-full max-w-[1200px] mx-auto px-6 md:px-12 relative z-10 pt-10 pb-16 pointer-events-auto">
        <section className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Content (Text) */}
          <div className="w-full md:w-3/5 space-y-8">
            <h1 className="text-5xl md:text-[72px] font-bold tracking-tighter text-[#0a2540] leading-[1.05]">
              Thế giới công nghệ nằm gọn trong <span className="liquid-glass-text">tầm tay bạn.</span>
            </h1>
            <p className="text-xl md:text-[22px] font-medium text-[#425466] leading-relaxed max-w-[90%]">
              Sở hữu ngay những siêu phẩm công nghệ <span className="text-[#84cc16]">mới nhất, </span> 
              với chính sách bảo hành chính hãng và vô vàn ưu đãi—<span className="text-[#84cc16]">trải nghiệm mua sắm tuyệt vời chưa từng có.</span>
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <button 
                className="px-8 py-4 group rounded-full font-bold transition-all duration-300 flex items-center bg-[#22c55e] hover:bg-[#0a2540] text-white shadow-lg shadow-green-500/30"
              >
                Mua sắm ngay <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 text-[#0a2540] font-medium hover:text-[#22c55e] transition-colors flex items-center">
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
