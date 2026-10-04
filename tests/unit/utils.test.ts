import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateCountdown, calculateMatchScore, formatFunding, formatPercentRange } from '@/lib/utils';
import type { Scholarship, UserProfile } from '@/types';

const scholarship = (over: Partial<Scholarship> = {}) =>
  ({ degreeLevels: ['Masters'], countries: ['Germany'], specializations: ['Computer Science'], ...over }) as Scholarship;
const profile = (over: Partial<UserProfile> = {}) =>
  ({ degreeLevel: 'Masters', targetCountries: ['germany'], specializations: ['Computer Science'], ...over }) as UserProfile;

describe('calculateMatchScore', () => {
  it('scores a full match at the 99 cap', () => {
    expect(calculateMatchScore(scholarship(), profile())).toBe(99);
  });
  it('starts from 50 when nothing matches', () => {
    expect(calculateMatchScore(scholarship(), profile({ degreeLevel: 'PhD', targetCountries: ['Japan'], specializations: ['Biology'] }))).toBe(50);
  });
  it('adds degree +25, country +15, specialization +10', () => {
    const none: Partial<UserProfile> = { degreeLevel: 'PhD', targetCountries: ['Japan'], specializations: ['Biology'] };
    expect(calculateMatchScore(scholarship(), profile({ ...none, degreeLevel: 'Masters' }))).toBe(75);
    expect(calculateMatchScore(scholarship(), profile({ ...none, targetCountries: ['GERMANY'] }))).toBe(65);
    expect(calculateMatchScore(scholarship(), profile({ ...none, specializations: ['computer science & AI'] }))).toBe(60);
  });
  // BUG-08: an empty specialization string matches everything ("x".includes("") === true).
  it.fails('does not award the specialization bonus for an empty string', () => {
    expect(calculateMatchScore(scholarship({ specializations: [''] }), profile({ degreeLevel: 'PhD', targetCountries: [], specializations: ['Biology'] }))).toBe(50);
  });
});

describe('formatFunding', () => {
  it.each([
    ['FULL', 'Fully Funded'],
    ['PARTIAL', 'Partial Funding'],
    ['TUITION_WAIVER', 'Tuition Waiver'],
    ['SOMETHING_ELSE', 'Grant / Stipend'],
  ])('%s -> %s', (input, out) => expect(formatFunding(input)).toBe(out));
});

describe('calculateCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('marks past deadlines as expired', () => {
    expect(calculateCountdown('2026-09-30T00:00:00Z')).toMatchObject({ isExpired: true, formatted: 'Deadline Passed' });
  });
  it('urgent within 7 days, warning within 30, normal beyond', () => {
    expect(calculateCountdown('2026-10-05T00:00:00Z').urgency).toBe('urgent');
    expect(calculateCountdown('2026-10-20T00:00:00Z').urgency).toBe('warning');
    expect(calculateCountdown('2026-12-01T00:00:00Z').urgency).toBe('normal');
  });
  it('formats days/hours, and hours/minutes on the last day', () => {
    expect(calculateCountdown('2026-10-03T05:00:00Z').formatted).toBe('2d 5h left');
    expect(calculateCountdown('2026-10-01T03:30:00Z').formatted).toBe('3h 30m left!');
  });
  // BUG-07: an invalid/empty deadline renders "NaNd NaNh left".
  it.fails('handles an invalid deadline without NaN', () => {
    expect(calculateCountdown('not-a-date').formatted).not.toContain('NaN');
  });
});

describe('formatPercentRange', () => {
  it('returns null for an empty list', () => expect(formatPercentRange([])).toBeNull());
  it('returns a single value when min equals max', () => expect(formatPercentRange([85, 85])).toBe('85%'));
  it('returns min – max', () => expect(formatPercentRange([92, 75, 88])).toBe('75% – 92%'));
});
