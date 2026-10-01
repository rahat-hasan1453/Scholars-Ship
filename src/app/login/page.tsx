'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
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

// Figma: zLYU2tCsLDvZNnUXk7Cpgw — Login (179:1438)

export default function LoginPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'success') {
        setSuccessMsg('Password updated. Please log in with your new password.');
      }
      const err = params.get('error');
      if (err === 'google_config_missing') {
        setError('Google OAuth credentials not configured in .env.local yet. See .env.example for quick setup.');
      } else if (err) {
        setError(`Authentication error: ${err.replace(/_/g, ' ')}`);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      const user = data.user;
      const isUserOnboarded = user.onboardingCompleted === true;

      // Update client context
      updateProfile({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        onboardingCompleted: isUserOnboarded,
        ...(data.profileData || {}),
      });

      if (typeof window !== 'undefined') {
        if (isUserOnboarded) {
          localStorage.setItem(`highscholar_onboarded_${user.email}`, 'true');
        } else {
          localStorage.removeItem(`highscholar_onboarded_${user.email}`);
        }
      }

      setIsLoading(false);

      if (isUserOnboarded) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error(err);
      setError('Network error during login. Please try again.');
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
          <GoogleButton onClick={handleGoogleAuth} disabled={isGoogleLoading || isLoading} isLoading={isGoogleLoading} />
          <AuthFooterLink prompt="Don’t have an account?" href="/signup" label="Sign up now!" />
        </>
      }
    >
      <div className="flex w-full flex-col gap-7">
        <AuthHeading title="Welcome back!" subtitle="Sign in to continue">
          <AuthMessage error={error} success={successMsg} />
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
              <Link
                href="/forgot-password"
                className="self-end text-xs leading-4 text-text-secondary hover:text-brand-primary"
              >
                Forgot password?
              </Link>
            </div>
            <TermsCheckbox checked={agreeTerms} onCheckedChange={setAgreeTerms} />
          </div>

          <AuthSubmitButton disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </AuthSubmitButton>
        </form>
      </div>
    </AuthLayout>
  );
}
