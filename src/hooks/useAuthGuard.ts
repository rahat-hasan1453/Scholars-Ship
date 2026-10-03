'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sends signed-out users to /login and unfinished profiles to /onboarding
export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated) {
          router.replace('/login');
        } else if (!data.user?.onboardingCompleted) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [router]);
}
