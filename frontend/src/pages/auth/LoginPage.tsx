import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';

// Custom inline SVG icons for Google and Apple
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
  </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.25-.57 2.95-1.39z" />
  </svg>
);

const Logo = ({ className }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 ${className || ''}`}>
    <img src="/images/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
  </Link>
);

// Background paths SVG
function FloatingPaths({ position }: { position: number }) {
  const paths = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.4 + i * 0.02,
      duration: 20 + Math.random() * 10,
    }));
  }, [position]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-[#99e300]"
        fill="none"
        viewBox="0 0 696 316"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            animate={{
              pathLength: 1,
              pathOffset: [0, 1, 0],
            }}
            d={path.d}
            initial={{ pathLength: 0.3 }}
            key={path.id}
            stroke="currentColor"
            strokeOpacity={0.08 + (path.id / 60) * 0.4}
            strokeWidth={path.width}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Reusable Form Components
const SocialIcons = () => (
  <div className="flex justify-start items-center gap-3.5">
    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Apple">
      <AppleIcon />
    </button>
    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Google">
      <GoogleIcon />
    </button>
    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Điện thoại">
      <Phone className="w-4 h-4" />
    </button>
  </div>
);

const SignInForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setAuth(data.token, data.user);
      
      if (data.user.role === 'customer') {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-sm mx-auto">
      <div className="flex justify-start">
        <Logo />
      </div>
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-wide">Đăng Nhập</h2>
        <p className="text-xs text-neutral-400">hoặc sử dụng tài khoản của bạn</p>
      </div>
      <SocialIcons />
      <form className="space-y-3.5" onSubmit={handleLogin}>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input
          type="text"
          placeholder="Tên đăng nhập hoặc Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
        />
        <div className="flex justify-end">
          <a href="#" className="text-neutral-400 hover:text-[#99e300] text-xs transition-colors">
            Quên mật khẩu?
          </a>
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
        </button>
      </form>
    </div>
  );
};

const SignUpForm = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:3001/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi đăng ký');
      }

      setMessage({ text: data.message || 'Đã gửi mã OTP về email.', type: 'success' });
      setStep(2); // Chuyển sang bước nhập OTP
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:3001/api/auth/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mã OTP không hợp lệ');
      }

      setMessage({ text: 'Đăng ký thành công! Bạn có thể đăng nhập.', type: 'success' });
      setStep(3);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-sm mx-auto">
      <div className="flex justify-start">
        <Logo />
      </div>
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-wide">Tạo Tài Khoản</h2>
        <p className="text-xs text-neutral-400">hoặc sử dụng email để đăng ký</p>
      </div>
      <SocialIcons />
      
      {message.text && (
        <div className={`text-sm p-3 rounded-lg border ${message.type === 'success' ? 'bg-[#99e300]/10 border-[#99e300]/30 text-[#99e300]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
          {message.text}
        </div>
      )}

      {step === 1 && (
        <form className="space-y-3.5" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'ĐANG GỬI MÃ OTP...' : 'ĐĂNG KÝ'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-3.5" onSubmit={handleVerifyOTP}>
          <div className="text-sm text-white/80 mb-2">
            Mã OTP 6 số đã được gửi tới <strong>{email}</strong>
          </div>
          <input
            type="text"
            placeholder="Nhập mã OTP..."
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors text-center text-xl tracking-widest font-mono"
          />
          <button 
            type="submit" 
            disabled={isLoading || otp.length < 6}
            className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC OTP'}
          </button>
          <button 
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-xs text-white/40 hover:text-white transition-colors mt-2"
          >
            Sửa địa chỉ email
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <p className="text-white/60 text-sm mb-4">Tài khoản của bạn đã sẵn sàng.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
          >
            CHUYỂN SANG ĐĂNG NHẬP
          </button>
        </div>
      )}
    </div>
  );
};

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030303] overflow-hidden relative selection:bg-black selection:text-white font-sans text-white p-4">

      {/* Background Ambient Lines */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Decorative Glow */}
      <div aria-hidden className="absolute inset-0 isolate z-0 opacity-40 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(153,227,0,0.08)_0%,_transparent_70%)]" />
      </div>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors z-[300] font-semibold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Trang chủ
      </Link>

      {/* 
        ========================================================================
        DESKTOP VIEW: SLIDING PANELS (md:block hidden)
        ========================================================================
      */}
      <div className="hidden md:block relative w-full max-w-[850px] min-h-[520px] bg-black/0 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10">
        
        {/* SIGN IN FORM (Left Side) */}
        <motion.div
          initial={false}
          animate={{
            x: isSignUp ? '100%' : '0%',
            opacity: isSignUp ? 0 : 1,
            filter: isSignUp ? 'blur(10px)' : 'blur(0px)',
            zIndex: isSignUp ? 1 : 10
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 w-1/2 h-full p-12 flex flex-col justify-center"
        >
          <SignInForm />
        </motion.div>

        {/* SIGN UP FORM (Moves to Right Side) */}
        <motion.div
          initial={false}
          animate={{
            x: isSignUp ? '100%' : '0%',
            opacity: isSignUp ? 1 : 0,
            filter: isSignUp ? 'blur(0px)' : 'blur(10px)',
            zIndex: isSignUp ? 10 : 1
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 w-1/2 h-full p-12 flex flex-col justify-center"
        >
          <SignUpForm />
        </motion.div>

        {/* OVERLAY PANEL (Slides left and right) */}
        <motion.div
          initial={false}
          animate={{ x: isSignUp ? '-100%' : '0%' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-[50%] w-1/2 h-full bg-white/[0.02] border-x border-white/10 overflow-hidden z-20 flex items-center justify-center backdrop-blur-2xl"
        >
          {/* Subtle design element inside overlay */}
          <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] rounded-full bg-[#99e300]/[0.02] border border-[#99e300]/[0.05]" />

          {/* OVERLAY SIGN IN PROMPT (Shown when isSignUp is true, Overlay is on Left) */}
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="prompt-signin"
                initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col justify-center items-center p-10 text-center"
              >
                <h2 className="text-[3.5rem] leading-none font-apple-greeting text-white mb-4">welcome</h2>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-[260px] mb-8 mt-2">
                  Để tiếp tục kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn.
                </p>
                <button
                  onClick={() => setIsSignUp(false)}
                  className="w-[160px] h-11 rounded-lg border border-[#99e300] text-[#99e300] hover:bg-[#99e300] hover:text-black font-semibold text-sm tracking-wider cursor-pointer transition-all duration-300 active:scale-95"
                >
                  ĐĂNG NHẬP
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OVERLAY SIGN UP PROMPT (Shown when isSignUp is false, Overlay is on Right) */}
          <AnimatePresence mode="wait">
            {!isSignUp && (
              <motion.div
                key="prompt-signup"
                initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col justify-center items-center p-10 text-center"
              >
                <h2 className="text-[3.5rem] leading-none font-apple-greeting text-white mb-4">hello</h2>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-[260px] mb-8 mt-2">
                  Nhập thông tin cá nhân của bạn và đăng ký tài khoản để bắt đầu hành trình cùng chúng tôi.
                </p>
                <button
                  onClick={() => setIsSignUp(true)}
                  className="w-[160px] h-11 rounded-lg border border-[#99e300] text-[#99e300] hover:bg-[#99e300] hover:text-black font-semibold text-sm tracking-wider cursor-pointer transition-all duration-300 active:scale-95"
                >
                  ĐĂNG KÝ
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* 
        ========================================================================
        MOBILE VIEW: STACKED (md:hidden block)
        ========================================================================
      */}
      <div className="md:hidden flex flex-col relative w-full max-w-[400px] bg-black/0 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10">
        <div className="p-8 pb-4">
          {isSignUp ? <SignUpForm /> : <SignInForm />}
        </div>
        
        <div className="bg-white/[0.02] border-t border-white/10 p-8 flex flex-col items-center text-center backdrop-blur-2xl">
          {isSignUp ? (
            <>
              <h2 className="text-4xl font-apple-greeting text-white mb-2">welcome</h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-[260px] mb-4 mt-2">
                Đăng nhập để tiếp tục kết nối với chúng tôi.
              </p>
              <button
                onClick={() => setIsSignUp(false)}
                className="w-[160px] h-10 rounded-lg border border-[#99e300] text-[#99e300] hover:bg-[#99e300] hover:text-black font-semibold text-sm tracking-wider cursor-pointer transition-all duration-300 active:scale-95"
              >
                ĐĂNG NHẬP
              </button>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-apple-greeting text-white mb-2">hello</h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-[260px] mb-4 mt-2">
                Đăng ký tài khoản để bắt đầu hành trình cùng chúng tôi.
              </p>
              <button
                onClick={() => setIsSignUp(true)}
                className="w-[160px] h-10 rounded-lg border border-[#99e300] text-[#99e300] hover:bg-[#99e300] hover:text-black font-semibold text-sm tracking-wider cursor-pointer transition-all duration-300 active:scale-95"
              >
                ĐĂNG KÝ
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
