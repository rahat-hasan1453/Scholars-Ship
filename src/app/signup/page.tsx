'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Signup (167:2884) & OTP Verification (179:5183)

/* Scholars'ship wordmark (Title Area 167:2890) */
function BrandLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="Scholars'ship">
      <div className="relative h-[35.635px] w-[45.68px] shrink-0">
        <img src="/signup/logo-mark-back.svg" alt="" className="absolute left-0 top-[1.69px] h-[34.313px] w-[17.77px]" />
        <img src="/signup/logo-mark-front.svg" alt="" className="absolute left-[16.58px] top-0 h-[35.635px] w-[29.1px]" />
      </div>
      <div className="relative h-[47.963px] w-[186.329px] shrink-0">
        <img src="/signup/logo-scholars.svg" alt="" className="absolute left-0 top-[9.82px] h-[23.576px] w-[125.897px]" />
        <img src="/signup/logo-ship.svg" alt="" className="absolute left-[127.44px] top-0 h-[47.963px] w-[58.889px]" />
      </div>
    </div>
  );
}

/* Text input (Input field 179:3609) */
const inputClass =
  'h-[44px] w-full rounded-[8px] border border-[#E1E8F0] bg-white px-[14px] py-[10px] text-[16px] leading-[20px] text-[#101828] shadow-[0_1px_1px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-[#919EAB] focus:border-[#7150E7]';

