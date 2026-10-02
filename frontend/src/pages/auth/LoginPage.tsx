import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Eye, EyeOff } from 'lucide-react';
import { AuthOtpVerification } from '../../components/auth/AuthOtpVerification';

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
const SocialIcons = ({ onProviderClick }: { onProviderClick?: (provider: string) => void }) => (
  <div className="flex justify-start items-center gap-3.5">
    <button type="button" onClick={() => onProviderClick?.('Apple')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Đăng nhập bằng Apple">
      <AppleIcon />
    </button>
    <button type="button" onClick={() => onProviderClick?.('Google')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Đăng nhập bằng Google">
      <GoogleIcon />
    </button>
    <button type="button" onClick={() => onProviderClick?.('Số điện thoại')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/10 hover:text-[#99e300] active:scale-95 transition-all" aria-label="Đăng nhập bằng Điện thoại">
      <Phone className="w-4 h-4" />
    </button>
  </div>
);

const ForgotPasswordFlow = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'idle' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setMessage({ text: 'Vui lòng nhập định dạng email hợp lệ.', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: 'idle' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/customer/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.');
      }
      
      setMessage({ text: data.message, type: 'success' });
      setStep(2);
    } catch (error: any) {
      setMessage({ text: error.message || 'Đã xảy ra lỗi hệ thống.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: 'idle' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/customer/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), resetToken, newPassword })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu.');
      }
      
      setStep(4);
      setMessage({ text: data.message, type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Đã xảy ra lỗi hệ thống.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-start">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </button>
      </div>

      {step === 1 && (
        <>
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-bold tracking-wide">Quên mật khẩu?</h2>
            <p className="text-xs text-neutral-400">Nhập email đã đăng ký để nhận mã xác thực và đặt lại mật khẩu.</p>
          </div>
          <form className="space-y-3.5" onSubmit={handleRequestOTP}>
            {message.type === 'error' && <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg">{message.text}</div>}
            <div>
              <input
                type="email"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMessage({ text: '', type: 'idle' }); }}
                autoComplete="email"
                className={`w-full h-10 px-4 bg-white/5 border ${message.type === 'error' ? 'border-red-500' : 'border-white/10'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors`}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'ĐANG GỬI MÃ...' : 'GỬI MÃ XÁC THỰC'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <AuthOtpVerification 
          email={email} 
          purpose="forgot-password" 
          onVerified={(token) => {
            if (token) setResetToken(token);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <>
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-bold tracking-wide">Đặt lại mật khẩu</h2>
            <p className="text-xs text-neutral-400">Tạo mật khẩu mới cho tài khoản của bạn.</p>
          </div>
          <form className="space-y-3.5" onSubmit={handleResetPassword}>
            {message.type === 'error' && <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg">{message.text}</div>}
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setMessage({ text: '', type: 'idle' }); }}
                className="w-full h-10 pl-4 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setMessage({ text: '', type: 'idle' }); }}
                className="w-full h-10 pl-4 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#99e300] focus:border-[#99e300] transition-colors"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'ĐANG LƯU...' : 'ĐẶT LẠI MẬT KHẨU'}
            </button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#99e300]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#99e300]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-wide mb-2">Đặt lại mật khẩu thành công</h2>
          <p className="text-white/60 text-sm mb-6">Mật khẩu của bạn đã được cập nhật.</p>
          <button 
            onClick={onBack}
            className="w-full h-10 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm transition-colors cursor-pointer"
          >
            ĐĂNG NHẬP
          </button>
        </div>
      )}
    </div>
  );
};

const SignInForm = () => {
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ field?: string, message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [socialMessage, setSocialMessage] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSocialClick = (provider: string) => {
    setSocialMessage(`Tính năng đăng nhập bằng ${provider} hiện chưa được cấu hình.`);
    setTimeout(() => setSocialMessage(''), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError({ field: 'username', message: 'Vui lòng nhập tên đăng nhập hoặc email.' });
      return;
    }
    if (!password.trim()) {
      setError({ field: 'password', message: 'Vui lòng nhập mật khẩu.' });
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 400 || response.status === 404) {
           throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
        } else if (response.status === 403) {
           throw new Error('Tài khoản của bạn hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.');
        }
        throw new Error(data.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      }

      setAuth(data.token, data.user);
      
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      
      if (returnUrl) {
         navigate(returnUrl);
      } else if (data.user.role === 'customer') {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
         setError({ message: 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.' });
      } else {
         setError({ message: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'forgot_password') {
    return <ForgotPasswordFlow onBack={() => setView('login')} />;
  }

  return (
    <div className="space-y-5 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex justify-start">
        <Logo />
      </div>
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-wide">Đăng Nhập</h2>
        <p className="text-xs text-neutral-400">hoặc sử dụng tài khoản của bạn</p>
      </div>
      <SocialIcons onProviderClick={handleSocialClick} />
      {socialMessage && <div className="text-amber-500 text-xs bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg">{socialMessage}</div>}
      <form className="space-y-3.5" onSubmit={handleLogin}>
        {error && !error.field && <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg">{error.message}</div>}
        
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            autoComplete="username"
            className={`w-full h-10 px-4 bg-white/5 border ${error?.field === 'username' ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
          />
          {error?.field === 'username' && <p className="text-xs text-red-500">{error.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="current-password"
              className={`w-full h-10 pl-4 pr-10 bg-white/5 border ${error?.field === 'password' ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error?.field === 'password' && <p className="text-xs text-red-500">{error.message}</p>}
        </div>

        <div className="flex justify-end items-center">
          <button type="button" onClick={() => setView('forgot_password')} className="text-neutral-400 hover:text-[#99e300] text-xs transition-colors">
            Quên mật khẩu?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-10 mt-1 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ĐANG ĐĂNG NHẬP...
            </>
          ) : 'ĐĂNG NHẬP'}
        </button>
      </form>
    </div>
  );
};

const SignUpForm = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-transparent' };
    if (pass.length < 6) return { label: 'Yếu', color: 'bg-red-500', text: 'text-red-500' };
    if (pass.length < 10 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) return { label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Mạnh', color: 'bg-[#99e300]', text: 'text-[#99e300]' };
  };

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage({ text: '', type: '' });
    
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!username.trim() || username.includes(' ')) {
      newErrors.username = 'Tên đăng nhập không hợp lệ (không chứa khoảng trắng).';
      hasError = true;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ.';
      hasError = true;
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
      hasError = true;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
      hasError = true;
    }
    if (!agreed) {
      newErrors.agreed = 'Bạn phải đồng ý với Điều khoản sử dụng.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.message.includes('đăng nhập')) {
           newErrors.username = data.message;
           setErrors(newErrors);
           throw new Error('');
        }
        if (response.status === 409 && data.message.includes('Email')) {
           newErrors.email = data.message;
           setErrors(newErrors);
           throw new Error('');
        }
        throw new Error(data.message || 'Dữ liệu đăng ký không hợp lệ.');
      }

      setMessage({ text: data.message || 'Đã gửi mã OTP về email.', type: 'success' });
      setStep(2);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
         setMessage({ text: 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.', type: 'error' });
      } else if (err.message) {
         setMessage({ text: err.message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-start">
        <Logo />
      </div>
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-wide">Tạo Tài Khoản</h2>
        <p className="text-xs text-neutral-400">Đăng ký để nhận các ưu đãi tốt nhất</p>
      </div>
      
      {message.text && (
        <div className={`text-sm p-3 rounded-lg border ${message.type === 'success' ? 'bg-[#99e300]/10 border-[#99e300]/30 text-[#99e300]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
          {message.text}
        </div>
      )}

      {step === 1 && (
        <form className="space-y-3.5" onSubmit={handleRegister}>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({...prev, username: ''})); }}
              className={`w-full h-10 px-4 bg-white/5 border ${errors.username ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
          </div>

          <div className="space-y-1">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: ''})); }}
              className={`w-full h-10 px-4 bg-white/5 border ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: ''})); }}
                className={`w-full h-10 pl-4 pr-10 bg-white/5 border ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="flex items-center gap-2 mt-1 px-1">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.label === 'Yếu' ? '33%' : strength.label === 'Trung bình' ? '66%' : '100%' }} />
                </div>
                <span className={`text-[10px] font-medium ${strength.text}`}>{strength.label}</span>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({...prev, confirmPassword: ''})); }}
                className={`w-full h-10 pl-4 pr-10 bg-white/5 border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-[#99e300] focus:border-[#99e300]'} rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 transition-colors`}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2 cursor-pointer group mt-2">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors(prev => ({...prev, agreed: ''})); }} className="peer sr-only" />
                <div className={`w-4 h-4 border rounded bg-white/5 transition-colors ${errors.agreed ? 'border-red-500' : 'border-white/20 peer-checked:bg-[#99e300] peer-checked:border-[#99e300]'}`}></div>
                <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-xs text-neutral-400 group-hover:text-white transition-colors leading-snug">Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật</span>
            </label>
            {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-10 mt-2 rounded-lg bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold text-sm tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(153,227,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ĐANG GỬI...
              </>
            ) : 'ĐĂNG KÝ'}
          </button>
        </form>
      )}

      {step === 2 && (
        <AuthOtpVerification 
          email={email} 
          purpose="register" 
          onVerified={() => {
            setMessage({ text: 'Đăng ký thành công! Bạn có thể đăng nhập bằng tên đăng nhập.', type: 'success' });
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
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
