import React, { useState, useEffect, useRef } from 'react';
import { Flame, Activity, Waves, Fingerprint, Layers, Smartphone } from 'lucide-react';
import { SERIES_11_FITNESS_ITEMS, SERIES_11_SMART_ITEMS } from '../../../../data/watch/series-11/data/series11Data';

export function Series11LifestyleSection() {
  const [smartIndex, setSmartIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);

  // Track progress and handle auto-transition across 3 video slides
  useEffect(() => {
    setProgress(0);

    if (smartIndex === 0) {
      // 1. Video 1 (Double Tap)
      if (video1Ref.current) {
        video1Ref.current.currentTime = 0;
        video1Ref.current.play().catch(() => {});
      }
    } else if (smartIndex === 1) {
      // 2. Video 2 (Ngăn Xếp Thông Minh)
      if (video2Ref.current) {
        video2Ref.current.currentTime = 0;
        video2Ref.current.play().catch(() => {});
      }
    } else if (smartIndex === 2) {
      // 3. Video 3 (Apple Pay & Tìm Chính Xác - New Video)
      if (video3Ref.current) {
        video3Ref.current.currentTime = 0;
        video3Ref.current.play().catch(() => {});
      }
    }
  }, [smartIndex]);

  const handleVideo1TimeUpdate = () => {
    if (smartIndex === 0 && video1Ref.current && video1Ref.current.duration) {
      setProgress((video1Ref.current.currentTime / video1Ref.current.duration) * 100);
    }
  };

  const handleVideo1Ended = () => {
    setProgress(100);
    setSmartIndex(1);
  };

  const handleVideo2TimeUpdate = () => {
    if (smartIndex === 1 && video2Ref.current && video2Ref.current.duration) {
      setProgress((video2Ref.current.currentTime / video2Ref.current.duration) * 100);
    }
  };

  const handleVideo2Ended = () => {
    setProgress(100);
    setSmartIndex(2);
  };

  const handleVideo3TimeUpdate = () => {
    if (smartIndex === 2 && video3Ref.current && video3Ref.current.duration) {
      setProgress((video3Ref.current.currentTime / video3Ref.current.duration) * 100);
    }
  };

  const handleVideo3Ended = () => {
    setProgress(100);
    setSmartIndex(0); // Cycle back to video 1
  };
  const getFitnessIcon = (name: string) => {
    switch (name) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-[#ff2d55]" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-[#30d158]" />;
      case 'Waves':
        return <Waves className="w-5 h-5 text-[#0071e3]" />;
      default:
        return <Flame className="w-5 h-5 text-[#ff2d55]" />;
    }
  };

  const getSmartIcon = (name: string) => {
    switch (name) {
      case 'Fingerprint':
        return <Fingerprint className="w-5 h-5 text-[#0071e3]" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-[#5e5ce6]" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-[#ff9500]" />;
      default:
        return <Fingerprint className="w-5 h-5 text-[#0071e3]" />;
    }
  };

  return (
    <section id="s11-lifestyle" className="series11-section bg-white text-[#1d1d1f]">
      <div className="series11-container">
        {/* Left-Aligned Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-24 text-left">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0071e3] uppercase mb-2 sm:mb-3 block">
            LUYỆN TẬP & TIỆN ÍCH MỖI NGÀY
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-black mb-2 sm:mb-3 leading-[1.14]">
            Từ từng bước chạy. <br />
            Đến từng việc nhỏ trong ngày.
          </h2>
          <p className="text-xs sm:text-sm text-black font-medium leading-relaxed max-w-xl">
            Series 11 đóng vai trò như một huấn luyện viên cá nhân tận tâm khi vận động và một trợ lý thông minh trên cổ tay trong mọi sinh hoạt thường nhật.
          </p>
        </div>

        {/* Alternating Story Chapters Container */}
        <div className="flex flex-col gap-16 sm:gap-28">
          {/* CHAPTER 1 — FITNESS (Visual Left ~58% / Content Right ~42%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Visual Anchor Left (7 cols) */}
            <div className="lg:col-span-7 order-1 flex items-center justify-center">
              <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden border border-black/8 shadow-[0_25px_60px_rgba(0,0,0,0.12)] bg-black flex items-center justify-center">
                <video
                  src="/videos/watch/watch-activity-rings.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>
            </div>

            {/* Narrative Content Right (5 cols) */}
            <div className="lg:col-span-5 order-2 flex flex-col items-start text-left">
              <h3 className="text-2xl sm:text-4xl font-black text-black mb-4 leading-tight">
                Thúc đẩy từng bước tiến thể lực.
              </h3>
              <p className="text-sm sm:text-base text-black font-medium leading-relaxed mb-8">
                3 Vòng Hoạt Động đóng vai trò động lực trực quan mỗi ngày, kết hợp cùng các thông số chuyên sâu cho chạy bộ, đạp xe, yoga và bơi lội.
              </p>

              {/* 3 Supporting Feature Items */}
              <div className="flex flex-col gap-5 w-full">
                {SERIES_11_FITNESS_ITEMS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-black/6 last:border-b-0 last:pb-0">
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-black/5 shrink-0 mt-0.5">
                      {getFitnessIcon(item.iconName)}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-black mb-0.5">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-black font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHAPTER 2 — EVERYDAY INTELLIGENCE (Content Left ~42% / Visual Right ~58%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Narrative Content Left (5 cols) */}
            <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col items-start text-left">
              <h3 className="text-2xl sm:text-4xl font-black text-black mb-4 leading-tight">
                Làm mọi việc chỉ với một cử chỉ.
              </h3>
              <p className="text-sm sm:text-base text-black font-medium leading-relaxed mb-8">
                Chạm hai lần để trả lời cuộc gọi, xem nhanh ngăn xếp widget thông minh và thực hiện thanh toán an toàn ngay trên cổ tay mà không cần lấy iPhone ra.
              </p>

              {/* 3 Supporting Feature Items */}
              <div className="flex flex-col gap-5 w-full">
                {SERIES_11_SMART_ITEMS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-black/6 last:border-b-0 last:pb-0">
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-black/5 shrink-0 mt-0.5">
                      {getSmartIcon(item.iconName)}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-black mb-0.5">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-black font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Anchor Right (7 cols) */}
            <div className="lg:col-span-7 order-1 lg:order-2 flex items-center justify-center">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden border border-black/8 shadow-[0_25px_60px_rgba(0,0,0,0.12)] bg-black flex items-center justify-center group">
                  {/* 1. Video 1: Apple Double Tap Gesture (Slide 0) */}
                  <video
                    ref={video1Ref}
                    src="/videos/watch/watch-double-tap.mp4"
                    muted
                    playsInline
                    onTimeUpdate={handleVideo1TimeUpdate}
                    onEnded={handleVideo1Ended}
                    className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-1000 ${
                      smartIndex === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {/* 2. Video 2: Apple Watch Series 11 Smart Stack (Slide 1) */}
                  <video
                    ref={video2Ref}
                    src="/videos/watch/watch-double-tap-custom.mp4"
                    muted
                    playsInline
                    onTimeUpdate={handleVideo2TimeUpdate}
                    onEnded={handleVideo2Ended}
                    className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-1000 ${
                      smartIndex === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {/* 3. Video 3: Apple Pay & Tìm Chính Xác (Slide 2 - New Video) */}
                  <video
                    ref={video3Ref}
                    src="/videos/watch/watch-apple-pay-find-my.mp4"
                    muted
                    playsInline
                    onTimeUpdate={handleVideo3TimeUpdate}
                    onEnded={handleVideo3Ended}
                    className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-1000 ${
                      smartIndex === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                </div>

                {/* Minimalist Progress Pill (Located BELOW the video card) */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f1f3f4] shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-black/5 select-none">
                  {[0, 1, 2].map((idx) => {
                    const isActive = smartIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSmartIndex(idx)}
                        className={`transition-all duration-300 cursor-pointer overflow-hidden rounded-full flex items-center ${
                          isActive
                            ? 'w-7 h-2 bg-[#9aa0a6] relative'
                            : 'w-2 h-2 bg-[#70757a] hover:bg-[#202124]'
                        }`}
                        title={`Video ${idx + 1}`}
                      >
                        {isActive && (
                          <div
                            className="h-full bg-[#202124] rounded-full transition-all ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
