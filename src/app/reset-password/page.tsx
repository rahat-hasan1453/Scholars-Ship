'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/base/buttons/button';
import { HintText } from '@/components/base/input/hint-text';
import { Input } from '@/components/base/input/input';
import {
  AuthFooterLink,
  AuthHeading,
  AuthLayout,
  authInputProps,
  authPasswordInputClassName,
  authPrimaryButtonClass,
} from '@/components/auth/auth-layout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Read on submit so the page can be prerendered without a Suspense boundary.
    const token = new URLSearchParams(window.location.search).get('token') || '';

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/login?reset=success');
        return;
      }
      setError(data.error || 'Failed to reset password. Please try again.');
      setLinkExpired(res.status === 400 && !data.error?.includes('6 characters'));
    } catch {
      setError('Network error. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout footer={<AuthFooterLink prompt="Remember your password?" href="/login" label="Log in" />}>
      <div className="flex w-full flex-col gap-[28px]">
        <AuthHeading title="Set a new password" subtitle="Choose a new password for your account">
          {error && (
            <HintText isInvalid role="alert" className="mt-[8px] text-[12px] leading-[16px]">
              {error}
            </HintText>
          )}
        </AuthHeading>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[24px]">
          <div className="flex w-full flex-col gap-[16px]">
            <Input
              {...authInputProps}
              inputClassName={authPasswordInputClassName}
              id="password"
              type="password"
              autoComplete="new-password"
              aria-label="New Password"
              placeholder="New Password"
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
          </div>

          <div className="flex flex-col gap-[12px]">
            <Button type="submit" size="sm" isLoading={isLoading} showTextWhileLoading className={authPrimaryButtonClass}>
              {isLoading ? 'Saving...' : 'Reset password'}
            </Button>
            {linkExpired && (
              <Button
                href="/forgot-password"
                color="link-color"
                size="xs"
                className="self-center text-[12px] font-normal leading-[16px]"
              >
                Request a new link
              </Button>
            )}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
