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
} from '@/components/auth/auth-layout';
import { postJson, RESEND_COOLDOWN_SECONDS, useCooldown, useFinishSignIn } from '@/components/auth/use-auth-flow';

// Forgot password (no Figma frame; same style as Login). A code proves the email, then a new password is set.

const MIN_PASSWORD = 6;

export function PasswordReset() {
  const finishSignIn = useFinishSignIn();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useCooldown();
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const cleanEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    setError('');
    setSuccessMsg('');
    setIsSending(true);
    try {
      const { ok, data } = await postJson('/api/auth/email/send-code', { email: cleanEmail, purpose: 'reset' });
      if (ok) {
        setSuccessMsg(data.message || '');
        setCode('');
        setStep('reset');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.error || 'Failed to send the code. Please try again.');
        if (data.retryAfterSeconds && !data.rateLimited) {
          setStep('reset');
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setIsSending(false);
  };

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanEmail || !cleanEmail.includes('@')) return setError('Please enter a valid email address');
    sendCode();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length < 5) return setError('Please enter the 5-digit code from your email');
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters (numbers only is fine)`);
    if (password !== confirmPassword) return setError('Passwords do not match');

    setIsSaving(true);
    try {
      const { ok, data } = await postJson('/api/auth/password/reset', { email: cleanEmail, code, password });
      if (ok) return finishSignIn(data);
      setError(data.error || 'Could not reset the password. Please try again.');
      if (data.reason) setCode('');
    } catch {
      setError('Network error. Please try again.');
    }
    setIsSaving(false);
  };

  return (
    <AuthLayout footer={<AuthFooterLink prompt="Remember your password?" href="/login" label="Log in" />}>
      {step === 'email' ? (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Forgot password?" subtitle="Enter your email and we'll send you a code">
            <AuthMessage error={error} />
          </AuthHeading>
          <form onSubmit={handleEmail} className="flex w-full flex-col gap-6">
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
            <AuthSubmitButton disabled={isSending}>{isSending ? 'Sending code...' : 'Send code'}</AuthSubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-7">
          <AuthHeading title="Set a new password" subtitle={`Enter the code sent to ${cleanEmail} and choose a new password`}>
            <AuthMessage error={error} success={error ? undefined : successMsg} />
          </AuthHeading>
          <form onSubmit={handleReset} className="flex w-full flex-col gap-6">
            <AuthCodeInput value={code} onChange={setCode} />
            <div className="flex w-full flex-col gap-4">
              <AuthPasswordInput
                id="password"
                autoComplete="new-password"
                aria-label="New Password"
                placeholder="New Password"
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
            <div className="flex flex-col gap-3">
              <AuthSubmitButton disabled={isSaving || code.length < 5}>{isSaving ? 'Saving...' : 'Reset password'}</AuthSubmitButton>
              <CodeStepActions
                backLabel="Change email"
                onBack={() => {
                  setStep('email');
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
