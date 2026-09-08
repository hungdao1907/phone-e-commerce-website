import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { SE3_SPEC_GROUPS } from '../data/se3Data';

interface SE3SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuy?: () => void;
}

export function SE3SpecsModal({ isOpen, onClose, onSelectBuy }: SE3SpecsModalProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [mounted, setMounted] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset scroll to top when changing tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Handle modal open/close: stop Lenis & prevent page background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      lenis?.start();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, lenis]);

  const handleBuyNowClick = () => {
    onClose();
    if (onSelectBuy) {
      onSelectBuy();
    } else {
      const el = document.getElementById('se3-cta');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredGroups =
    activeTab === 'all'
      ? SE3_SPEC_GROUPS
      : SE3_SPEC_GROUPS.filter((g) => g.id === activeTab);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden pointer-events-auto"
          style={{ zIndex: 99999 }}
        >
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Center Modal Container (Crisp White Card with Apple Web Typography) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="apple-specs-modal relative z-10 w-full max-w-4xl h-[640px] sm:h-[680px] md:h-[720px] max-h-[92vh] bg-white border border-neutral-300 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-black select-none"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-7 border-b border-neutral-200 flex items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="se3-eyebrow text-[11px] sm:text-xs font-bold tracking-[0.14em] text-black uppercase">
                    BẢNG THÔNG SỐ KỸ THUẬT
                  </div>
                  <h3 className="se3-heading text-lg sm:text-2xl font-black text-black tracking-tight">
                    Apple Watch SE 3
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 flex items-center justify-center text-black transition-colors cursor-pointer border border-neutral-300"
                aria-label="Đóng bảng thông số"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 sm:px-7 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`se3-heading px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white hover:bg-neutral-100 text-black border border-neutral-300'
                }`}
              >
                Tất cả
              </button>
              {SE3_SPEC_GROUPS.map((g) => {
                const Icon = g.icon;
                const isActive = activeTab === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveTab(g.id)}
                    className={`se3-heading inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-white hover:bg-neutral-100 text-black border border-neutral-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-current" />
                    <span>{g.tabLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Specifications Content (White Background, Black Text) */}
            <div
              ref={scrollContainerRef}
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 se3-scroll-container bg-white"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-6"
                >
                  {filteredGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div
                        key={group.id}
                        className="p-4 sm:p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200"
                      >
                        {/* Category Title */}
                        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-neutral-200">
                          <GroupIcon className="w-5 h-5 text-black" />
                          <h4 className="se3-heading text-base sm:text-lg font-bold text-black tracking-tight">
                            {group.category}
                          </h4>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          {group.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 sm:p-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 transition-colors flex flex-col justify-start shadow-xs"
                            >
                              <div className="se3-eyebrow text-xs font-bold text-black uppercase tracking-wider mb-1">
                                {item.name}
                              </div>
                              <div className="se3-heading text-sm sm:text-base font-black text-black mb-1 leading-snug">
                                {item.value}
                              </div>
                              {item.sub && (
                                <div className="se3-body text-xs text-black leading-relaxed font-normal">
                                  {item.sub}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="hidden sm:block text-xs font-medium text-black">
                Giá khởi điểm từ <span className="se3-tabular font-black text-black">6.999.000₫</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="se3-heading px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-black text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-neutral-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="se3-heading inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Mua ngay SE 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
