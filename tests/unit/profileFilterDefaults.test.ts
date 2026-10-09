import { describe, expect, it } from 'vitest';
import { profileFilterDefaults } from '@/hooks/useProfileFilterDefaults';

describe('profileFilterDefaults', () => {
  it('maps onboarding answers to feed filter values', () => {
    const d = profileFilterDefaults({
      specializations: ['Artificial Intelligence & Machine Learning', 'Human-Computer Interaction (HCI) & UX'],
      degreeLevel: 'PhD',
      targetCountries: ['USA', 'Germany'],
    });
    expect(d.subjects).toEqual(['Artificial Intelligence', 'Machine Learning', 'HCI', 'UX & Product Design']);
    expect(d.degrees).toEqual(['PhD']);
    expect(d.countries).toEqual(['USA', 'Germany']);
  });

  it('skips answers that have no filter equivalent', () => {
    const d = profileFilterDefaults({
      specializations: ['Public Health & Epidemiology'],
      degreeLevel: 'Bachelors',
      targetCountries: ['Ireland'],
    });
    expect(d.subjects).toEqual([]);
    expect(d.degrees).toEqual(['Bachelors']);
    expect(d.countries).toEqual([]);
  });

  it('handles an empty profile', () => {
    expect(profileFilterDefaults({})).toEqual({ subjects: [], degrees: [], countries: [] });
  });
});
