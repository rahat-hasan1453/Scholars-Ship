'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export const RESEND_COOLDOWN_SECONDS = 60;

const GOOGLE_ERRORS: Record<string, string> = {
  google_config_missing: 'Google sign-in is not configured yet. Please use your email instead.',
  email_not_verified: 'Your Google email is not verified. Please use another account or sign in with email.',
  invalid_state: 'Google sign-in expired. Please try again.',
  access_denied: 'Google sign-in was cancelled.',
};

/* Shows the message for ?error=… after a failed Google redirect. */
export function useGoogleError(setError: (message: string) => void) {
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) setError(GOOGLE_ERRORS[err] ?? 'Google sign-in failed. Please try again or use your email.');
  }, [setError]);
}

export function useCooldown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

export type JsonResult = { ok: boolean; status: number; data: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function postJson(url: string, body: unknown): Promise<JsonResult> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success === true, status: res.status, data };
}

/* After any successful sign-in: sync the app profile, then go to onboarding or home. */
export function useFinishSignIn() {
  const router = useRouter();
  const { updateProfile } = useApp();
  return (data: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
  };
}

export function startGoogleSignIn() {
  window.location.href = '/api/auth/google';
}
