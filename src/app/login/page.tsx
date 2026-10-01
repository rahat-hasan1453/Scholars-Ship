'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { HintText } from '@/components/base/input/hint-text';
import { Input } from '@/components/base/input/input';
import {
  AuthFooterLink,
  AuthHeading,
  AuthLayout,
  GoogleButton,
  authCheckboxBoxClass,
  authInputProps,
  authPasswordInputClassName,
  authPrimaryButtonClass,
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
          <GoogleButton onPress={handleGoogleAuth} isDisabled={isGoogleLoading || isLoading} isLoading={isGoogleLoading} />
          <AuthFooterLink prompt="Don’t have an account?" href="/signup" label="Sign up now!" />
        </>
      }
    >
      <div className="flex w-full flex-col gap-[28px]">
        <AuthHeading title="Welcome back!" subtitle="Sign in to continue">
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

        <form onSubmit={handleLogin} className="flex w-full flex-col gap-[24px]">
          <div className="flex w-full flex-col gap-[16px]">
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
            <div className="flex flex-col gap-[6px]">
              <Input
                {...authInputProps}
                inputClassName={authPasswordInputClassName}
                id="password"
                type="password"
                autoComplete="current-password"
                aria-label="Password"
                placeholder="Enter Password"
                isRequired
                value={password}
                onChange={setPassword}
              />
              <Button
                href="/forgot-password"
                color="link-gray"
                size="xs"
                className="self-end text-[12px] font-normal leading-[16px] text-secondary hover:text-brand-primary"
              >
                Forgot password?
              </Button>
            </div>

            {/* Terms checkbox (179:5016) */}
            <Checkbox
              id="terms"
              isSelected={agreeTerms}
              onChange={setAgreeTerms}
              className="items-center [&_p]:leading-[16px]"
              boxClassName={authCheckboxBoxClass(agreeTerms)}
              label={
                <span className="text-[12px] font-normal italic leading-[16px] text-text-body">
                  I agree to HighScholar&apos;s <span className="text-brand-primary">Terms of Service</span> and{' '}
                  <span className="text-brand-primary">Privacy Policy</span>.
                </span>
              }
            />
          </div>

          <Button
            type="submit"
            size="sm"
            isLoading={isLoading}
            showTextWhileLoading
            isDisabled={isGoogleLoading}
            className={authPrimaryButtonClass}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
