import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { ULTRA3_SPEC_GROUPS } from '@/data/watch/ultra-3/data/ultra3Data';

interface Ultra3SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuy?: () => void;
}

export function Ultra3SpecsModal({ isOpen, onClose, onSelectBuy }: Ultra3SpecsModalProps) {
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
      const el = document.getElementById('ultra3-battery');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredGroups =
    activeTab === 'all'
      ? ULTRA3_SPEC_GROUPS
      : ULTRA3_SPEC_GROUPS.filter((g) => g.id === activeTab);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6"
        >
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="watch-ultra3-page ultra3-specs-modal relative w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] bg-[#0c0c0f] border border-white/15 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden text-white z-10 select-none"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#121216]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#ff6700]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="ultra-heading text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>Thông Số Kỹ Thuật</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-orange-500/20 text-[#ff6700] border border-orange-500/30">
                      ULTRA 3
                    </span>
                  </h3>
                  <p className="text-xs text-white text-luminescent-white font-normal">
                    Apple Watch Ultra 3 (49 mm Grade 5 Titanium)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white text-luminescent-white hover:text-white transition-colors cursor-pointer"
                aria-label="Đóng bảng thông số"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-[#0c0c0f] overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#ff6700] text-black shadow-md'
                    : 'bg-white/5 text-white text-luminescent-white hover:bg-white/10 hover:text-white'
                }`}
              >
                Tất cả thông số
              </button>

              {ULTRA3_SPEC_GROUPS.map((group) => {
                const Icon = group.icon;
                const isActive = activeTab === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveTab(group.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ff6700] text-black shadow-md'
                        : 'bg-white/5 text-white text-luminescent-white hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{group.tabLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Specs Body */}
            <div
              ref={scrollContainerRef}
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain"
            >
              {filteredGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#ff6700] uppercase tracking-wider">
                      <Icon className="w-4 h-4" />
                      <span>{group.category}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="text-xs text-white text-luminescent-white font-medium mb-1">
                            {item.name}
                          </div>
                          <div className="text-sm sm:text-base font-bold text-white mb-0.5">
                            {item.value}
                          </div>
                          {item.sub && (
                            <div className="text-xs text-white text-luminescent-white font-normal leading-relaxed">
                              {item.sub}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#121216] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-white text-luminescent-white hidden sm:flex">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bảo hành chính hãng 12 tháng tại Apple Việt Nam</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white text-luminescent-white hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold text-black bg-[#ff6700] hover:bg-[#ff7b1a] transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                >
                  <span>Xem ưu đãi & Mua ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
