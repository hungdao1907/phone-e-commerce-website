import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface SettigationOtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  isVerifying?: boolean;
  isVerified?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  length?: number;
  autoFocus?: boolean;
}

export function SettigationOtpInput({
  value,
  onChange,
  onComplete,
  isVerifying = false,
  isVerified = false,
  isError = false,
  errorMessage = null,
  length = 6,
  autoFocus = true,
}: SettigationOtpInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const boxWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  const [chargedBoxes, setChargedBoxes] = useState<number[]>([]);
  const [pitch, setPitch] = useState<number>(64);

  // Guard against infinite auto-submit loops
  const lastSubmittedOtpRef = useRef<string>('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Dynamically measure exact pixel distance between adjacent boxes for pixel-perfect merge
  const updatePitch = useCallback(() => {
    if (boxWrapperRefs.current[0] && boxWrapperRefs.current[1]) {
      const rect0 = boxWrapperRefs.current[0].getBoundingClientRect();
      const rect1 = boxWrapperRefs.current[1].getBoundingClientRect();
      const measured = Math.abs(rect1.left - rect0.left);
      if (measured > 20) {
        setPitch(measured);
        return;
      }
    }
    // Responsive fallback if boxes not yet laid out
    if (typeof window !== 'undefined') {
      setPitch(window.innerWidth >= 640 ? 66 : 52);
    }
  }, []);

  useEffect(() => {
    updatePitch();
    window.addEventListener('resize', updatePitch);
    return () => window.removeEventListener('resize', updatePitch);
  }, [updatePitch]);

  useEffect(() => {
    if (isVerified) {
      updatePitch();
    }
  }, [isVerified, updatePitch]);

  // Sync length if value array has different length
  useEffect(() => {
    if (value.length !== length) {
      const padded = Array(length).fill('').map((_, i) => value[i] || '');
      onChange(padded);
    }
  }, [length, value, onChange]);

  // Focus on mount
  useEffect(() => {
    if (autoFocus && !isVerifying && !isVerified) {
      const firstEmpty = value.findIndex((v) => !v);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : 0;
      setTimeout(() => {
        inputRefs.current[targetIndex]?.focus();
      }, 150);
    }
  }, [autoFocus, isVerifying, isVerified, value]);

  // Derived state
  const isFilled = value.filter(Boolean).length === length;
  const fullOtp = value.join('');

  // Reset submission lock if user clears or changes code
  useEffect(() => {
    if (!isFilled) {
      lastSubmittedOtpRef.current = '';
    }
  }, [isFilled]);

  // Auto trigger verification when all digits are filled
  useEffect(() => {
    if (
      isFilled &&
      fullOtp.length === length &&
      !isVerifying &&
      !isVerified &&
      !isError &&
      lastSubmittedOtpRef.current !== fullOtp
    ) {
      lastSubmittedOtpRef.current = fullOtp;
      onCompleteRef.current?.(fullOtp);
    }
  }, [isFilled, fullOtp, isVerifying, isVerified, isError, length]);

  // Handle single box input
  const handleDigitChange = useCallback((index: number, rawVal: string) => {
    const clean = rawVal.replace(/\D/g, '');
    const char = clean.slice(-1);

    const next = [...value];
    next[index] = char;
    onChange(next);
    lastSubmittedOtpRef.current = '';

    if (char) {
      // Trigger electric charge animation on this box
      setChargedBoxes((prev) => [...prev.filter((i) => i !== index), index]);
      setTimeout(() => {
        setChargedBoxes((prev) => prev.filter((i) => i !== index));
      }, 700);

      // Move to next box
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }, [value, onChange, length]);

  // Smart Paste Distribution: paste full code in ANY box and it distributes itself
  const handlePaste = useCallback((index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const next = [...value];
    const startIdx = pasted.length === length ? 0 : index;
    for (let i = 0; i < pasted.length && startIdx + i < length; i++) {
      next[startIdx + i] = pasted[i];
    }
    onChange(next);
    lastSubmittedOtpRef.current = '';

    // Cascading charge animation ripple
    pasted.split('').forEach((_, idx) => {
      const boxToCharge = startIdx + idx;
      setTimeout(() => {
        setChargedBoxes((prev) => [...prev, boxToCharge]);
        setTimeout(() => {
          setChargedBoxes((prev) => prev.filter((i) => i !== boxToCharge));
        }, 700);
      }, idx * 65);
    });

    const focusTarget = Math.min(startIdx + pasted.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
  }, [value, onChange, length]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      lastSubmittedOtpRef.current = '';
      if (!value[index] && index > 0) {
        const next = [...value];
        next[index - 1] = '';
        onChange(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...value];
        next[index] = '';
        onChange(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [value, onChange, length]);

  // Exact center coordinate index for symmetric inward collapse: (length - 1) / 2
  const centerIndex = (length - 1) / 2;

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      {/* Dynamic ambient energy glow behind the input area */}
      <div className="relative w-full flex items-center justify-center">
        <motion.div
          animate={{
            opacity: isVerified ? [0.4, 0.8, 0.5] : isVerifying ? 0.45 : isError ? 0.35 : 0.15,
            scale: isVerified ? [1, 1.2, 1.05] : isVerifying ? 1.02 : 0.95,
          }}
          transition={{ duration: 1.5, repeat: isVerifying ? Infinity : 0, ease: 'easeInOut' }}
          className={`absolute inset-0 max-w-md mx-auto blur-3xl pointer-events-none rounded-full transition-colors duration-700 ${
            isError
              ? 'bg-rose-500/25'
              : isVerified
              ? 'bg-emerald-400/40'
              : isVerifying
              ? 'bg-cyan-500/20'
              : 'bg-neutral-300/20'
          }`}
        />

        {/* OTP Container for 6 individual standalone boxes & inward merge */}
        <motion.div
          ref={containerRef}
          animate={
            isError
              ? { x: [-10, 10, -8, 8, -4, 4, 0] }
              : {}
          }
          transition={{ duration: isError ? 0.45 : 0.6, ease: 'easeOut' }}
          className="relative z-10 flex items-center justify-center w-full min-h-[96px]"
        >
          {/* THE SEPARATE BOXES (Pinterest Style: standalone squares with gaps, NO outer capsule) */}
          <div className="relative flex items-center justify-center gap-2.5 sm:gap-3 p-1">
            {value.map((digit, index) => {
              const isCharged = chargedBoxes.includes(index);
              const isFocused = activeBoxIndex === index;
              // Horizontal slide distance directly into the center
              const targetX = (centerIndex - index) * pitch;

              return (
                <motion.div
                  key={index}
                  ref={(el) => {
                    boxWrapperRefs.current[index] = el;
                  }}
                  animate={{
                    x: isVerified ? targetX : 0,
                    opacity: isVerified ? [1, 1, 0] : 1,
                    scale: isVerified ? [1, 1, 0.9] : 1,
                  }}
                  transition={{
                    x: { duration: 0.46, ease: [0.32, 1.25, 0.45, 1] },
                    opacity: { times: [0, 0.72, 1], duration: 0.5 },
                    scale: { duration: 0.46, ease: [0.32, 1.25, 0.45, 1] },
                  }}
                  className="relative z-10 flex items-center justify-center rounded-2xl w-11 sm:w-13 h-14 sm:h-16"
                >
                  {/* Standalone Box Base */}
                  <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isError
                        ? 'bg-rose-50/50 border-2 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.18)]'
                        : isVerified
                        ? 'bg-white border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                        : isVerifying
                        ? 'bg-cyan-50/40 border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.25)]'
                        : isFocused
                        ? 'bg-white border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : digit
                        ? 'bg-white border-2 border-neutral-300 shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
                        : 'bg-neutral-50 border border-neutral-200/90 hover:border-neutral-300 shadow-sm'
                    }`}
                  />

                  {/* ELECTRIC BORDER BEAM on type/paste */}
                  <AnimatePresence>
                    {isCharged && !isVerified && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden p-[1.5px]"
                      >
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <defs>
                            <linearGradient id={`charge-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="50%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <motion.rect
                            x="2"
                            y="2"
                            width="96"
                            height="96"
                            rx="18"
                            stroke={`url(#charge-grad-${index})`}
                            strokeWidth="6"
                            strokeDasharray="40 60"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 0.65, ease: 'easeInOut' }}
                            style={{
                              filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.65))',
                            }}
                          />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Digit Input Field */}
                  <motion.input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    disabled={isVerifying || isVerified}
                    value={digit}
                    animate={{ opacity: isVerified ? 0 : 1 }}
                    transition={{ duration: 0.16 }}
                    onFocus={() => setActiveBoxIndex(index)}
                    onBlur={() => setActiveBoxIndex(null)}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(index, e)}
                    className={`relative z-20 w-full h-full text-center font-mono font-bold text-xl sm:text-2xl transition-colors outline-none bg-transparent caret-cyan-500 ${
                      isError
                        ? 'text-rose-600'
                        : digit
                        ? 'text-neutral-900 drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]'
                        : 'text-neutral-400'
                    } disabled:cursor-not-allowed`}
                  />

                  {/* Soft indicator dot if empty and not focused */}
                  {!digit && !isFocused && !isVerified && (
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-neutral-300 pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* TRẠNG THÁI GỘP THÀNH 1 Ô DUY NHẤT Ở CHÍNH GIỮA (PINTEREST STYLE) */}
          <AnimatePresence>
            {isVerified && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.32,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="relative flex items-center justify-center"
                >
                  {/* Hào quang rực sáng xung quanh ô duy nhất */}
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.85, 0.45] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-36 h-36 rounded-full bg-emerald-400/35 blur-2xl pointer-events-none"
                  />

                  {/* Hạt phát sáng (Sparkle particles) bung tỏa từ giữa ô */}
                  {[
                    { x: -38, y: -28, delay: 0.36 },
                    { x: 38, y: -26, delay: 0.40 },
                    { x: -32, y: 32, delay: 0.44 },
                    { x: 34, y: 30, delay: 0.38 },
                    { x: 0, y: -42, delay: 0.42 },
                  ].map((sp, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                      animate={{
                        x: sp.x,
                        y: sp.y,
                        opacity: [0, 1, 0],
                        scale: [0, 1.4, 0],
                      }}
                      transition={{
                        duration: 0.85,
                        delay: sp.delay,
                        ease: 'easeOut',
                      }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
                    />
                  ))}

                  {/* 1 Ô DUY NHẤT Ở GIỮA VỚI VIỀN LASER XOAY 360 ĐỘ */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-[0_0_40px_rgba(16,185,129,0.38),0_12px_30px_rgba(0,0,0,0.08)] border-2 border-emerald-400 flex items-center justify-center overflow-hidden">
                    {/* Viền laser xoay 360 độ quanh ô duy nhất */}
                    <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden p-[1.5px]">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                        className="w-[200%] h-[200%] -top-[50%] -left-[50%] absolute"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, #10b981 90deg, #34d399 180deg, #059669 270deg, transparent 360deg)',
                        }}
                      />
                      <div className="absolute inset-[2px] rounded-[22px] bg-white" />
                    </div>

                    {/* Checkmark SVG vẽ từ trái sang phải như trong video Pinterest */}
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 relative z-10"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <motion.path
                        d="M5 13l4.5 4.5L19 7"
                        stroke="#059669"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.45,
                          delay: 0.42,
                          ease: [0.65, 0, 0.35, 1],
                        }}
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* RITUAL STATUS & SENSORY FEEDBACK */}
      <div className="mt-4 min-h-[28px] flex items-center justify-center text-center">
        <AnimatePresence mode="popLayout">
          {isError ? (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 text-rose-600 text-xs sm:text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage || 'Mã OTP không chính xác. Vui lòng thử lại.'}</span>
            </motion.div>
          ) : isVerified ? (
            <motion.div
              key="verified-text"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-emerald-600 text-xs sm:text-sm font-semibold"
            >
              <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span>Khóa bảo mật hợp lệ. Đang mở chi tiết đơn hàng...</span>
            </motion.div>
          ) : isVerifying ? (
            <motion.div
              key="verifying-text"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-cyan-700 text-xs sm:text-sm font-semibold"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500/30 border-t-cyan-600"
              />
              <span className="tracking-wide">Đang hợp nhất và xác thực khóa bảo mật...</span>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-neutral-500 font-medium"
            >
              Dán hoặc nhập mã xác thực vào bất kỳ ô nào để phân phối tự động
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SettigationOtpInput;
