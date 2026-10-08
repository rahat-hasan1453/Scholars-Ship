/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Scholarship, UserProfile } from '@/types';
import {
  countryFlagEmoji,
  deriveFundingBreakdown,
  eligibilityRows,
  matchBreakdown,
  providerShortName,
  similarScholarships,
} from '@/lib/scholarshipDetails';

const h = vi.hoisted(() => ({
  findUnique: (async () => null) as (args: any) => Promise<any>,
  count: (async () => 0) as () => Promise<number>,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { scholarship: { findUnique: (a: any) => h.findUnique(a), count: () => h.count(), findMany: async () => [] } },
}));

import { getScholarship, toScholarship } from '@/lib/scholarships';

const profile: UserProfile = {
  id: 'u', name: 'U', email: 'u@x.test', degreeLevel: 'Masters', specializations: ['UX Design', 'HCI'],
  targetCountries: ['Germany'], cgpa: 3.5, testScores: { ielts: 7 }, onboardingCompleted: true,
};

const sch = (over: Partial<Scholarship> = {}): Scholarship => ({
  id: 's1', title: 'S', provider: 'German Academic Exchange Service (DAAD)', deadline: '2026-10-15T23:59:59Z',
  fundingAmount: '€992/mo Stipend + Travel Allowance', fundingType: 'FULL', degreeLevels: ['Masters'],
  countries: ['Germany'], specializations: ['UX Design', 'Product Design'], requirements: { minCgpa: 3.3, minIelts: 6.5 },
  officialUrl: 'https://x.test', description: 'd', tags: [], ...over,
});

afterEach(() => {
  h.findUnique = async () => null;
  h.count = async () => 0;
});

describe('scholarship details helpers', () => {
  it('splits a funding line into label/value rows', () => {
    expect(deriveFundingBreakdown('€992/mo Stipend + Travel Allowance')).toEqual([
      { label: 'Stipend', value: '€992/mo' },
      { label: 'Travel Allowance', value: 'Included' },
    ]);
    expect(deriveFundingBreakdown('1,000,000 KRW/mo + Round-trip Airfare')[0]).toEqual({ label: 'Award', value: '1,000,000 KRW/mo' });
  });

  it('shortens a provider with a trailing acronym', () => {
    expect(providerShortName('German Academic Exchange Service (DAAD)')).toBe('DAAD');
    expect(providerShortName('Stanford University')).toBe('Stanford University');
  });

  it('builds eligibility rows against the profile', () => {
    const rows = eligibilityRows(sch({ requirements: { minCgpa: 3.8, minIelts: 6.5, minWorkYears: 2 } }), profile);
    expect(rows.map((r) => [r.label, r.met, r.you])).toEqual([
      ['CGPA', false, 'You: 3.5'],
      ['IELTS', true, 'You: 7.0'],
      ['GRE', true, '—'],
      ['Work experience', false, 'You: not set'],
    ]);
  });

  it('scores match bars per criterion', () => {
    expect(matchBreakdown(sch(), profile)).toEqual([
      { label: 'Academic (CGPA)', percent: 100 },
      { label: 'Language (IELTS)', percent: 100 },
      { label: 'Field of study', percent: 50 },
    ]);
  });

  it('lists similar scholarships by shared country or field, excluding itself', () => {
    const all = [sch(), sch({ id: 's2', countries: ['Germany'] }), sch({ id: 's3', countries: ['Japan'], specializations: ['Law'] })];
    expect(similarScholarships(all[0], all, profile).map((x) => x.id)).toEqual(['s2']);
  });

  it('makes flag emoji from country names', () => {
    expect(countryFlagEmoji('Germany')).toBe('🇩🇪');
    expect(countryFlagEmoji('Atlantis')).toBe('');
  });
});

describe('getScholarship', () => {
  const row = {
    id: 's1', title: 'S', provider: 'P (PX)', deadline: new Date('2026-10-15T00:00:00Z'), fundingAmount: '€1 Grant',
    fundingType: 'FULL', degreeLevels: ['MASTERS', 'PHD'], countries: ['Germany'], specializations: ['UX'],
    requirementsJson: { minCgpa: 3 }, admissionSummary: null, livingCost: null, providerShort: null, fieldOfStudy: null,
    fundingBreakdown: null, applySteps: [], tags: ['t'], officialUrl: 'https://x.test', description: 'd', featured: false,
    createdAt: new Date('2026-10-01T00:00:00Z'), updatedAt: new Date(),
  };

  it('maps a database row and fills derived fields', async () => {
    h.findUnique = async () => row;
    const s = await getScholarship('s1');
    expect(s?.degreeLevels).toEqual(['Masters', 'PhD']);
    expect(s?.providerShort).toBe('PX');
    expect(s?.applySteps).toHaveLength(3);
    expect(toScholarship(row as any).createdAt).toBe('2026-10-01T00:00:00.000Z');
  });

  it('returns null for an unknown id when the table has rows', async () => {
    h.count = async () => 5;
    expect(await getScholarship('nope')).toBeNull();
  });

  it('returns null while the table is empty or the DB is down (no demo fallback)', async () => {
    expect(await getScholarship('sch_daad_design_02')).toBeNull();
    h.findUnique = async () => {
      throw new Error('down');
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await getScholarship('sch_daad_design_02')).toBeNull();
  });
});
