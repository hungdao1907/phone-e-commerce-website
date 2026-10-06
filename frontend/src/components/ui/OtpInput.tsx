import React, { useRef, useState, useEffect } from 'react';
import { motion, animate, AnimatePresence, useReducedMotion } from 'motion/react';
import { Clipboard, RefreshCw, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { useOtpFlow } from '../../hooks/useOtpFlow';

export interface OtpInputProps {
  length?: number;
  onVerify: (code: string) => Promise<void>;
  onResend?: () => void | Promise<void>;
  onContinue?: () => void;
  title?: string;
  subtitle?: string;
  resendCooldown?: number;
  cardTheme?: 'dark' | 'white';
  autoFocus?: boolean;
}

export function OtpInput({
  length = 4,
  onVerify,
  onResend,
  onContinue,
  title = "Let's verify your number",
  subtitle = "We've sent a code to your device. It'll auto-verify once entered.",
  resendCooldown = 28,
  cardTheme = 'dark',
  autoFocus = true,
}: OtpInputProps) {
  const {
    code,
    activeIdx,
    setActiveIdx,
    phase,
    errorMessage,
    isShaking,
    chargedIdx,
    countdown,
    canResend,
    inputRefs,
    handleDigitChange,
    handleKeyDown,
    handlePaste,
    pasteFromClipboard,
    triggerResend,
  } = useOtpFlow({
    length,
    onVerify,
    onResend,
    resendCooldown,
    autoFocus,
  });

  const prefersReducedMotion = useReducedMotion();
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMerged, setIsMerged] = useState<boolean>(false);
  const [focusOffset, setFocusOffset] = useState<number>(0);

  // Measure active box horizontal offset for single sliding focus ring (0.46s)
  useEffect(() => {
    const activeEl = boxRefs.current[activeIdx];
    const firstEl = boxRefs.current[0];
    if (activeEl && firstEl) {
      setFocusOffset(activeEl.offsetLeft);
    }
  }, [activeIdx, length]);

  // FLIP Collapse sequence (640ms, outer pairs first) when verification succeeds
  useEffect(() => {
    if (phase === 'success') {
      if (prefersReducedMotion) {
        setIsMerged(true);
        return;
      }

      const rects = boxRefs.current.map((el) => el?.getBoundingClientRect());
      if (!rects[0] || !rects[rects.length - 1]) {
        setIsMerged(true);
        return;
      }

      const cx = (rects[0].left + rects[rects.length - 1].right) / 2;
      const mid = (rects.length - 1) / 2;

      Promise.all(
        boxRefs.current.map((el, i) => {
          if (!el || !rects[i]) return Promise.resolve();
          const r = rects[i]!;
          const dx = cx - (r.left + r.width / 2);
          const delay = (mid - Math.abs(i - mid)) * 0.07; // Outer pair delay = 0

          return animate(
            el,
            { x: dx, scale: 0.34, opacity: [1, 1, 0] },
            { delay, duration: 0.64, ease: [0.65, 0, 0.35, 1] }
          );
        })
      ).then(() => {
        setIsMerged(true);
      });
    } else {
      setIsMerged(false);
    }
  }, [phase, prefersReducedMotion]);

  const isDark = cardTheme === 'dark';

  return (
    <div
      className={`relative w-full max-w-md mx-auto rounded-3xl p-7 sm:p-9 overflow-hidden transition-colors duration-500 shadow-2xl select-none font-sans ${
        isDark
          ? 'bg-[#12152a] text-white border border-white/10 shadow-black/40'
          : 'bg-white text-neutral-900 border border-neutral-200/80 shadow-neutral-200/60'
      }`}
    >
      {/* TEAL GLOW RISING FROM BOTTOM OF CARD */}
      <motion.div
        animate={{
          opacity: phase === 'success' ? 0.75 : phase === 'verifying' ? 0.45 : 0.2,
          scale: phase === 'success' ? 1.15 : 1,
        }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute -bottom-20 inset-x-0 h-48 bg-gradient-to-t from-[var(--color-otp-teal,#2dd4bf)]/30 to-transparent blur-3xl pointer-events-none rounded-full"
      />

      {/* TOP HEADER WITH BLUR CROSSFADE */}
      <div className="relative z-10 text-center mb-7 min-h-[72px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === 'success' ? (
            <motion.div
              key="header-success"
              initial={{ opacity: 0, filter: 'blur(8px)', y: -6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)', y: 6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-otp-teal,#2dd4bf)]">
                Verified successfully
              </h2>
              <p
                className={`mt-1.5 text-xs sm:text-sm font-medium ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Tài khoản và mã bảo mật của bạn đã được xác minh thành công.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="header-default"
              initial={{ opacity: 0, filter: 'blur(8px)', y: -6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)', y: 6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2
                className={`text-2xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {title}
              </h2>
              <p
                className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {subtitle}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OTP SLOTS & MERGE STAGE */}
      <div className="relative z-10 my-4 flex items-center justify-center min-h-[96px]">
        {/* HÀNG Ô NHẬP LIỆU (IDLE, VERIFYING, ERROR) */}
        <motion.div
          ref={containerRef}
          animate={
            isShaking && !prefersReducedMotion
              ? { x: [-12, 12, -8, 8, -4, 4, 0] }
              : {}
          }
          transition={{ duration: 0.32, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center gap-3 sm:gap-3.5 ${
            isMerged ? 'pointer-events-none' : ''
          }`}
        >
          {/* VÒNG FOCUS DUY NHẤT TRƯỢT (0.46s TWEEN) */}
          {phase === 'idle' && (
            <motion.div
              animate={{
                x: focusOffset,
                opacity: activeIdx !== null ? 1 : 0,
              }}
              transition={{
                x: { duration: 0.46, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.2 },
              }}
              className="absolute left-0 top-0 w-12 sm:w-14 h-14 sm:h-16 rounded-2xl pointer-events-none z-20 border-2 border-[var(--color-otp-violet,#7c5cff)] shadow-[0_0_18px_rgba(124,92,255,0.45)]"
            />
          )}

          {code.map((digit, index) => {
            const isCharged = chargedIdx === index;
            const isError = phase === 'error';

            return (
              <div
                key={index}
                ref={(el) => {
                  boxRefs.current[index] = el;
                }}
                className="relative flex items-center justify-center w-12 sm:w-14 h-14 sm:h-16 rounded-2xl"
              >
                {/* Nền ô */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-colors duration-300 ${
                    isError
                      ? 'bg-rose-500/10 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : isDark
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-neutral-100/80 border border-neutral-300/80'
                  }`}
                />

                {/* VỆT SÁNG CHẠY QUANH VIỀN (SVG strokeDashoffset với dasharray .13 .87) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-2xl p-[1px]"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <linearGradient id={`otp-beam-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c5cff" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#7c5cff" />
                    </linearGradient>
                  </defs>
                  <motion.rect
                    x="2"
                    y="2"
                    width="96"
                    height="96"
                    rx="16"
                    fill="none"
                    stroke={isError ? '#f43f5e' : `url(#otp-beam-grad-${index})`}
                    strokeWidth="3"
                    pathLength={1}
                    strokeDasharray="0.13 0.87"
                    animate={
                      isError
                        ? { strokeDashoffset: [1, 0] }
                        : isCharged
                        ? { strokeDashoffset: [1, 0] }
                        : phase === 'verifying'
                        ? { strokeDashoffset: [1, -1] }
                        : { strokeDashoffset: 1 }
                    }
                    transition={
                      phase === 'verifying'
                        ? { duration: 1.2, repeat: Infinity, ease: 'linear' }
                        : { duration: 0.65, ease: 'easeInOut' }
                    }
                    style={{
                      filter: isError
                        ? 'drop-shadow(0 0 6px rgba(244,63,94,0.8))'
                        : 'drop-shadow(0 0 6px rgba(45,212,191,0.75))',
                    }}
                  />
                </svg>

                {/* Ô INPUT SỐ (Font Geist, tabular-nums) */}
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  disabled={phase === 'verifying' || phase === 'success'}
                  value={digit}
                  onFocus={() => setActiveIdx(index)}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  className={`relative z-10 w-full h-full text-center font-sans tabular-nums font-bold text-2xl outline-none bg-transparent caret-[var(--color-otp-teal,#2dd4bf)] ${
                    isError
                      ? 'text-rose-500'
                      : isDark
                      ? 'text-white'
                      : 'text-neutral-900'
                  } disabled:cursor-not-allowed`}
                />
              </div>
            );
          })}
        </motion.div>

        {/* Ô VUÔNG NHỎ TEAL Ở TÂM KÈM DẤU TÍCH VẼ DẦN */}
        <AnimatePresence>
          {isMerged && (
            <motion.div
              key="merged-teal-box"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.15, 1], opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 20,
                mass: 0.8,
              }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              {/* Vầng hào quang teal */}
              <div className="absolute w-32 h-32 rounded-full bg-[var(--color-otp-teal,#2dd4bf)]/30 blur-2xl pointer-events-none" />

              {/* Ô vuông teal bo góc */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--color-otp-teal,#2dd4bf)] text-[#12152a] flex items-center justify-center shadow-[0_0_35px_rgba(45,212,191,0.5)]">
                {/* Dấu tích vẽ dần (pathLength 0 -> 1) */}
                <svg className="w-9 h-9 sm:w-11 sm:h-11" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 13l4.5 4.5L19 7"
                    stroke="#12152a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.15,
                      ease: [0.65, 0, 0.35, 1],
                    }}
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FEEDBACK & FOOTER CONTROLS */}
      <div className="relative z-10 mt-6 min-h-[44px] flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {phase === 'error' && errorMessage ? (
            <motion.div
              key="err-state"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 text-rose-400 text-xs sm:text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </motion.div>
          ) : phase === 'verifying' ? (
            <motion.div
              key="verifying-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-[var(--color-otp-teal,#2dd4bf)] text-xs sm:text-sm font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang kiểm tra mã bảo mật...</span>
            </motion.div>
          ) : phase === 'success' ? (
            <motion.div
              key="continue-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="w-full pt-1"
            >
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-3.5 px-6 rounded-2xl bg-[var(--color-otp-teal,#2dd4bf)] hover:bg-[#26bba8] text-[#12152a] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-otp-teal,#2dd4bf)]/25 cursor-pointer active:scale-[0.99] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="idle-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 text-xs"
            >
              {/* Nút Paste Code đọc từ Clipboard */}
              <button
                type="button"
                onClick={pasteFromClipboard}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste code</span>
              </button>

              {/* Dòng đếm ngược gửi lại mã: Resend in 28s */}
              <div className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={triggerResend}
                    className="text-[var(--color-otp-teal,#2dd4bf)] hover:underline font-semibold cursor-pointer"
                  >
                    Resend code now
                  </button>
                ) : (
                  <span>
                    Didn&apos;t get the code?{' '}
                    <strong className="font-mono font-semibold">Resend in {countdown}s</strong>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OtpInput;
