'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronDown, Check, ArrowLeft, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  // Registration form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP 2-step verification states
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en', name: 'English', flag: '🇬🇧' });
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'google_config_missing') {
        setError('Google OAuth credentials not configured in .env.local yet. See .env.example for quick setup.');
      } else if (err) {
        setError(`Authentication error: ${err.replace(/_/g, ' ')}`);
      }
    }
  }, []);

  // Cooldown timer effect for Resend Code
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
  ];

  // Step 1: Send OTP to Email
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setPreviewCode(data.previewCode || '');
      setResendCooldown(60);
      setSuccessMsg(`We sent a 5-digit verification code to ${email.trim().toLowerCase()}`);
      setIsLoading(false);

      // Focus first OTP input on transition
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      console.error(err);
      setError('Network error. Failed to send verification code.');
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP Input Changes (auto-advance, backspace, paste)
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // User pasted multiple characters into this input
      const pasted = cleanVal.slice(0, 5).split('');
      pasted.forEach((char, i) => {
        if (i < 5) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 4);
      otpInputRefs.current[focusIndex]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (cleanVal && index < 4) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move back to previous box on backspace if current is empty
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    pastedData.split('').forEach((char, i) => {
      if (i < 5) newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    const focusTarget = Math.min(pastedData.length, 4);
    otpInputRefs.current[focusTarget]?.focus();
  };

  // Step 3: Verify OTP and proceed to Onboarding
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length < 5) {
      setError('Please enter the complete 5-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullCode,
          name: name.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid verification code. Please check and try again.');
        setIsVerifying(false);
        return;
      }

      // Update client AppContext profile with new user credentials
      updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        onboardingCompleted: false, // First time user!
      });

      // Clear onboarded flag for this new user so onboarding renders
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`highscholar_onboarded_${email.trim().toLowerCase()}`);
      }

      setIsVerifying(false);

      // Redirect immediately to Onboarding
      router.push('/onboarding');
    } catch (err) {
      console.error(err);
      setError('Network error during verification. Please try again.');
      setIsVerifying(false);
    }
  };

  // Resend OTP code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewCode(data.previewCode || '');
        setResendCooldown(60);
        setSuccessMsg(`A new code was sent to ${email}`);
        setOtpDigits(['', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    setError('');
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Hero Banner Card */}
      <div className="w-full lg:w-[48%] xl:w-[46%] p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden w-full h-full min-h-[540px] lg:min-h-[calc(100vh-64px)] shadow-xl select-none flex flex-col justify-between p-7 sm:p-10 lg:p-12 text-white">
          
          {/* Background Graduation Photo */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/login-bg-clean.png')` }}
          />

          {/* Dark Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

          {/* Top: Live Official HighScholar Brand Logo & Text */}
          <div className="relative z-10 flex items-center gap-2.5">
            <img 
              src="/highscholar-logo-white.png" 
              alt="HighScholar Logo" 
              className="w-7 h-7 object-contain shrink-0" 
            />
            <span className="font-extrabold text-white text-xl tracking-tight">
              HighScholar
            </span>
          </div>

          {/* Bottom: Live Headline & Description Typography */}
          <div className="relative z-10 max-w-md">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs text-white mb-3 border border-white/20">
              🎓 Global Higher Ed Network
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
              Discover fully funded scholarships &amp; faculty labs
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed mt-3 font-normal drop-shadow-xs">
              Connect directly with universities offering $0 tuition, guaranteed graduate assistantships, and actively recruiting professors worldwide.
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Full Height Canvas with Background Shapes & Form/OTP Card */}
      <div className="flex-1 relative flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto bg-white">
        
        {/* Two Chevron Background Vectors */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <svg 
            className="absolute inset-0 w-full h-full object-cover" 
            viewBox="0 0 815 835" 
            preserveAspectRatio="none"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0 60 L407 260 L815 60 L815 220 L407 420 L0 220 Z" 
              fill="#F4F1FD" 
              opacity="0.85"
            />
            <path 
              d="M0 450 L407 650 L815 450 L815 610 L407 810 L0 610 Z" 
              fill="#F4F1FD" 
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Floating White Card */}
        <div className="relative z-10 w-full max-w-[460px] bg-white rounded-[24px] sm:rounded-[28px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(113,80,231,0.06)] border border-[#EAECF0]/80 my-auto">
          
          {step === 'form' ? (
            /* STEP 1: Registration Form */
            <>
              {/* Header */}
              <div className="mb-5">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#101828] tracking-tight">
                  Create an account
                </h1>
                <p className="text-xs sm:text-sm text-[#475467] mt-1 font-normal">
                  Join HighScholar to start your scholarship radar
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-11 bg-white hover:bg-slate-50 active:scale-[0.99] border border-[#D0D5DD] hover:border-[#7150E7] text-xs sm:text-sm font-semibold text-[#344054] rounded-xl transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-[#7150E7] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isGoogleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#EAECF0]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#98A2B3] font-medium uppercase tracking-wider text-[10px]">
                    Or sign up with email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleInitiateSignup} className="space-y-3.5">
                {/* Full Name Input */}
                <div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="w-full h-11 px-4 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full h-11 px-4 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min 6 chars)"
                    required
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password Input */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Agree Terms Checkbox */}
                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#7150E7] focus:ring-[#7150E7] border-[#D0D5DD] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-[#475467] leading-tight select-none cursor-pointer">
                    I agree to HighScholar&apos;s <span className="text-[#7150E7] font-medium underline">Terms of Service</span> and <span className="text-[#7150E7] font-medium underline">Privacy Policy</span>.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-11 bg-[#6941C6] hover:bg-[#5925DC] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending verification code...</span>
                      </div>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Already have an account link */}
              <div className="pt-4 text-center">
                <p className="text-xs text-[#475467]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#7150E7] hover:text-[#5925DC] font-semibold transition-colors">
                    Log in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* STEP 2: 5-Digit OTP Verification Screen */
            <div className="animate-in fade-in duration-200">
              {/* Back to Edit form button */}
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#101828] mb-4 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change details</span>
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F1FD] flex items-center justify-center mb-3 text-[#7150E7]">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-[#101828] tracking-tight">
                  Verify your email
                </h1>
                <p className="text-xs sm:text-sm text-[#475467] mt-1.5 leading-relaxed">
                  We sent a 5-digit verification code to <span className="font-semibold text-[#101828]">{email}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {successMsg && !error && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Developer Demo Preview Code Callout */}
              {previewCode && (
                <div className="mb-5 p-3 rounded-xl bg-[#F9F5FF] border border-[#E9D7FE] flex items-center justify-between text-xs text-[#6941C6]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7150E7] shrink-0" />
                    <span>
                      Demo code: <strong className="font-mono text-sm tracking-wider text-[#7150E7]">{previewCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = previewCode.slice(0, 5).split('');
                      setOtpDigits(chars);
                    }}
                    className="text-[11px] underline font-semibold cursor-pointer hover:text-[#5925DC]"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {/* 5-Digit Inputs Row */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-2.5">
                    Enter 5-digit security code
                  </label>
                  <div className="flex items-center justify-between gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-13 h-14 sm:w-14 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:border-[#7150E7] focus:ring-2 focus:ring-[#7150E7]/25 focus:outline-hidden transition-all shadow-2xs"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying || otpDigits.join('').length < 5}
                  className="w-full h-11 bg-[#6941C6] hover:bg-[#5925DC] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying code...</span>
                    </div>
                  ) : (
                    <span>Verify &amp; Continue</span>
                  )}
                </button>

                {/* Resend Code Section */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#667085]">Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-[#7150E7] hover:text-[#5925DC] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bottom Language Selector */}
          <div className="pt-5 border-t border-[#EAECF0] mt-5 flex items-center justify-start relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="h-8 px-2.5 rounded-lg hover:bg-slate-100/80 text-xs font-medium text-[#344054] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-sm leading-none">{selectedLanguage.flag}</span>
                <span>{selectedLanguage.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#667085] transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-44 bg-white rounded-2xl border border-[#E4E7EC] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        selectedLanguage.code === lang.code
                          ? 'bg-[#F4F3FE] text-[#7150E7] font-semibold'
                          : 'text-[#344054] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {selectedLanguage.code === lang.code && (
                        <Check className="w-3.5 h-3.5 text-[#7150E7]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
