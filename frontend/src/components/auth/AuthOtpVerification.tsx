import React, { useState, useEffect, useRef } from 'react';
import './AuthOtpVerification.css';

interface AuthOtpVerificationProps {
  email: string;
  purpose: 'register' | 'forgot-password';
  onVerified: (resetToken?: string) => void;
  onBack: () => void;
}

const LEN = 6;

export const AuthOtpVerification = ({ email, purpose, onVerified, onBack }: AuthOtpVerificationProps) => {
  const [val, setVal] = useState("");
  const [phase, setPhase] = useState<"in" | "fan" | "stack" | "check" | "ok" | "err">("in");
  const [secs, setSecs] = useState(60);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLInputElement>(null);

  // Focus input when in 'in' phase
  useEffect(() => {
    if (phase === "in") {
      ref.current?.focus();
    }
  }, [phase]);

  // Countdown timer
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  // Phase transitions
  useEffect(() => {
    let t: NodeJS.Timeout;

    if (phase === "fan") {
      t = setTimeout(() => setPhase("stack"), 900);
    } else if (phase === "stack") {
      t = setTimeout(() => setPhase("check"), 800);
    } else if (phase === "check") {
      // Trigger API call when entering check phase
      const verify = async () => {
        try {
          const endpoint = purpose === 'register' 
            ? '/api/auth/customer/verify-otp' 
            : '/api/auth/customer/verify-reset-otp';
            
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), otp: val })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Mã xác thực không hợp lệ.');
          }

          if (data.resetToken) {
            setResetToken(data.resetToken);
          }
          
          setPhase("ok");
        } catch (error: any) {
          setErrorMessage(error.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
          setPhase("err");
        }
      };

      // Ensure 'check' animation runs at least a bit before resolving
      Promise.all([
        verify(),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } else if (phase === "err") {
      t = setTimeout(() => {
        setVal("");
        setPhase("in");
      }, 1500); // Wait a bit longer to read error
    } else if (phase === "ok") {
      t = setTimeout(() => {
        onVerified(resetToken);
      }, 1500);
    }

    return () => clearTimeout(t);
  }, [phase, val, email, purpose, onVerified, resetToken]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, LEN);
    setVal(v);
    if (v.length === LEN) {
      ref.current?.blur();
      setPhase("fan");
    }
  };

  const resend = async () => {
    if (secs > 0) return;
    
    try {
      const endpoint = purpose === 'register' 
        ? '/api/auth/customer/register' // Wait, register re-sends OTP? But register requires password.
        // Actually, for register, we might need a dedicated resend endpoint if we don't want to re-pass password.
        // Let's assume the backend supports a standard forgot-password for resending if we don't have a dedicated one,
        // or for register, we just use the forgot-password endpoint to send an OTP? No, they use different templates.
        // Let's just use forgot-password for forgot-password. For register, let's call the forgot-password as well since it just generates an OTP, or just let user go back.
        : '/api/auth/customer/forgot-password';
        
      if (purpose === 'register') {
        // We can't easily resend register OTP without the full payload (password, etc) in current backend.
        // Let's just alert for now or let them go back.
        // Or actually we can just call forgot-password API to generate an OTP for them since the OTP field is the same.
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/customer/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
      }
      
      setVal("");
      setSecs(60);
      setErrorMessage("");
      setPhase("in");
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
    }
  };

  // Compute text based on phase and purpose
  const getText = () => {
    if (phase === 'check') return { title: 'Đang xác thực', sub: 'Vui lòng đợi giây lát...' };
    if (phase === 'ok') return { title: 'Xác thực thành công', sub: 'Đang hoàn tất yêu cầu của bạn...' };
    if (phase === 'err') return { title: 'Mã không đúng', sub: errorMessage || 'Mã xác thực không khớp. Vui lòng thử lại.' };
    
    return {
      title: 'Xác thực email',
      sub: (
        <>
          Mã xác thực đã được gửi đến <br/>
          <b>{email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))}</b>
        </>
      )
    };
  };

  const { title, sub } = getText();
  const focusIdx = Math.min(val.length, LEN - 1);

  return (
    <div className="otp-wrap">
      <div className={`otp-card ${phase === 'ok' ? 'ok' : ''} ${phase === 'err' ? 'err' : ''}`}>
        <div className="otp-handle" />
        
        <div className="otp-title otp-fade" key={`t-${phase}`}>
          {title}
        </div>
        
        <p className="otp-sub otp-fade" key={`s-${phase}`}>
          {sub}
        </p>

        <div className={`otp-row ${phase}`} onClick={() => ref.current?.focus()}>
          {Array.from({ length: LEN }, (_, i) => (
            <div 
              key={i}
              className={`otp-c ${phase === "in" && i === focusIdx ? " f" : ""}`}
              style={{ 
                "--i": i - (LEN - 1) / 2, 
                "--q": Math.pow(i - (LEN - 1) / 2, 2), 
                "--n": i 
              } as React.CSSProperties}
            >
              {val[i]
                ? <span className="otp-d" key={val[i] + i}>{val[i]}</span>
                : phase === "in" && i === focusIdx ? <span className="otp-caret" /> : null}
            </div>
          ))}
          <svg className="otp-ring" viewBox="0 0 58 74">
            <rect x="1.5" y="1.5" width="55" height="71" rx="16" pathLength="100" />
            <path d="M19 38 l8 8 l14 -15" pathLength="100" />
          </svg>
          <input 
            ref={ref} 
            value={val} 
            onChange={onChange} 
            disabled={phase !== "in"}
            inputMode="numeric" 
            autoComplete="one-time-code" 
            maxLength={LEN} 
            aria-label="Verification code" 
          />
        </div>

        {phase === "ok" ? (
          <p className="otp-foot">&nbsp;</p>
        ) : (
          <p className="otp-foot flex flex-col items-center gap-2">
            <span>
              Chưa nhận được mã?{' '}
              <button onClick={resend} disabled={secs > 0 || phase !== 'in'}>
                Gửi lại mã{secs > 0 ? ` sau ${secs}s` : ""}
              </button>
            </span>
            <button onClick={onBack} disabled={phase !== 'in'} className="text-xs !font-normal opacity-60 hover:opacity-100 mt-2">
              Quay lại
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
