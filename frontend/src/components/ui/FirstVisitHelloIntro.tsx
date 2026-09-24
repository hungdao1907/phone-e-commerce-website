import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppleHelloEnglishEffect } from './AppleHelloEffect';

const SESSION_STORAGE_KEY = 'has_seen_hello_intro_session';

/**
 * Kiểm tra xem lượt truy cập hiện tại có phải do F5 / reload / tải lại trang hay không.
 */
export function isPageReload(): boolean {
  if (typeof window === 'undefined' || !window.performance) return false;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    }
    // Fallback cho trình duyệt cũ
    return (performance as unknown as { navigation?: { type: number } }).navigation?.type === 1;
  } catch {
    return false;
  }
}

/**
 * Điều kiện hiển thị hiệu ứng khởi đầu:
 * - Xuất hiện khi người dùng vào trang web (phiên mới / mở tab mới).
 * - Hỗ trợ query params: ?intro=true hoặc ?replay_intro=true để luôn xem được.
 * - Tránh lặp lại khi chuyển trang trong cùng phiên duyệt web.
 */
export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === 'true' || params.get('replay_intro') === 'true') {
      return true;
    }

    // Nếu là F5 hoặc load lại trang -> không làm gián đoạn người dùng
    if (isPageReload()) {
      return false;
    }

    // Nếu đã hiển thị trong phiên duyệt web hiện tại -> không hiện lại
    if (sessionStorage.getItem(SESSION_STORAGE_KEY)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export interface FirstVisitHelloIntroProps {
  onFadeOutStart?: () => void;
}

export function FirstVisitHelloIntro({ onFadeOutStart }: FirstVisitHelloIntroProps) {
  const [isOpen, setIsOpen] = useState(shouldShowIntro);
  const reducedMotion = useReducedMotion() === true;
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredFadeOutRef = useRef(false);

  const triggerHandoff = useCallback(() => {
    if (!hasTriggeredFadeOutRef.current) {
      hasTriggeredFadeOutRef.current = true;
      onFadeOutStart?.();
    }
  }, [onFadeOutStart]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore private storage limitations
    }
    triggerHandoff();
    setIsOpen(false);
  }, [triggerHandoff]);

  const handleAnimationComplete = useCallback(() => {
    // Dừng ngắn (350ms) để người dùng chiêm ngưỡng trọn vẹn chữ hello viết tay
    completeTimerRef.current = setTimeout(() => {
      dismiss();
    }, 350);
  }, [dismiss]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {}

    if (reducedMotion) {
      dismiss();
      return;
    }

    // Khóa cuộn trang và đưa về đầu trang khi intro đang phát
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Timeout dự phòng an toàn (4.2s)
    safetyTimerRef.current = setTimeout(() => {
      dismiss();
    }, 4200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cung cấp hàm test nhanh qua DevTools Console: window.__replayHelloIntro()
    (window as unknown as { __replayHelloIntro?: () => void }).__replayHelloIntro = () => {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {}
      window.location.href = window.location.pathname + '?intro=true';
    };

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [isOpen, reducedMotion, dismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="first-visit-hello-intro"
          role="dialog"
          aria-label="Màn hình chào mừng"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          className="fixed inset-0 z-[99999] flex h-[100dvh] w-screen flex-col items-center justify-center bg-white select-none overflow-hidden"
        >
          {/* Lớp nền tinh tế phong cách Apple */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.015)_0%,transparent_70%)]" />

          {/* SVG chữ hello viết tay ở chính giữa */}
          <div className="relative flex items-center justify-center px-6">
            <AppleHelloEnglishEffect
              className="h-20 w-auto text-[#1d1d1f] drop-shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:h-28 md:h-36 lg:h-44"
              speed={0.85}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>

          {/* Nút bỏ qua tinh tế ở góc phải */}
          <motion.button
            type="button"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            whileHover={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="absolute bottom-8 right-8 text-xs font-medium tracking-wider text-neutral-400 hover:text-neutral-800 transition-colors uppercase cursor-pointer"
            title="Bỏ qua phần giới thiệu"
          >
            Bỏ qua &rarr;
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


