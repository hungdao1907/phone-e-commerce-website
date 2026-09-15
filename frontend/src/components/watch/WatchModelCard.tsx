import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiquidMetalButton } from '@/components/ui/LiquidMetalButton';
import type { WatchModel } from '@/pages/watch/types';

export type { WatchModel };

interface WatchModelCardProps {
  model: WatchModel;
  onSelect?: (id: string) => void;
}

export function WatchModelCard({ model, onSelect }: WatchModelCardProps) {
  const isFeatured = model.featured;
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const activeSwatch = model.swatches[selectedSwatchIndex] || model.swatches[0];

  const borderShaderRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const borderShaderMount = useRef<any>(null);

  // Distinct badge styling according to model tier
  const getBadgeStyle = () => {
    if (model.id === 'watch-series-11') {
      return 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20';
    }
    if (model.id === 'watch-ultra-3') {
      return 'bg-amber-500/10 text-amber-700 border-amber-500/25';
    }
    return 'bg-neutral-100 text-neutral-600 border-neutral-200/80';
  };

  // Mount Liquid Metal Border Shader around the entire card
  useEffect(() => {
    let isMounted = true;

    const loadBorderShader = async () => {
      try {
        const { liquidMetalFragmentShader, ShaderMount } = await import('@paper-design/shaders');

        if (!isMounted || !borderShaderRef.current) return;

        if (borderShaderMount.current?.destroy) {
          borderShaderMount.current.destroy();
        }

        // Custom metallic reflection per model tier
        const isUltra = model.id === 'watch-ultra-3';
        const isSeries11 = model.id === 'watch-series-11';

        borderShaderMount.current = new ShaderMount(
          borderShaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.45,
            u_shiftRed: isUltra ? 0.4 : isSeries11 ? 0.18 : 0.28,
            u_shiftBlue: isUltra ? 0.15 : isSeries11 ? 0.38 : 0.3,
            u_distortion: 0.05,
            u_contour: 0.12,
            u_angle: 45,
            u_scale: 10,
            u_shape: 1,
            u_offsetX: 0.0,
            u_offsetY: 0.0,
          },
          undefined,
          0 // Idle at rest: 0 speed
        );
      } catch (err) {
        console.warn('Liquid metal card border fallback:', err);
      }
    };

    loadBorderShader();

    return () => {
      isMounted = false;
      if (borderShaderMount.current?.destroy) {
        borderShaderMount.current.destroy();
        borderShaderMount.current = null;
      }
    };
  }, [model.id]);

  const handleCardMouseEnter = () => {
    setIsCardHovered(true);
    borderShaderMount.current?.setSpeed?.(1.25);
  };

  const handleCardMouseLeave = () => {
    setIsCardHovered(false);
    borderShaderMount.current?.setSpeed?.(0.2);
    setTimeout(() => {
      borderShaderMount.current?.setSpeed?.(0);
    }, 500);
  };

  return (
    <div
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      className="group relative flex flex-col justify-between h-full p-[2.5px] rounded-[32px] transition-all duration-500 select-none shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_50px_rgba(0,0,0,0.13)]"
    >
      {/* 01. Resting Clean Apple Border (Visible ONLY when idle / not hovered - Uniform for all cards) */}
      <div
        className={`absolute inset-0 rounded-[32px] border border-black/[0.08] pointer-events-none z-0 transition-opacity duration-500 ${
          isCardHovered ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 02. Liquid Metal Shader Border Canvas (ACTIVATES ONLY ON HOVER) */}
      <div
        ref={borderShaderRef}
        className="shader-container-liquid-metal absolute inset-0 w-full h-full rounded-[32px] overflow-hidden pointer-events-none z-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: isCardHovered ? 1 : 0,
        }}
      />

      {/* 03. Dynamic Hover Sheen (Activates only on hover) */}
      <div
        className={`absolute inset-0 rounded-[32px] pointer-events-none z-0 transition-opacity duration-500 ${
          isCardHovered ? 'opacity-30' : 'opacity-0'
        } bg-gradient-to-br from-black/20 via-transparent to-white/50`}
      />

      {/* 04. Inner White Bento Card (Opaque body that covers center so only 2.5px liquid metal border shines) */}
      <div className="relative z-10 flex flex-col justify-between h-full bg-white rounded-[29.5px] p-6 sm:p-7 lg:p-8 transition-colors duration-300">
        {/* Top Section */}
        <div>
          {/* Category Badge & Sizes */}
          <div className="flex items-center justify-between mb-3 min-h-[26px]">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}
            >
              {model.categoryBadge}
            </span>
            <span className="text-xs font-semibold text-[#86868b] bg-neutral-50 px-2.5 py-0.5 rounded-full border border-black/[0.04]">
              {model.sizes.join(' · ')}
            </span>
          </div>

          {/* Model Name & Tagline */}
          <div className="mb-4">
            <h3 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1d1d1f] mb-1">
              <Link
                to={model.route}
                className="hover:text-[#0071e3] transition-colors"
              >
                {model.name}
              </Link>
            </h3>
            <p className="text-xs sm:text-sm text-[#86868b] font-normal leading-relaxed min-h-[38px] line-clamp-2">
              {model.tagline}
            </p>
          </div>

          {/* Product Visual Stage with Soft Ambient Glow */}
          <div className="relative my-6 aspect-square w-full max-h-56 sm:max-h-60 flex items-center justify-center">
            {/* Ambient radial blur behind the watch */}
            <div
              className="absolute inset-4 rounded-full blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
              style={{
                backgroundColor: model.ambientColor || 'rgba(0, 113, 227, 0.08)',
              }}
            />

            <img
              src={model.image}
              alt={model.name}
              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Interactive Color Swatches */}
          <div className="flex flex-col items-center justify-center gap-1.5 my-4">
            <div className="flex items-center gap-2">
              {model.swatches.map((s, idx) => {
                const isSelected = idx === selectedSwatchIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSwatchIndex(idx)}
                    className={`w-3.5 h-3.5 rounded-full border border-black/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#0071e3] scale-110'
                        : 'hover:scale-125 hover:ring-1 hover:ring-black/20'
                    }`}
                    style={{ backgroundColor: s.hex }}
                    title={s.name}
                    aria-label={s.name}
                  />
                );
              })}
            </div>
            {activeSwatch && (
              <span className="text-[11px] font-medium text-[#86868b] transition-all">
                {activeSwatch.name}
              </span>
            )}
          </div>

          {/* Key Highlights List */}
          <div className="pt-4 border-t border-black/[0.06] flex flex-col gap-2 text-xs sm:text-[13px] text-[#424245] mb-2">
            {model.highlights.map((hl, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 flex-shrink-0" />
                <span className="leading-snug text-[#515154] font-normal">{hl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Price & Action Footer */}
        <div className="pt-5 mt-4 border-t border-black/[0.06] flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#86868b]">
              Giá từ
            </div>
            <div className="text-lg sm:text-xl font-black text-[#1d1d1f] tracking-tight">
              {model.price}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={model.route}
              className="hidden sm:inline-flex items-center text-xs font-semibold text-[#0071e3] hover:underline"
            >
              Chi tiết
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <LiquidMetalButton
              label="Chọn mua"
              onClick={() => onSelect && onSelect(model.id)}
              width={116}
              height={40}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
