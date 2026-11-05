import { describe, it, expect } from 'vitest';
import { ANY_COUNTRY, WORLD_COUNTRIES, studyCountryMatches } from '@/data/countries';

describe('studyCountryMatches', () => {
  it('no pick means no filter', () => {
    expect(studyCountryMatches(['Japan'], [])).toBe(true);
  });
  it('matches the picked countries the way the feed always did', () => {
    expect(studyCountryMatches(['Germany'], ['USA', 'Germany'])).toBe(true);
    expect(studyCountryMatches(['Germany'], ['USA', 'Canada'])).toBe(false);
    expect(studyCountryMatches(['United Kingdom'], ['united kingdom'])).toBe(true);
  });
  it('"Any country" fits every pick', () => {
    expect(studyCountryMatches([ANY_COUNTRY], ['Norway'])).toBe(true);
    expect(studyCountryMatches([ANY_COUNTRY, 'Japan'], ['Brazil'])).toBe(true);
  });
  it('is not a real country: no dropdown or onboarding list shows it', () => {
    expect(WORLD_COUNTRIES.some((c) => c.value === ANY_COUNTRY)).toBe(false);
  });
});
