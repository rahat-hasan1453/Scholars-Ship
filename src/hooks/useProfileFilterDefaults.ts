'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_DEGREES } from '@/components/layout/UnifiedDiscoveryHeader';
import { normalizeSubjects } from '@/data/subjectCatalog';

interface Setters {
  setSubjects: (v: string[]) => void;
  setDegrees: (v: string[]) => void;
  setCountries: (v: string[]) => void;
}

export function profileFilterDefaults(profile: {
  specializations?: string[];
  degreeLevel?: string;
  targetCountries?: string[];
}) {
  const subjects = normalizeSubjects(profile.specializations);
  const degrees = profile.degreeLevel && ALL_DEGREES.includes(profile.degreeLevel) ? [profile.degreeLevel] : [];
  const countries = [...(profile.targetCountries ?? [])];
  return { subjects, degrees, countries };
}

// Starts a feed's filters from the user's onboarding answers (every chosen subject and country, unchanged). A filter the user already set (kept in sessionStorage) is left alone.
export function useProfileFilterDefaults(keyPrefix: string, { setSubjects, setDegrees, setCountries }: Setters) {
  const { profile } = useApp();
  const ready = profile.onboardingCompleted;

  useEffect(() => {
    if (!ready) return;
    const defaults = profileFilterDefaults(profile);
    const untouched = (name: string) => {
      try {
        return sessionStorage.getItem(`${keyPrefix}:${name}`) === null;
      } catch {
        return false;
      }
    };
    if (untouched('subjects') && defaults.subjects.length) setSubjects(defaults.subjects);
    if (untouched('degrees') && defaults.degrees.length) setDegrees(defaults.degrees);
    if (untouched('countries') && defaults.countries.length) setCountries(defaults.countries);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the profile's answers load, not on every setter identity change
  }, [ready, profile.specializations, profile.degreeLevel, profile.targetCountries, keyPrefix]);
}
