import * as React from 'react';
import { cn } from '@/lib/utils';

// Helper function to convert a value to its percentage representation within a range
const valueToPercent = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
};

// Helper function to format currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PriceRangeSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  data?: number[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: [number, number];
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
}

const PriceRangeSlider = React.forwardRef<HTMLDivElement, PriceRangeSliderProps>(
  (
    {
      className,
      data = [],
      min = 0,
      max = 50000000,
      step = 500000,
      defaultValue = [0, 50000000],
      value,
      onValueChange,
      onValueCommit,
      ...props
    },
    ref
  ) => {
    const [localValues, setLocalValues] = React.useState<[number, number]>(value || defaultValue);
    const [isMinThumbDragging, setIsMinThumbDragging] = React.useState(false);
    const [isMaxThumbDragging, setIsMaxThumbDragging] = React.useState(false);

    const sliderRef = React.useRef<HTMLDivElement>(null);
    const minThumbRef = React.useRef<HTMLButtonElement>(null);
    const maxThumbRef = React.useRef<HTMLButtonElement>(null);

    // Sync with controlled value
    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValues(value);
      }
    }, [value]);

    const [minVal, maxVal] = localValues;
    const minPercent = valueToPercent(minVal, min, max);
    const maxPercent = valueToPercent(maxVal, min, max);

    // Handles value updates and calls the onValueChange callback
    const handleValueChange = React.useCallback(
      (newValues: [number, number]) => {
        setLocalValues(newValues);
        if (onValueChange) {
          onValueChange(newValues);
        }
      },
      [onValueChange]
    );

    // Effect for handling mouse/touch move events
    React.useEffect(() => {
      const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        if (!sliderRef.current) return;
        if (!isMinThumbDragging && !isMaxThumbDragging) return;

        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const rect = sliderRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const newValue = Math.round((min + (percent / 100) * (max - min)) / step) * step;

        if (isMinThumbDragging) {
          handleValueChange([Math.min(newValue, maxVal - step), maxVal]);
        }
        if (isMaxThumbDragging) {
          handleValueChange([minVal, Math.max(newValue, minVal + step)]);
        }
      };

      const handleMouseUp = () => {
        if (isMinThumbDragging || isMaxThumbDragging) {
          setIsMinThumbDragging(false);
          setIsMaxThumbDragging(false);
          if (onValueCommit) {
            onValueCommit(localValues);
          }
        }
      };

      if (isMinThumbDragging || isMaxThumbDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }, [isMinThumbDragging, isMaxThumbDragging, min, max, step, minVal, maxVal, handleValueChange, onValueCommit, localValues]);

    // Handles keyboard navigation for accessibility
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, thumb: 'min' | 'max') => {
      let newMinValue = minVal;
      let newMaxValue = maxVal;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (thumb === 'min') newMinValue = Math.max(min, minVal - step);
        else newMaxValue = Math.max(minVal + step, maxVal - step);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (thumb === 'min') newMinValue = Math.min(maxVal - step, minVal + step);
        else newMaxValue = Math.min(max, maxVal + step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (thumb === 'min') newMinValue = min;
        else newMaxValue = minVal + step;
      } else if (e.key === 'End') {
        e.preventDefault();
        if (thumb === 'min') newMinValue = maxVal - step;
        else newMaxValue = max;
      }
      
      const newVals: [number, number] = [newMinValue, newMaxValue];
      handleValueChange(newVals);
      if (onValueCommit) {
        onValueCommit(newVals);
      }
    };

    return (
      <div className={cn('w-full', className)} {...props} ref={ref}>
        <div className="relative w-full h-16 mb-4" ref={sliderRef}>
          {/* Histogram Bars */}
          {data && data.length > 0 && (
            <div className="absolute inset-x-0 bottom-1/2 flex items-end gap-[1.5px] h-full px-2">
              {data.map((value, index) => {
                const barPercent = (index / (data.length - 1)) * 100;
                const isInRange = barPercent >= minPercent && barPercent <= maxPercent;
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex-1 rounded-t-full transition-colors duration-300',
                      isInRange ? 'bg-blue-500' : 'bg-neutral-200'
                    )}
                    style={{ height: `${value * 100}%` }}
                  />
                );
              })}
            </div>
          )}

          {/* Slider Track Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 rounded-full overflow-hidden">
             <div 
               className="absolute top-0 bottom-0 bg-blue-500 rounded-full"
               style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
             />
          </div>

          {/* Slider Thumbs */}
          <div className="absolute inset-0 z-10">
            <button
              ref={minThumbRef}
              role="slider"
              aria-valuemin={min}
              aria-valuemax={maxVal - step}
              aria-valuenow={minVal}
              aria-label="Minimum price"
              onMouseDown={(e) => { e.preventDefault(); setIsMinThumbDragging(true); }}
              onTouchStart={(e) => { e.preventDefault(); setIsMinThumbDragging(true); }}
              onKeyDown={(e) => handleKeyDown(e, 'min')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border border-neutral-300 shadow-md cursor-grab focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-transform hover:scale-110",
                isMinThumbDragging ? "cursor-grabbing scale-110 border-blue-500" : ""
              )}
              style={{ left: `${minPercent}%` }}
            />
            <button
              ref={maxThumbRef}
              role="slider"
              aria-valuemin={minVal + step}
              aria-valuemax={max}
              aria-valuenow={maxVal}
              aria-label="Maximum price"
              onMouseDown={(e) => { e.preventDefault(); setIsMaxThumbDragging(true); }}
              onTouchStart={(e) => { e.preventDefault(); setIsMaxThumbDragging(true); }}
              onKeyDown={(e) => handleKeyDown(e, 'max')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border border-neutral-300 shadow-md cursor-grab focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-transform hover:scale-110",
                isMaxThumbDragging ? "cursor-grabbing scale-110 border-blue-500" : ""
              )}
              style={{ left: `${maxPercent}%` }}
            />
          </div>
        </div>

        {/* Value Displays */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 basis-0 min-w-0 bg-neutral-50 px-1 py-1.5 rounded border border-neutral-200 text-center">
            <p className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Thấp nhất</p>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-neutral-900 truncate tracking-tight">
              {formatCurrency(minVal)}
            </p>
          </div>
          <div className="text-neutral-400 font-bold shrink-0 text-xs px-1">-</div>
          <div className="flex-1 basis-0 min-w-0 bg-neutral-50 px-1 py-1.5 rounded border border-neutral-200 text-center">
            <p className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Cao nhất</p>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-neutral-900 truncate tracking-tight">
              {formatCurrency(maxVal)}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PriceRangeSlider.displayName = 'PriceRangeSlider';

export { PriceRangeSlider };
