import React from 'react';

const waveImages = [
  'https://images.unsplash.com/photo-1591337676887-a217a6c9ba82?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1628202926206-c63a34b1618f?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=900&fit=crop',
];

export function WaveGallery() {
  return (
    <section className="w-full bg-[#0f4a32] py-16">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 mb-10">
        <h2 className="text-3xl md:text-4xl font-semibold text-white leading-snug tracking-tight">
          Khám phá bộ sưu tập. <span className="text-emerald-300/70">Trải nghiệm công nghệ đỉnh cao qua từng sản phẩm.</span>
        </h2>
      </div>
      <div className="wave-wrapper">
        <div className="wave-items">
          {waveImages.map((url, idx) => (
            <div
              key={idx}
              className="wave-item"
              tabIndex={0}
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
