import type { UserProfile } from '@/types';

export const GUEST_PROFILE_ID = 'guest';

/** Profile before sign-in: empty, so nothing about a made-up student is shown or matched against. */
export const GUEST_PROFILE: UserProfile = {
  id: GUEST_PROFILE_ID,
  name: 'Guest',
  email: '',
  degreeLevel: 'Masters',
  specializations: [],
  targetCountries: [],
  cgpa: 0,
  testScores: {},
  onboardingCompleted: false,
};
