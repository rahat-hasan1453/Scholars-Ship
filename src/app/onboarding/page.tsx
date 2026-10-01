'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/OnboardingModal';

export default function OnboardingPage() {
  const router = useRouter();
  const [account, setAccount] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated) {
          router.replace('/login');
        } else if (data.user?.onboardingCompleted) {
          router.replace('/');
        } else {
          setAccount({ name: data.user?.name, email: data.user?.email });
        }
      })
      .catch(() => {});
  }, [router]);

  return <OnboardingFlow isStandalonePage={true} account={account} />;
}
