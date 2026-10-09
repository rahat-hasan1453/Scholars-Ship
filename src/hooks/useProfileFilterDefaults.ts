'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_COUNTRIES, ALL_DEGREES, ALL_SUBJECTS } from '@/components/layout/UnifiedDiscoveryHeader';

// Onboarding specialization -> subject names used by the feed filters (specializations without a filter equivalent are skipped)
const SPECIALIZATION_TO_SUBJECTS: Record<string, string[]> = {
  'Computer Science': ['Computer Science'],
  'Artificial Intelligence & Machine Learning': ['Artificial Intelligence', 'Machine Learning'],
  'Data Science & Analytics': ['Data Science'],
  'Biomedical Engineering': ['Biomedical Informatics'],
  'Electrical & Computer Engineering': ['Electrical Engineering'],
  'Robotics & Autonomous Systems': ['Robotics'],
  'Human-Computer Interaction (HCI) & UX': ['HCI', 'UX & Product Design'],
  'Software Engineering & Distributed Systems': ['Computer Science'],
};

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
  const subjects = [...new Set((profile.specializations ?? []).flatMap((s) => SPECIALIZATION_TO_SUBJECTS[s] ?? []))].filter((s) =>
    ALL_SUBJECTS.includes(s),
  );
  const degrees = profile.degreeLevel && ALL_DEGREES.includes(profile.degreeLevel) ? [profile.degreeLevel] : [];
  const countries = (profile.targetCountries ?? []).filter((c) => ALL_COUNTRIES.includes(c));
  return { subjects, degrees, countries };
}

// Starts a feed's filters from the user's onboarding answers. A filter the user already set (kept in sessionStorage) is left alone.
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
