'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Mail, RefreshCw, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  // Registration form states (Node 167:2884: Email, Password, Confirm Password, Terms)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP 2-step verification states
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Step 1: Send OTP to Email
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      // Derive default user name from email prefix (e.g. john.doe -> John Doe)
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: derivedName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setResendCooldown(60);
      setSuccessMsg(`We sent a 5-digit verification code to ${email.trim().toLowerCase()}. Please check your inbox.`);
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
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
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

    if (cleanVal && index < 4) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
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
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullCode,
          name: derivedName,
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
        name: derivedName,
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
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: derivedName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
        setSuccessMsg(`A new code was sent to ${email}. Please check your inbox.`);
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
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Full Bleed Graduation Hero Banner (Node 167:2954)            */}
      {/* Specs: Width 810px / 46.88%, Full height, high-res graduate visual        */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[47%] xl:w-[46.88%] h-[320px] sm:h-[400px] lg:h-screen relative overflow-hidden select-none shrink-0">
        <img
          src="/login-figma-banner.jpg"
          alt="HighScholar Graduate Celebration"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Canvas with Faint Chevron Watermark + Floating Signup Card */}
      {/* ========================================================================= */}
      <div className="flex-1 relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white">
        
        {/* Faint Background Watermark Vectors (Figma Nodes 167:2885 & 167:2886) */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
          aria-hidden="true"
        >
          <img
            src="/login-chevron-top.svg"
            alt=""
            className="absolute -right-10 top-0 w-[820px] max-w-none opacity-[0.035] pointer-events-none"
          />
          <img
            src="/login-chevron-bottom.svg"
            alt=""
            className="absolute -right-10 bottom-0 w-[820px] max-w-none opacity-[0.035] pointer-events-none"
          />
        </div>

        {/* Central Container: Card + Bottom Login Link */}
        <div className="relative z-10 w-full max-w-[472px] flex flex-col items-center my-auto py-6 sm:py-10">
          
          {/* ===================================================================== */}
          {/* Main Floating White Card (Figma Node 167:2888)                        */}
          {/* Specs: Width 472px, Padding 36px 24px, Radius 24px, Fill #FFF        */}
          {/* ===================================================================== */}
          <div className="w-full bg-white rounded-[24px] p-6 sm:px-9 sm:py-9 shadow-[0_10px_40px_rgba(112,80,230,0.06)] border border-[#F2F4F7]">
            
            {step === 'form' ? (
              /* ================================================================= */
              /* STEP 1: Registration Form matching Figma Node 167:2884            */
              /* ================================================================= */
              <>
                {/* 1. Official HighScholar Brand Logo Header (Node 167:2890) */}
                <div className="mb-6">
                  <img
                    src="/highscholar-logo-purple.png"
                    alt="HighScholar"
                    className="h-[28px] sm:h-[30px] w-auto object-contain"
                  />
                </div>

                {/* 2. Title and Subtitle (Nodes 167:2906 & 168:3075) */}
                <div className="mb-7">
                  <h1 className="text-[24px] font-semibold text-[#212B36] tracking-tight leading-[32px]">
                    Create an account
                  </h1>
                  <p className="text-[14px] text-[#475467] leading-[20px] mt-1 font-normal">
                    Join HighScholar to start your scholarship radar
                  </p>
                </div>

                {/* Error Message Alert */}
                {error && (
                  <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleInitiateSignup} className="space-y-4">
                  
                  {/* Email Input (Node 168:3048: 401×52px, Radius 20px, Border #E1E8F0) */}
                  <div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="w-full h-[52px] px-4 rounded-[20px] border border-[#E1E8F0] bg-white text-sm text-[#212B36] placeholder:text-[#919EAB] placeholder:text-xs focus:outline-hidden focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] transition-all shadow-2xs"
                    />
                  </div>

                  {/* Password Input & Eye Toggle (Node 167:2915: 401×52px, Radius 20px) */}
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full h-[52px] pl-4 pr-11 rounded-[20px] border border-[#E1E8F0] bg-white text-sm text-[#212B36] placeholder:text-[#919EAB] placeholder:text-xs focus:outline-hidden focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919EAB] hover:text-[#637381] transition-colors cursor-pointer p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input & Eye Toggle (Node 168:3054: 401×52px, Radius 20px) */}
                  <div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        required
                        className="w-full h-[52px] pl-4 pr-11 rounded-[20px] border border-[#E1E8F0] bg-white text-sm text-[#212B36] placeholder:text-[#919EAB] placeholder:text-xs focus:outline-hidden focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919EAB] hover:text-[#637381] transition-colors cursor-pointer p-1"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox (Node 168:3066) */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#0075FF] focus:ring-[#0075FF] border-[#D0D5DD] cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-[#475467] leading-tight select-none cursor-pointer">
                      I agree to HighScholar&apos;s{' '}
                      <span className="text-[#704FE6] font-medium underline">Terms of Service</span> and{' '}
                      <span className="text-[#704FE6] font-medium underline">Privacy Policy</span>.
                    </label>
                  </div>

                  {/* Create Account Button (Node 167:2923: 401×40px, Radius 20px, Solid #704FE6) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || isGoogleLoading}
                      className="w-full h-[40px] bg-[#704FE6] hover:bg-[#603ddb] active:scale-[0.99] text-white font-bold text-[12px] rounded-[20px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
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

                {/* Divider: "OR SIGN IN WITH EMAIL" (Node 167:2926) */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EAECF0]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-[#98A2B3] font-medium uppercase tracking-[0.62px] text-[10px]">
                      Or sign in with email
                    </span>
                  </div>
                </div>

                {/* Google OAuth Button (Node 167:2933: 401×44px, Radius 20px, Border #7150E7) */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full h-[44px] bg-white hover:bg-[#F9F8FE] active:scale-[0.99] border border-[#7150E7] text-[#344054] text-sm font-semibold rounded-[20px] transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-[#7150E7] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
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
              </>
            ) : (
              /* ================================================================= */
              /* STEP 2: 5-Digit Real Email OTP Verification Screen                */
              /* ================================================================= */
              <div className="animate-in fade-in duration-200">
                
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#919EAB] hover:text-[#212B36] mb-5 font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change details</span>
                </button>

                {/* 1. Official HighScholar Brand Logo Header */}
                <div className="mb-6">
                  <img
                    src="/highscholar-logo-purple.png"
                    alt="HighScholar"
                    className="h-[28px] sm:h-[30px] w-auto object-contain"
                  />
                </div>

                <div className="mb-6">
                  <h1 className="text-[24px] font-semibold text-[#212B36] tracking-tight leading-[32px]">
                    Verify your email
                  </h1>
                  <p className="text-[14px] text-[#475467] leading-[20px] mt-1 font-normal">
                    We sent a 5-digit verification code to <span className="font-semibold text-[#101828]">{email}</span>.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                {successMsg && !error && (
                  <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* 5-Digit Inputs Row */}
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-3">
                      Enter 5-digit verification code
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
                          className="w-13 h-14 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-[16px] border border-[#E1E8F0] bg-white text-[#212B36] focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] focus:outline-hidden transition-all shadow-2xs"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isVerifying || otpDigits.join('').length < 5}
                    className="w-full h-[40px] bg-[#704FE6] hover:bg-[#603ddb] active:scale-[0.99] text-white font-bold text-[12px] rounded-[20px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="text-[#704FE6] hover:text-[#5925DC] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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

          </div>

          {/* ===================================================================== */}
          {/* Bottom Footer Section (Node 167:2941: "Already have an account? Log in Now!") */}
          {/* ===================================================================== */}
          <div className="pt-6 text-center">
            <p className="text-[12px] text-[#919EAB]">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-[#101828] hover:text-[#704FE6] font-semibold text-[14px] transition-colors ml-1"
              >
                Log in Now!
              </Link>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
