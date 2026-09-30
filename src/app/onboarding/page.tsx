'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/OnboardingModal';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated) {
          router.replace('/login');
        } else if (data.user?.onboardingCompleted) {
          router.replace('/');
        }
      })
      .catch(() => {});
  }, [router]);

  return <OnboardingFlow isStandalonePage={true} />;
}
