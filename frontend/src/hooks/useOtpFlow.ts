import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

export type OtpPhase = 'idle' | 'verifying' | 'success' | 'error';

export interface UseOtpFlowOptions {
  length?: number;
  onVerify: (code: string) => Promise<void>;
  onResend?: () => void | Promise<void>;
  resendCooldown?: number;
  autoFocus?: boolean;
}

export function useOtpFlow({
  length = 4,
  onVerify,
  onResend,
  resendCooldown = 28,
  autoFocus = true,
}: UseOtpFlowOptions) {
  const [code, setCode] = useState<string[]>(() => Array(length).fill(''));
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [phase, setPhase] = useState<OtpPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [chargedIdx, setChargedIdx] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(resendCooldown);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastSubmittedCode = useRef<string>('');

  // Synchronize array size if length changes
  useEffect(() => {
    setCode((prev) => {
      if (prev.length === length) return prev;
      return Array(length).fill('').map((_, i) => prev[i] || '');
    });
  }, [length]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto focus first input on mount
  useEffect(() => {
    if (autoFocus && phase === 'idle') {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, phase]);

  // TanStack Query useMutation for verification API gate
  const verifyMutation = useMutation({
    mutationFn: async (fullCode: string) => {
      return await onVerify(fullCode);
    },
    onSuccess: () => {
      setErrorMessage(null);
      setPhase('success');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.';
      setErrorMessage(msg);
      setPhase('error');
      setIsShaking(true);

      // Error animation sequence: shake ~300ms, then reset code & focus box 0
      setTimeout(() => {
        setIsShaking(false);
        setCode(Array(length).fill(''));
        lastSubmittedCode.current = '';
        setActiveIdx(0);
        inputRefs.current[0]?.focus();
      }, 350);

      // Return to idle state for next entry
      setTimeout(() => {
        setPhase('idle');
      }, 1500);
    },
  });

  // Watch for full code entry -> trigger mutation
  const fullCode = code.join('');
  const isFilled = code.every((char) => char.length === 1);

  useEffect(() => {
    if (
      isFilled &&
      fullCode.length === length &&
      phase === 'idle' &&
      lastSubmittedCode.current !== fullCode
    ) {
      lastSubmittedCode.current = fullCode;
      setPhase('verifying');
      verifyMutation.mutate(fullCode);
    }
  }, [isFilled, fullCode, phase, length, verifyMutation]);

  // Handle single character change
  const handleDigitChange = useCallback(
    (index: number, rawValue: string) => {
      if (phase === 'verifying' || phase === 'success') return;

      const digits = rawValue.replace(/\D/g, '');
      const char = digits.slice(-1);

      setCode((prev) => {
        const next = [...prev];
        next[index] = char;
        return next;
      });
      lastSubmittedCode.current = '';
      if (errorMessage) setErrorMessage(null);

      if (char) {
        // Trigger perimeter light beam
        setChargedIdx(index);
        setTimeout(() => setChargedIdx((curr) => (curr === index ? null : curr)), 700);

        // Advance to next box
        if (index < length - 1) {
          setActiveIdx(index + 1);
          inputRefs.current[index + 1]?.focus();
        }
      }
    },
    [length, phase, errorMessage]
  );

  // Handle keyboard events (backspace, arrows)
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (phase === 'verifying' || phase === 'success') return;

      if (e.key === 'Backspace') {
        lastSubmittedCode.current = '';
        if (!code[index] && index > 0) {
          setCode((prev) => {
            const next = [...prev];
            next[index - 1] = '';
            return next;
          });
          setActiveIdx(index - 1);
          inputRefs.current[index - 1]?.focus();
        } else {
          setCode((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
          });
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        setActiveIdx(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        setActiveIdx(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code, length, phase]
  );

  // Handle paste full code into any box
  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (phase === 'verifying' || phase === 'success') return;

      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;

      setCode((prev) => {
        const next = [...prev];
        const start = pasted.length === length ? 0 : index;
        for (let i = 0; i < pasted.length && start + i < length; i++) {
          next[start + i] = pasted[i];
        }
        return next;
      });
      lastSubmittedCode.current = '';

      const targetFocus = Math.min(
        (pasted.length === length ? 0 : index) + pasted.length,
        length - 1
      );
      setActiveIdx(targetFocus);
      inputRefs.current[targetFocus]?.focus();
    },
    [length, phase]
  );

  // Explicit Clipboard Paste Action Button
  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, length);
      if (!digits) return;

      setCode(() => {
        const next = Array(length).fill('');
        for (let i = 0; i < digits.length; i++) {
          next[i] = digits[i];
        }
        return next;
      });
      lastSubmittedCode.current = '';
      const focusTarget = Math.min(digits.length, length - 1);
      setActiveIdx(focusTarget);
      inputRefs.current[focusTarget]?.focus();
    } catch {
      // Clipboard access denied or unsupported
    }
  }, [length]);

  // Resend action
  const triggerResend = useCallback(async () => {
    if (countdown > 0 || phase === 'verifying') return;
    setCountdown(resendCooldown);
    setCode(Array(length).fill(''));
    lastSubmittedCode.current = '';
    setActiveIdx(0);
    inputRefs.current[0]?.focus();
    if (onResend) {
      await onResend();
    }
  }, [countdown, phase, resendCooldown, length, onResend]);

  return {
    code,
    activeIdx,
    setActiveIdx,
    phase,
    setPhase,
    errorMessage,
    isShaking,
    chargedIdx,
    countdown,
    canResend: countdown === 0,
    inputRefs,
    handleDigitChange,
    handleKeyDown,
    handlePaste,
    pasteFromClipboard,
    triggerResend,
  };
}
export default useOtpFlow;
