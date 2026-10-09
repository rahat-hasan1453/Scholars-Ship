import { describe, expect, it } from 'vitest';
import { profileFilterDefaults } from '@/hooks/useProfileFilterDefaults';
import { matchesSubjects, normalizeSubjects, SUBJECTS } from '@/data/subjectCatalog';

describe('profileFilterDefaults', () => {
  it('keeps every onboarding answer', () => {
    const d = profileFilterDefaults({
      specializations: ['Public Health & Epidemiology', 'Machine Learning', 'My custom field'],
      degreeLevel: 'PhD',
      targetCountries: ['USA', 'Ireland'],
    });
    expect(d.subjects).toEqual(['Public Health & Epidemiology', 'Machine Learning', 'My custom field']);
    expect(d.degrees).toEqual(['PhD']);
    expect(d.countries).toEqual(['USA', 'Ireland']);
  });

  it('turns old subject names into the current ones', () => {
    const d = profileFilterDefaults({
      specializations: ['Artificial Intelligence & Machine Learning', 'Human-Computer Interaction (HCI) & UX'],
    });
    expect(d.subjects).toEqual([
      'Artificial Intelligence',
      'Machine Learning',
      'Human-Computer Interaction (HCI)',
      'UX & Product Design',
    ]);
  });

  it('handles an empty profile', () => {
    expect(profileFilterDefaults({})).toEqual({ subjects: [], degrees: [], countries: [] });
  });
});

describe('subject catalog', () => {
  it('normalized names are all in the single list', () => {
    for (const s of normalizeSubjects(['HCI', 'Data Science', 'Robotics', 'Electrical Engineering'])) {
      expect(SUBJECTS).toContain(s);
    }
  });

  it('matches items by free-text tags, by exact custom name, and "All fields"', () => {
    expect(matchesSubjects([], ['anything'])).toBe(true);
    expect(matchesSubjects(['Neuroscience & Neurotechnology'], ['Brain-computer interfaces'])).toBe(true);
    expect(matchesSubjects(['My custom field'], ['my custom field'])).toBe(true);
    expect(matchesSubjects(['Cybersecurity'], ['All Fields'])).toBe(true);
    expect(matchesSubjects(['Cybersecurity'], ['Medieval poetry'])).toBe(false);
  });
});
