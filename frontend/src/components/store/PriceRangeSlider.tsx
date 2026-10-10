import { useMemo, useRef, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import NumberFlow from '@number-flow/react';

interface PriceRangeSliderProps {
  /** Real lowest price in DB (VND) */
  min: number;
  /** Real highest price in DB (VND) */
  max: number;
  /** Current selection [low, high] */
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onClear: () => void;
  hideContainerStyle?: boolean;
}

/** Pick a slider step that scales with the real price span. */
export function getPriceStep(min: number, max: number): number {
  const span = Math.max(max - min, 1);
  const candidates = [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000];
  return candidates.find((s) => span / s <= 200) ?? 5_000_000;
}

/** Short VND label, e.g. 12.500.000 -> "12,5 triệu" */
function compactVND(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1).replace('.', ',')} triệu`;
  }
  return `${Math.round(n / 1000)}k`;
}

const NUM_FORMAT = { maximumFractionDigits: 0 } as const;

export function PriceRangeSlider({ min, max, value, onChange, onClear, hideContainerStyle }: PriceRangeSliderProps) {
  const step = useMemo(() => getPriceStep(min, max), [min, max]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const span = Math.max(max - min, 1);
  const toPct = (v: number) => ((v - min) / span) * 100;
  const isDirty = value[0] > min || value[1] < max;

  // Auto-generated tick labels from real min/max (6 evenly spaced)
  const ticks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => min + (span * i) / count);
  }, [min, span]);

  const handleMove = (e: React.PointerEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    setHoverPct(pct);
  };

  // Ghost range: from hovered point to the nearest thumb
  let ghost: { left: number; width: number } | null = null;
  if (hoverPct !== null) {
    const lowPct = toPct(value[0]);
    const highPct = toPct(value[1]);
    const nearest = Math.abs(hoverPct - lowPct) <= Math.abs(hoverPct - highPct) ? lowPct : highPct;
    ghost = { left: Math.min(hoverPct, nearest), width: Math.abs(hoverPct - nearest) };
  }

  return (
    <div className={hideContainerStyle ? "w-full" : "bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 shadow-sm w-full md:max-w-[520px]"}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Khoảng giá</p>
          <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-neutral-900 tabular-nums">
            <NumberFlow value={value[0]} format={NUM_FORMAT} locales="vi-VN" suffix=" ₫" />
            <span className="text-neutral-400 font-normal">–</span>
            <NumberFlow value={value[1]} format={NUM_FORMAT} locales="vi-VN" suffix=" ₫" />
          </div>
        </div>
        {!hideContainerStyle && (
          <button
            type="button"
            onClick={onClear}
            disabled={!isDirty}
            aria-label="Xóa bộ lọc khoảng giá"
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 enabled:border-neutral-300 enabled:text-neutral-800 enabled:hover:bg-neutral-100 disabled:border-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed"
          >
            Xóa
          </button>
        )}
      </div>

      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-6 group/slider"
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        value={value}
        onValueChange={(v) => onChange([v[0], v[1]])}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverPct(null)}
        aria-label="Khoảng giá"
      >
        <SliderPrimitive.Track
          ref={trackRef}
          className="relative grow h-2 rounded-full bg-neutral-200 overflow-hidden"
        >
          {ghost && (
            <div
              className="absolute top-0 h-full bg-neutral-900/20 transition-[left,width] duration-100"
              style={{ left: `${ghost.left}%`, width: `${ghost.width}%` }}
            />
          )}
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-neutral-900" />
        </SliderPrimitive.Track>
        {['Giá tối thiểu', 'Giá tối đa'].map((label) => (
          <SliderPrimitive.Thumb
            key={label}
            aria-label={label}
            className="block w-5 h-5 rounded-full bg-white border-2 border-neutral-900 shadow-md cursor-grab active:cursor-grabbing transition-transform duration-150 hover:scale-110 active:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          />
        ))}
      </SliderPrimitive.Root>

      <div className="relative mt-3 h-4 text-[11px] text-neutral-400 font-medium">
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${toPct(t)}%`,
              transform: i === 0 ? 'translateX(0)' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {compactVND(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
