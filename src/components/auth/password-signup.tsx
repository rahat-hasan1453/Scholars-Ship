'use client';

import React, { useState } from 'react';
import {
  AuthCodeInput,
  AuthFooterLink,
  AuthHeading,
  AuthInput,
  AuthLayout,
  AuthMessage,
  AuthPasswordInput,
  AuthSubmitButton,
  CodeStepActions,
  GoogleButton,
} from '@/components/auth/auth-layout';
import { postJson, RESEND_COOLDOWN_SECONDS, startGoogleSignIn, useCooldown, useFinishSignIn, useGoogleError } from '@/components/auth/use-auth-flow';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Signup (167:2884) + OTP Verification (179:5183). Used when AUTH_METHOD=password.
// The email is verified once with a code; after that the user signs in with the password.

const MIN_PASSWORD = 6;

export function PasswordSignup() {
  const finishSignIn = useFinishSignIn();
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useCooldown();
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  useGoogleError(setError);

  const cleanEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    setError('');
    setSuccessMsg('');
    setIsSending(true);
    try {
      const { ok, data } = await postJson('/api/auth/email/send-code', { email: cleanEmail, purpose: 'signup' });
      if (ok) {
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
    }
    setIsSending(false);
  };

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cleanEmail || !cleanEmail.includes('@')) return setError('Please enter a valid email address');
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters (numbers only is fine)`);
    if (password !== confirmPassword) return setError('Passwords do not match');
    sendCode();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 5) return;
    setError('');
    setIsVerifying(true);
    try {
      const { ok, data } = await postJson('/api/auth/password/signup', { email: cleanEmail, code, password });
      if (ok) return finishSignIn(data);
      setError(data.error || 'Incorrect code. Please try again.');
      setCode('');
    } catch {
      setError('Network error. Please try again.');
    }
    setIsVerifying(false);
  };

  return (
    <AuthLayout
      footer={
        <>
          <GoogleButton
            caption="Or sign in with email"
            onClick={() => {
              setIsGoogleLoading(true);
              startGoogleSignIn();
            }}
            disabled={isGoogleLoading || isSending || isVerifying}
            isLoading={isGoogleLoading}
          />
          <AuthFooterLink prompt="Already have an account?" href="/login" label="Log in Now!" />
        </>
      }
    >
      {step === 'form' ? (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Create an account" subtitle="Join Scholars'ship to start your scholarship radar">
            <AuthMessage error={error} />
          </AuthHeading>

          <form onSubmit={handleForm} className="flex w-full flex-col gap-6">
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
            </div>

            <AuthSubmitButton disabled={isSending || isGoogleLoading}>
              {isSending ? 'Sending code...' : 'Create Account'}
            </AuthSubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Verify your account" subtitle={`We sent a 5-digit code to ${cleanEmail}`}>
            <AuthMessage error={error} success={error ? undefined : successMsg} />
          </AuthHeading>

          <form onSubmit={handleVerify} className="flex w-full flex-col gap-7">
            <AuthCodeInput value={code} onChange={setCode} />
            <div className="flex flex-col gap-3">
              <AuthSubmitButton disabled={isVerifying || code.length < 5}>
                {isVerifying ? 'Creating account...' : 'Create Account'}
              </AuthSubmitButton>
              <CodeStepActions
                backLabel="Change details"
                onBack={() => {
                  setStep('form');
                  setError('');
                  setSuccessMsg('');
                }}
                onResend={sendCode}
                resendCooldown={resendCooldown}
                isSending={isSending}
              />
            </div>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