/* Primary button (Buttons/Button 179:4933) */
const primaryButtonClass =
  'flex h-[36px] w-full items-center justify-center gap-2 rounded-[8px] border border-[#7F56D9] bg-[#7150E7] px-[14px] font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[14px] font-semibold leading-[20px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#6341dc] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

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

  const passwordToggle = (visible: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={visible}
      className="absolute right-[14px] top-1/2 flex size-[16px] -translate-y-1/2 cursor-pointer items-center justify-center"
    >
      {visible ? (
        <EyeOff className="size-[16px] text-[#D0D7E1]" strokeWidth={1.5} />
      ) : (
        <img src="/signup/eye.svg" alt="" className="h-[12.1667px] w-[16.1667px]" />
      )}
    </button>
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#FCFCFC] tracking-normal lg:flex-row">
      {/* Image Container (167:2953) — 810 × 883 at 1728 × 883 */}
      <div className="relative h-[240px] w-full shrink-0 select-none overflow-hidden sm:h-[320px] lg:sticky lg:top-0 lg:h-screen lg:w-[46.875%]">
        <img
          src="/login-figma-banner.jpg"
          alt="Graduate celebrating with a purple cap"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Right canvas — card centred at x = 1280 of 1728 */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:pl-[22px] lg:pr-0 lg:py-10">
        <div className="w-full max-w-[472px] overflow-hidden">
          {/* login form (167:2888) */}
          <div className="flex w-full flex-col gap-[10px] rounded-t-[24px] bg-white px-[24px] py-[36px]">
            <BrandLogo />

            {step === 'form' ? (
              <div className="flex w-full flex-col gap-[28px]">
                <div className="flex flex-col gap-[4px]">
                  <h1 className="text-[24px] font-[510] leading-[32px] text-[#101828]">Create an account</h1>
                  <p className="text-[14px] leading-[18px] text-[#919EAB]">
                    Join HighScholar to start your scholarship radar
                  </p>
                  {error && (
                    <p role="alert" className="mt-[8px] text-[12px] leading-[16px] text-[#F04438]">
                      {error}
                    </p>
                  )}
                </div>

                <form onSubmit={handleInitiateSignup} className="flex w-full flex-col gap-[24px]">
                  <div className="flex w-full flex-col gap-[16px]">
                    <input
                      type="email"
                      id="email"
                      autoComplete="email"
                      aria-label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email"
                      required
                      className={inputClass}
                    />

                    <div className="relative w-full">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        aria-label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        required
                        className={cn(inputClass, 'pr-[38px]')}
                      />
                      {passwordToggle(showPassword, () => setShowPassword(!showPassword), 'Toggle password visibility')}
                    </div>

                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        aria-label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        required
                        className={cn(inputClass, 'pr-[38px]')}
                      />
                      {passwordToggle(
                        showConfirmPassword,
                        () => setShowConfirmPassword(!showConfirmPassword),
                        'Toggle confirm password visibility'
                      )}
                    </div>

                    {/* Terms checkbox (168:3066) */}
                    <label htmlFor="terms" className="flex cursor-pointer select-none items-center gap-[8px]">
                      <span className="relative flex shrink-0 pt-[2px]">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="peer absolute inset-0 size-[16px] cursor-pointer opacity-0"
                        />
                        <span
                          className={cn(
                            'flex size-[16px] items-center justify-center rounded-[2px] border',
                            agreeTerms ? 'border-[#0075FF] bg-[#0075FF]' : 'border-[#767676] bg-white',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-[#0075FF]/40'
                          )}
                        >
                          {agreeTerms && <img src="/signup/check.svg" alt="" className="size-[14px]" />}
                        </span>
                      </span>
                      <span className="text-[12px] italic leading-[16px] text-[#475467]">
                        I agree to HighScholar&apos;s <span className="text-[#7150E7]">Terms of Service</span> and{' '}
                        <span className="text-[#7150E7]">Privacy Policy</span>.
                      </span>
                    </label>
                  </div>

                  <button type="submit" disabled={isLoading || isGoogleLoading} className={primaryButtonClass}>
                    {isLoading && (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}
                    {isLoading ? 'Sending code...' : 'Create Account'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-[28px]">
                <div className="flex flex-col gap-[4px]">
                  <h1 className="text-[24px] font-[510] leading-[32px] text-[#101828]">Verify your account</h1>
                  <p className="text-[14px] leading-[18px] text-[#919EAB]">
                    Join HighScholar to start your scholarship radar
                  </p>
                  {error ? (
                    <p role="alert" className="mt-[8px] text-[12px] leading-[16px] text-[#F04438]">
                      {error}
                    </p>
                  ) : (
                    successMsg && (
                      <p className="mt-[8px] text-[12px] leading-[16px] text-[#12B76A]">{successMsg}</p>
                    )
                  )}
                </div>

                <form onSubmit={handleVerifyOtp} className="flex w-full flex-col gap-[24px]">
                  {/* Verification code input field (179:5586) */}
                  <div className="flex w-full max-w-[352px] gap-[8px]">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Digit ${idx + 1}`}
                        maxLength={1}
                        value={digit}
                        placeholder="0"
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        autoFocus={idx === 0}
                        className="h-[64px] min-w-0 max-w-[64px] flex-1 basis-0 rounded-[8px] border border-[#E1E8F0] bg-white p-[8px] text-center text-[32px] font-[590] leading-[40px] text-[#101828] outline-none transition-colors placeholder:text-[#D0D7E1] focus:border-[#7150E7]"
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-[12px]">
                    <button
                      type="submit"
                      disabled={isVerifying || otpDigits.join('').length < 5}
                      className={primaryButtonClass}
                    >
                      {isVerifying && (
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      )}
                      {isVerifying ? 'Verifying...' : 'Create Account'}
                    </button>

                    <div className="flex items-center justify-between text-[12px] leading-[16px] text-[#919EAB]">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('form');
                          setError('');
                        }}
                        className="cursor-pointer hover:text-[#101828]"
                      >
                        ← Change details
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || isLoading}
                        className="cursor-pointer text-[#7150E7] disabled:cursor-not-allowed disabled:text-[#919EAB]"
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer (179:5135) */}
          <div className="w-full rounded-b-[24px] border-t border-dashed border-[#E1E8F0] bg-white py-[12px]">
            <div className="relative flex w-full flex-col items-center gap-[8px]">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className="flex cursor-pointer items-center gap-[12px] rounded-[100px] border border-[#E1E8F0] py-[8px] pl-[8px] pr-[15px] transition-colors hover:bg-[#F9F8FE] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <span className="flex size-[31px] items-center justify-center">
                    <span className="size-4 animate-spin rounded-full border-2 border-[#E1E8F0] border-t-[#7150E7]" />
                  </span>
                ) : (
                  <img src="/signup/google.svg" alt="" className="size-[31px]" />
                )}
                <span className="flex flex-col items-start gap-[2px]">
                  <span className="text-[10px] italic leading-[16px] text-[#98A2B3]">Or sign in with email</span>
                  <span className="text-[14px] leading-[18px] text-[#919EAB]">
                    {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </span>
              </button>

              <div className="flex items-center">
                <span className="flex w-[158px] justify-center whitespace-nowrap text-[12px] italic leading-[18px] text-[#919EAB]">
                  Already have an account?&nbsp;
                </span>
                <Link
                  href="/login"
                  className="text-[14px] font-[508] italic leading-[20px] text-[#101828] hover:text-[#7150E7]"
                >
                  Log in Now!
                </Link>
              </div>

              {/* Corner decoration (179:5172) */}
              <div aria-hidden="true" className="pointer-events-none absolute left-full top-0 h-0 w-0">
                <div className="absolute left-[-37.1px] top-[68.4px] flex h-[39.6px] w-[33.5px] items-center justify-center">
                  <img src="/signup/deco-back.svg" alt="" className="h-[35.1954px] w-[18.2291px] max-w-none rotate-[-30.16deg]" />
                </div>
                <div className="absolute left-[-23.3px] top-[52.5px] flex h-[46.6px] w-[44.2px] items-center justify-center">
                  <img src="/signup/deco-front.svg" alt="" className="h-[36.5512px] w-[29.8519px] max-w-none rotate-[-30.16deg]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
