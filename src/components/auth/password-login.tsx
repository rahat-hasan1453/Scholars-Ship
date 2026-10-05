'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AuthFooterLink,
  AuthHeading,
  AuthInput,
  AuthLayout,
  AuthMessage,
  AuthPasswordInput,
  AuthSubmitButton,
  GoogleButton,
} from '@/components/auth/auth-layout';
import { postJson, startGoogleSignIn, useFinishSignIn, useGoogleError } from '@/components/auth/use-auth-flow';

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Login (179:1438). Used when AUTH_METHOD=password.

export function PasswordLogin() {
  const finishSignIn = useFinishSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  useGoogleError(setError);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address');
    if (!password) return setError('Please enter your password');

    setIsLoading(true);
    try {
      const { ok, data } = await postJson('/api/auth/password/login', { email: email.trim().toLowerCase(), password });
      if (ok) return finishSignIn(data);
      setError(data.error || 'Incorrect email or password.');
    } catch {
      setError('Network error. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout
      footer={
        <>
          <GoogleButton
            onClick={() => {
              setIsGoogleLoading(true);
              startGoogleSignIn();
            }}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
          />
          <AuthFooterLink prompt="Don’t have an account?" href="/signup" label="Sign up now!" />
        </>
      }
    >
      <div className="flex w-full flex-col gap-7">
        <AuthHeading title="Welcome back!" subtitle="Sign in to continue">
          <AuthMessage error={error} />
        </AuthHeading>

        <form onSubmit={handleLogin} className="flex w-full flex-col gap-6">
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
            <div className="flex flex-col gap-1.5">
              <AuthPasswordInput
                id="password"
                autoComplete="current-password"
                aria-label="Password"
                placeholder="Enter Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Link href="/forgot-password" className="self-end text-xs leading-4 text-text-secondary hover:text-brand-primary">
                Forgot password?
              </Link>
            </div>
          </div>

          <AuthSubmitButton disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </AuthSubmitButton>
        </form>
      </div>
    </AuthLayout>
  );
}
