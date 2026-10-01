'use client';

import React, { useState } from 'react';
import {
  AuthFooterLink,
  AuthHeading,
  AuthInput,
  AuthLayout,
  AuthMessage,
  AuthSubmitButton,
} from '@/components/auth/auth-layout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
      } else {
        setError(data.error || 'Failed to send the reset link. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout footer={<AuthFooterLink prompt="Remember your password?" href="/login" label="Log in" />}>
      <div className="flex w-full flex-col gap-7">
        <AuthHeading title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
          <AuthMessage error={error} success={successMsg} />
        </AuthHeading>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
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
          <AuthSubmitButton disabled={isLoading}>
            {isLoading ? 'Sending link...' : successMsg ? 'Resend link' : 'Send reset link'}
          </AuthSubmitButton>
        </form>
      </div>
    </AuthLayout>
  );
}
