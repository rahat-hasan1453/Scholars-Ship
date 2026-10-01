'use client';

import React, { useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { HintText } from '@/components/base/input/hint-text';
import { Input } from '@/components/base/input/input';
import {
  AuthFooterLink,
  AuthHeading,
  AuthLayout,
  authInputProps,
  authPrimaryButtonClass,
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
      <div className="flex w-full flex-col gap-[28px]">
        <AuthHeading title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
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

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[24px]">
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
          <Button type="submit" size="sm" isLoading={isLoading} showTextWhileLoading className={authPrimaryButtonClass}>
            {isLoading ? 'Sending link...' : successMsg ? 'Resend link' : 'Send reset link'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
