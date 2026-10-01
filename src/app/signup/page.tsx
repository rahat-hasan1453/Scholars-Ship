'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/shadcn/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/shadcn/input-otp';
import {
  AuthFooterLink,
  AuthHeading,
  AuthInput,
  AuthLayout,
  AuthMessage,
  AuthPasswordInput,
  AuthSubmitButton,
  GoogleButton,
  TermsCheckbox,
} from '@/components/auth/auth-layout';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Signup (167:2884) & OTP Verification (179:5183)
// Components: shadcn/ui. Colors & fonts: Figma tokens (see src/app/globals.css).

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
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
          />
          <AuthFooterLink prompt="Already have an account?" href="/login" label="Log in Now!" />
        </>
      }
    >
      {step === 'form' ? (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Create an account" subtitle="Join HighScholar to start your scholarship radar">
            <AuthMessage error={error} />
          </AuthHeading>

          <form onSubmit={handleInitiateSignup} className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col gap-4">
              <AuthInput
                id="email"
                type="email"
                autoComplete="email"
                aria-label="Email"
                placeholder="Enter Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <AuthPasswordInput
                id="password"
                autoComplete="new-password"
                aria-label="Password"
                placeholder="Enter Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <AuthPasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                aria-label="Confirm Password"
                placeholder="Confirm Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <TermsCheckbox checked={agreeTerms} onCheckedChange={setAgreeTerms} />
            </div>

            <AuthSubmitButton disabled={isLoading || isGoogleLoading}>
              {isLoading ? 'Sending code...' : 'Create Account'}
            </AuthSubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Verify your account" subtitle="Join HighScholar to start your scholarship radar">
            <AuthMessage error={error} success={successMsg} />
          </AuthHeading>

          <form onSubmit={handleVerifyOtp} className="flex w-full flex-col gap-7">
            {/* InputOTP 185:6521 — 5 slots, 243 × 48 */}
            <InputOTP
              ref={(el) => {
                otpInputRefs.current[0] = el;
              }}
              maxLength={5}
              value={otpDigits.join('')}
              onChange={handleOtpValueChange}
              inputMode="numeric"
              pattern="^[0-9]*$"
              autoComplete="one-time-code"
              autoFocus
              aria-label="Verification code"
            >
              <InputOTPGroup>
                {otpDigits.map((_, idx) => (
                  <InputOTPSlot
                    key={idx}
                    index={idx}
                    className="h-12 w-[48.4px] bg-background text-foreground shadow-none first:w-[49.4px] first:rounded-l-[10px] last:rounded-r-[8px]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <div className="flex flex-col gap-3">
              <AuthSubmitButton disabled={isVerifying || otpDigits.join('').length < 5}>
                {isVerifying ? 'Verifying...' : 'Create Account'}
              </AuthSubmitButton>

              {/* Not in Figma: kept so users can fix their email or request a new code */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-normal leading-4 text-text-secondary hover:text-text-primary hover:no-underline"
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                >
                  ← Change details
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-normal leading-4 text-brand-primary hover:no-underline disabled:text-text-secondary"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
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
