import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/mockData';

export function BrandMarquee() {
  return (
    <div className="w-full overflow-hidden relative z-10 -mt-16 md:-mt-20 pb-0 pt-4">
      {/* Fade mask on edges so items appear/disappear smoothly */}
      <div className="w-full relative [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="animate-marquee gap-16 px-8">
          {/* Duplicating the categories array 4 times to ensure seamless infinite scrolling */}
          {[...categories, ...categories, ...categories, ...categories].map((item, idx) => (
            <Link
              key={idx}
              to="/"
              className="flex flex-col items-center group min-w-[90px] shrink-0 hover:-translate-y-1 transition-transform"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
