'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/shadcn/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/shadcn/input-otp';
import {
  AuthHeading,
  AuthInput,
  AuthLayout,
  AuthMessage,
  AuthSubmitButton,
  GoogleButton,
  TermsCheckbox,
} from '@/components/auth/auth-layout';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — email step adapted from Login (179:1438), code step = OTP Verification (179:5183).
// Passwordless: Google, or a 5-digit code sent to the email. New emails get an account automatically.

const RESEND_COOLDOWN_SECONDS = 60;

const GOOGLE_ERRORS: Record<string, string> = {
  google_config_missing: 'Google sign-in is not configured yet. Please use your email instead.',
  email_not_verified: 'Your Google email is not verified. Please use another account or sign in with email.',
  invalid_state: 'Google sign-in expired. Please try again.',
  access_denied: 'Google sign-in was cancelled.',
};

export default function LoginPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) {
      setError(GOOGLE_ERRORS[err] ?? 'Google sign-in failed. Please try again or use your email.');
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendCode = async () => {
    setError('');
    setSuccessMsg('');
    setIsSending(true);
    try {
      const res = await fetch('/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(step === 'code' ? 'A new code has been sent.' : '');
        setCode('');
        setStep('code');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.error || 'Failed to send the code. Please try again.');
        if (data.retryAfterSeconds && !data.rateLimited) {
          setStep('code');
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    sendCode();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 5) return;
    setError('');
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect code. Please try again.');
        setCode('');
        setIsVerifying(false);
        return;
      }

      const user = data.user;
      updateProfile({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted === true,
        ...(data.profileData || {}),
      });
      if (user.onboardingCompleted) {
        localStorage.setItem(`highscholar_onboarded_${user.email}`, 'true');
      } else {
        localStorage.removeItem(`highscholar_onboarded_${user.email}`);
      }
      router.push(user.onboardingCompleted ? '/' : '/onboarding');
    } catch {
      setError('Network error. Please try again.');
      setIsVerifying(false);
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
        <GoogleButton
          caption={step === 'email' ? 'Or continue with' : undefined}
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading || isSending || isVerifying}
          isLoading={isGoogleLoading}
        />
      }
    >
      {step === 'email' ? (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Welcome!" subtitle="Sign in or create your account">
            <AuthMessage error={error} />
          </AuthHeading>

          <form onSubmit={handleEmailSubmit} className="flex w-full flex-col gap-6">
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
              <TermsCheckbox checked={agreeTerms} onCheckedChange={setAgreeTerms} />
            </div>

            <AuthSubmitButton disabled={isSending || isGoogleLoading}>
              {isSending ? 'Sending code...' : 'Continue with email'}
            </AuthSubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Verify your email" subtitle={`We sent a 5-digit code to ${email.trim().toLowerCase()}`}>
            <AuthMessage error={error} success={error ? undefined : successMsg} />
          </AuthHeading>

          <form onSubmit={handleVerify} className="flex w-full flex-col gap-7">
            {/* InputOTP 185:6521 — 5 slots, 243 × 48 */}
            <InputOTP
              maxLength={5}
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, ''))}
              inputMode="numeric"
              pattern="^[0-9]*$"
              autoComplete="one-time-code"
              autoFocus
              aria-label="Sign-in code"
            >
              <InputOTPGroup>
                {Array.from({ length: 5 }, (_, idx) => (
                  <InputOTPSlot
                    key={idx}
                    index={idx}
                    className="h-12 w-[48.4px] bg-background text-foreground shadow-none first:w-[49.4px] first:rounded-l-[10px] last:rounded-r-[8px]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <div className="flex flex-col gap-3">
              <AuthSubmitButton disabled={isVerifying || code.length < 5}>
                {isVerifying ? 'Verifying...' : 'Continue'}
              </AuthSubmitButton>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-normal leading-4 text-text-secondary hover:text-text-primary hover:no-underline"
                  onClick={() => {
                    setStep('email');
                    setError('');
                    setSuccessMsg('');
                  }}
                >
                  ← Change email
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-normal leading-4 text-brand-primary hover:no-underline disabled:text-text-secondary"
                  onClick={sendCode}
                  disabled={resendCooldown > 0 || isSending}
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
