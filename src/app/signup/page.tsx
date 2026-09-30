'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/base/buttons/button';
import { SocialButton } from '@/components/base/buttons/social-button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { HintText } from '@/components/base/input/hint-text';
import { Input } from '@/components/base/input/input';
import { PinInput } from '@/components/base/input/pin-input';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Signup (167:2884) & OTP Verification (179:5183)
// Components: Untitled UI. Colors & fonts: Figma tokens (see src/app/globals.css).

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

/* Input field 179:3609 — 44px, radius 8, Figma placeholder Text/Secondary */
const inputProps = {
  size: 'lg' as const,
  wrapperClassName: 'shadow-[0_1px_1px_rgba(0,0,0,0.05)]',
  inputClassName: 'placeholder:text-secondary',
};

/* Buttons/Button 179:4933 — 36px, Brand/Primary fill, Brand/600 border */
const primaryButtonClass =
  'w-full font-[Inter,ui-sans-serif,system-ui,sans-serif] leading-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]! ring-brand-600 before:hidden';

export default function SignupPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  // Registration form states (Node 167:2884: Email, Password, Confirm Password, Terms)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Step 2: OTP input (Untitled UI PinInput gives a string; keep the 5-slot array state)
  const handleOtpValueChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5).split('');
    setOtpDigits(Array.from({ length: 5 }, (_, i) => digits[i] ?? ''));
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
    <div className="relative flex min-h-screen w-full flex-col bg-surface-bg tracking-normal lg:flex-row">
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
          <div className="flex w-full flex-col gap-[10px] rounded-t-[24px] bg-surface-white px-[24px] py-[36px]">
            <BrandLogo />

            {step === 'form' ? (
              <div className="flex w-full flex-col gap-[28px]">
                <div className="flex flex-col gap-[4px]">
                  <h1 className="text-[24px] font-[510] leading-[32px] text-primary">Create an account</h1>
                  <p className="text-[14px] leading-[18px] text-secondary">
                    Join HighScholar to start your scholarship radar
                  </p>
                  {error && (
                    <HintText isInvalid role="alert" className="mt-[8px] text-[12px] leading-[16px]">
                      {error}
                    </HintText>
                  )}
                </div>

                <form onSubmit={handleInitiateSignup} className="flex w-full flex-col gap-[24px]">
                  <div className="flex w-full flex-col gap-[16px]">
                    <Input
                      {...inputProps}
                      id="email"
                      type="email"
                      autoComplete="email"
                      aria-label="Email"
                      placeholder="Enter Email"
                      isRequired
                      value={email}
                      onChange={setEmail}
                    />
                    <Input
                      {...inputProps}
                      inputClassName={`${inputProps.inputClassName} pr-9.5`}
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-label="Password"
                      placeholder="Enter Password"
                      isRequired
                      value={password}
                      onChange={setPassword}
                    />
                    <Input
                      {...inputProps}
                      inputClassName={`${inputProps.inputClassName} pr-9.5`}
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-label="Confirm Password"
                      placeholder="Confirm Password"
                      isRequired
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                    />

                    {/* Terms checkbox (168:3066) — Brand/Primary purple #7150E7 */}
                    <Checkbox
                      id="terms"
                      isSelected={agreeTerms}
                      onChange={setAgreeTerms}
                      className="items-center [&_p]:leading-[16px]"
                      boxClassName={`mt-[2px] rounded-[2px] ${agreeTerms ? 'bg-brand-solid ring-brand-primary' : 'ring-[#767676]'}`}
                      label={
                        <span className="text-[12px] font-normal italic leading-[16px] text-text-body">
                          I agree to HighScholar&apos;s <span className="text-brand-primary">Terms of Service</span> and{' '}
                          <span className="text-brand-primary">Privacy Policy</span>.
                        </span>
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isLoading}
                    showTextWhileLoading
                    isDisabled={isGoogleLoading}
                    className={primaryButtonClass}
                  >
                    {isLoading ? 'Sending code...' : 'Create Account'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-[28px]">
                <div className="flex flex-col gap-[4px]">
                  <h1 className="text-[24px] font-[510] leading-[32px] text-primary">Verify your account</h1>
                  <p className="text-[14px] leading-[18px] text-secondary">
                    Join HighScholar to start your scholarship radar
                  </p>
                  {error ? (
                    <HintText isInvalid role="alert" className="mt-[8px] text-[12px] leading-[16px]">
                      {error}
                    </HintText>
                  ) : (
                    successMsg && (
                      <HintText className="mt-[8px] text-[12px] leading-[16px] text-success-main">{successMsg}</HintText>
                    )
                  )}
                </div>

                <form onSubmit={handleVerifyOtp} className="flex w-full flex-col gap-[24px]">
                  {/* Verification code input field (179:5586) */}
                  <PinInput size="sm">
                    <PinInput.Group
                      ref={(el: HTMLInputElement | null) => {
                        otpInputRefs.current[0] = el;
                      }}
                      maxLength={5}
                      value={otpDigits.join('')}
                      onChange={handleOtpValueChange}
                      inputMode="numeric"
                      pattern="^[0-9]*$"
                      autoComplete="one-time-code"
                      autoFocus
                      containerClassName="h-auto gap-[8px]"
                    >
                      {otpDigits.map((digit, idx) => (
                        <PinInput.Slot
                          key={idx}
                          index={idx}
                          className={`size-[56px] rounded-[8px] p-[8px] text-[32px] font-[590] leading-[40px] shadow-none sm:size-[64px] ${digit ? 'text-primary' : 'text-placeholder'}`}
                        />
                      ))}
                    </PinInput.Group>
                  </PinInput>

                  <div className="flex flex-col gap-[12px]">
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={isVerifying}
                      showTextWhileLoading
                      isDisabled={otpDigits.join('').length < 5}
                      className={primaryButtonClass}
                    >
                      {isVerifying ? 'Verifying...' : 'Create Account'}
                    </Button>

                    <div className="flex items-center justify-between">
                      <Button
                        color="link-gray"
                        size="xs"
                        className="text-[12px] font-normal leading-[16px] text-secondary"
                        onPress={() => {
                          setStep('form');
                          setError('');
                        }}
                      >
                        ← Change details
                      </Button>
                      <Button
                        color="link-color"
                        size="xs"
                        className="text-[12px] font-normal leading-[16px]"
                        onPress={handleResendCode}
                        isDisabled={resendCooldown > 0 || isLoading}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer (179:5135) */}
          <div className="w-full rounded-b-[24px] border-t border-dashed border-stroke-default bg-surface-white py-[12px]">
            <div className="relative flex w-full flex-col items-center gap-[8px]">
              <SocialButton
                social="google"
                theme="color"
                size="lg"
                onPress={handleGoogleAuth}
                isDisabled={isGoogleLoading || isLoading}
                className="gap-[12px] rounded-full py-[9px] pl-[8px] pr-[15px] font-normal shadow-none before:hidden hover:bg-brand-soft [&>svg]:size-[31px] [&>svg]:p-[4px]"
              >
                <span className="flex flex-col items-start gap-[2px]">
                  <span className="text-[10px] italic leading-[16px] text-text-caption">Or sign in with email</span>
                  <span className="text-[14px] leading-[18px] text-secondary">
                    {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </span>
              </SocialButton>

              <div className="flex items-center">
                <span className="flex w-[158px] justify-center whitespace-nowrap text-[12px] italic leading-[18px] text-secondary">
                  Already have an account?&nbsp;
                </span>
                <Button
                  href="/login"
                  color="link-gray"
                  size="sm"
                  className="text-[14px] font-[508] italic leading-[20px] text-primary hover:text-brand-primary"
                >
                  Log in Now!
                </Button>
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
