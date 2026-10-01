'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { HintText } from '@/components/base/input/hint-text';
import { Input } from '@/components/base/input/input';
import { PinInput } from '@/components/base/input/pin-input';
import {
  AuthFooterLink,
  AuthHeading,
  AuthLayout,
  GoogleButton,
  authCheckboxBoxClass,
  authInputProps,
  authPasswordInputClassName,
  authPrimaryButtonClass,
} from '@/components/auth/auth-layout';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Signup (167:2884) & OTP Verification (179:5183)
// Components: Untitled UI. Colors & fonts: Figma tokens (see src/app/globals.css).

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
    <AuthLayout
      footer={
        <>
          <GoogleButton
            caption="Or sign in with email"
            onPress={handleGoogleAuth}
            isDisabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
          />
          <AuthFooterLink prompt="Already have an account?" href="/login" label="Log in Now!" />
        </>
      }
    >
      {step === 'form' ? (
        <div className="flex w-full flex-col gap-[28px]">
          <AuthHeading title="Create an account" subtitle="Join HighScholar to start your scholarship radar">
            {error && (
              <HintText isInvalid role="alert" className="mt-[8px] text-[12px] leading-[16px]">
                {error}
              </HintText>
            )}
          </AuthHeading>

          <form onSubmit={handleInitiateSignup} className="flex w-full flex-col gap-[24px]">
            <div className="flex w-full flex-col gap-[16px]">
              <Input
                {...authInputProps}
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
                {...authInputProps}
                inputClassName={authPasswordInputClassName}
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
                {...authInputProps}
                inputClassName={authPasswordInputClassName}
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
                boxClassName={authCheckboxBoxClass(agreeTerms)}
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
              className={authPrimaryButtonClass}
            >
              {isLoading ? 'Sending code...' : 'Create Account'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-[28px]">
          <AuthHeading title="Verify your account" subtitle="Join HighScholar to start your scholarship radar">
            {error ? (
              <HintText isInvalid role="alert" className="mt-[8px] text-[12px] leading-[16px]">
                {error}
              </HintText>
            ) : (
              successMsg && (
                <HintText className="mt-[8px] text-[12px] leading-[16px] text-success-main">{successMsg}</HintText>
              )
            )}
          </AuthHeading>

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
                className={authPrimaryButtonClass}
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
    </AuthLayout>
  );
}
