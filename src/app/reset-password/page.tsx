'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AuthFooterLink,
  AuthHeading,
  AuthLayout,
  AuthMessage,
  AuthPasswordInput,
  AuthSubmitButton,
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
      <div className="flex w-full flex-col gap-7">
        <AuthHeading title="Set a new password" subtitle="Choose a new password for your account">
          <AuthMessage error={error} />
        </AuthHeading>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
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
            <AuthSubmitButton disabled={isLoading}>{isLoading ? 'Saving...' : 'Reset password'}</AuthSubmitButton>
            {linkExpired && (
              <Link
                href="/forgot-password"
                className="self-center text-xs leading-4 text-brand-primary hover:underline"
              >
                Request a new link
              </Link>
            )}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
