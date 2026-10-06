import React, { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeColor?: string;
  dotColor?: string;
  group?: string;
}

export interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  label?: string;
  icon?: ReactNode;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'ghost';
  className?: string;
  menuWidth?: string;
  align?: 'left' | 'right';
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  highlightActive?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export function AdminSelect({
  value,
  onChange,
  options,
  label,
  icon,
  placeholder = 'Chọn...',
  size = 'md',
  variant = 'default',
  className = '',
  menuWidth = 'w-56',
  align = 'left',
  searchable,
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
  highlightActive = true,
  clearable = false,
  onClear,
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const isFiltered = highlightActive && value !== 'all' && value !== '' && value !== undefined;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Auto-enable search when options list is long (> 7 items)
  const isSearchEnabled = searchable ?? options.length > 7;

  // Mouse wheel cycling when hovered on trigger button
  const handleTriggerWheel = (e: React.WheelEvent) => {
    if (!isOpen && !disabled && options.length > 1) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      if (currentIndex === -1) return;
      if (e.deltaY > 0) {
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      } else if (e.deltaY < 0) {
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex].value);
      }
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-3 text-sm rounded-xl gap-2',
    lg: 'h-11 px-4 text-sm rounded-xl gap-2.5',
  }[size];

  return (
    <div
      ref={dropdownRef}
      className={cn('relative inline-block text-left', className)}
      onWheel={handleTriggerWheel}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Bấm để chọn hoặc cuộn chuột để đổi nhanh"
        className={cn(
          'group relative flex w-full items-center justify-between border transition-all duration-200 select-none cursor-pointer outline-none',
          sizeClasses,
          variant === 'default' && [
            isOpen
              ? 'border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/15 text-slate-900'
              : isFiltered
                ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-800 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-xs',
          ],
          variant === 'subtle' && [
            isOpen
              ? 'border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/15 text-slate-900'
              : isFiltered
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                : 'border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-slate-300 text-slate-700',
          ],
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedOption?.dotColor ? (
            <span className={cn('h-2 w-2 rounded-full shrink-0 animate-pulse', selectedOption.dotColor)} />
          ) : (
            (selectedOption?.icon || icon) && (
              <span
                className={cn(
                  'shrink-0 transition-colors',
                  isFiltered ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              >
                {selectedOption?.icon || icon}
              </span>
            )
          )}

          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {label && (
              <span className="text-slate-400 font-medium text-xs shrink-0">{label}:</span>
            )}
            <span
              className={cn(
                'truncate font-semibold text-left',
                isFiltered ? 'text-emerald-700' : selectedOption ? 'text-slate-800' : 'text-slate-400'
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          {selectedOption?.badge && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {clearable && isFiltered && onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0',
              isOpen && 'rotate-180 text-emerald-600'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute top-full z-50 mt-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.16),0_4px_12px_-2px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col',
              menuWidth,
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="listbox"
          >
            {/* Search Input Box */}
            {isSearchEnabled && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto custom-scrollbar p-1 max-h-60 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Không tìm thấy kết quả
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'group/item flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 cursor-pointer select-none',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50/90 hover:text-slate-900 border border-transparent'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.dotColor ? (
                          <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dotColor)} />
                        ) : (
                          opt.icon && (
                            <span
                              className={cn(
                                'shrink-0 transition-colors',
                                isSelected
                                  ? 'text-emerald-600'
                                  : 'text-slate-400 group-hover/item:text-slate-600'
                              )}
                            >
                              {opt.icon}
                            </span>
                          )
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{opt.label}</div>
                          {opt.sublabel && (
                            <div className="text-[10px] text-slate-400 truncate font-normal mt-0.5">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                              opt.badgeColor || 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
