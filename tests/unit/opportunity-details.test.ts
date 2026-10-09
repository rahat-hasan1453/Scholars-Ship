/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Opportunity, UserProfile } from '@/types';
import {
  admissionLine,
  applicationCode,
  countryFlagSrc,
  eligibilityRows,
  fundingTagsFor,
  matchBreakdown,
  matchScore,
  normalizeCountry,
  postedLine,
  similarOpportunities,
  subjectTagsFor,
} from '@/lib/opportunityDetails';
import { OPPORTUNITY_LISTINGS } from '../fixtures/opportunityPosts';
import { ALL_COUNTRIES, ALL_FUNDING, ALL_SUBJECTS } from '@/components/layout/UnifiedDiscoveryHeader';

const h = vi.hoisted(() => ({
  findUnique: (async () => null) as (args: any) => Promise<any>,
  count: (async () => 0) as () => Promise<number>,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { opportunity: { findUnique: (a: any) => h.findUnique(a), count: () => h.count(), findMany: async () => [] } },
}));

import { getOpportunity, toOpportunity } from '@/lib/opportunities';

const profile: UserProfile = {
  id: 'u', name: 'U', email: 'u@x.test', degreeLevel: 'Masters', specializations: ['UX Design', 'HCI'],
  targetCountries: ['Germany'], cgpa: 3.5, testScores: { ielts: 7 }, onboardingCompleted: true,
};

const opp = (over: Partial<Opportunity> = {}): Opportunity => ({
  ...OPPORTUNITY_LISTINGS.find((o) => o.id === 'opp_bremen_ux_03')!,
  ...over,
});

afterEach(() => {
  h.findUnique = async () => null;
  h.count = async () => 0;
});

describe('opportunity listing data', () => {
  it('has unique ids and filter values the header knows about', () => {
    const ids = OPPORTUNITY_LISTINGS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(30);
    for (const o of OPPORTUNITY_LISTINGS) {
      expect(ALL_COUNTRIES, o.id).toContain(o.country);
      for (const s of o.subjectTags) expect(ALL_SUBJECTS).toContain(s);
      for (const f of o.fundingTags) expect(ALL_FUNDING).toContain(f);
    }
  });

  it('ships a flag for every listed country', () => {
    for (const o of OPPORTUNITY_LISTINGS) {
      const src = countryFlagSrc(o.country);
      expect(src, o.country).not.toBeNull();
      expect(existsSync(join(process.cwd(), 'public', src!)), src!).toBe(true);
    }
  });

  it('has the fields the details page shows', () => {
    for (const o of OPPORTUNITY_LISTINGS) {
      expect(o.positionDetails.length, o.id).toBeGreaterThan(0);
      expect(o.applySteps.length, o.id).toBe(3);
      expect(Number.isNaN(Date.parse(o.deadline!)), o.id).toBe(false);
    }
  });
});

describe('opportunity helpers', () => {
  it('maps free-text field tags to Subject filter values', () => {
    expect(subjectTagsFor(['UX Design', 'Human-Computer Interaction (HCI)', 'Robotics'])).toEqual([
      'Human-Computer Interaction (HCI)',
      'UX & Product Design',
      'Robotics & Autonomous Systems',
    ]);
    expect(subjectTagsFor(['Economics'])).toEqual(['Economics & Quantitative Finance']);
    expect(subjectTagsFor(['Medieval poetry'])).toEqual([]);
  });

  it('derives Acceptance & Funding tags', () => {
    expect(fundingTagsFor('Full Tuition Waiver + $36,000/yr Graduate Research Assistantship', 20)).toEqual([
      'Safe Regional',
      'Tuition Waiver',
      'Full Funding',
      'Graduate Assistantship (TA/RA)',
    ]);
    expect(fundingTagsFor('€54,000/yr Official TV-L Salary + €0 Tuition', 10)).toEqual([
      'Tuition Waiver',
      'Full Funding',
      'Stipend / Living Allowance',
    ]);
    expect(fundingTagsFor('Something', 90)).toContain('High Acceptance (85%+)');
  });

  it('normalises the UK country name', () => {
    expect(normalizeCountry('UK')).toBe('United Kingdom');
    expect(normalizeCountry('Germany')).toBe('Germany');
  });

  it('builds the card admission line', () => {
    expect(admissionLine({ minCgpa: 3, minIelts: 6.5, degreeLevels: ['Masters', 'PhD'] })).toBe(
      'CGPA 3.0+, IELTS 6.5+, Open to Masters & PhD',
    );
  });

  it('builds a short email subject code', () => {
    expect(applicationCode({ subjectTags: ['Human-Computer Interaction (HCI)'], fieldTags: [], degreeLevels: ['PhD'], startDate: 'January 2027' })).toBe('HCI-PhD-2027');
    expect(applicationCode({ subjectTags: [], fieldTags: ['Physics'], degreeLevels: ['Masters'], startDate: 'October 2027' })).toBe(
      'PHYSICS-Masters-2027',
    );
  });

  it('formats the posted line', () => {
    const now = Date.parse('2026-10-03T12:00:00Z');
    expect(postedLine({ source: 'linkedin', postedAt: '2026-10-01T00:00:00Z' }, now)).toBe('Posted on LinkedIn · 2 days ago');
    expect(postedLine({ source: 'lab_website', postedAt: '2026-10-03T00:00:00Z' }, now)).toBe('Posted on the lab website · today');
  });

  it('checks eligibility against the profile', () => {
    const rows = eligibilityRows(opp({ minIelts: 7.5, minCgpa: 3.0, publications: 'preferred' }), profile);
    expect(rows.map((r) => [r.label, r.met])).toEqual([
      ['Degree', true],
      ['English', false],
      ['CGPA', true],
      ['Publications', false],
    ]);
    expect(rows[1]).toMatchObject({ requirement: 'IELTS 7.5+', you: 'You: 7.0' });
  });

  it('scores the match bars and overall match', () => {
    const o = opp({ minCgpa: 3.5, minIelts: 7, publications: 'none' });
    expect(matchBreakdown(o, profile)).toEqual([
      { label: 'Academic (CGPA)', percent: 100 },
      { label: 'Language (IELTS)', percent: 100 },
      { label: 'Research fit', percent: 100 },
      { label: 'Publications', percent: 100 },
    ]);
    expect(matchScore(o, profile)).toBe(100);
    // Degree level not offered costs 20 points
    expect(matchScore({ ...o, degreeLevels: ['PhD'] }, profile)).toBe(80);
  });

  it('lists similar opportunities, excluding the current one', () => {
    const o = opp();
    const similar = similarOpportunities(o, OPPORTUNITY_LISTINGS, profile);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.length).toBeLessThanOrEqual(3);
    expect(similar.map((s) => s.id)).not.toContain(o.id);
  });
});

describe('opportunity data access', () => {
  it('maps a database row', () => {
    const o = opp();
    const row: any = {
      ...o,
      degreeLevels: ['MASTERS', 'PHD'],
      postedAt: new Date(o.postedAt),
      deadline: new Date(o.deadline!),
      authorAvatar: null,
      labName: null,
      city: null,
      contactEmail: null,
      officialUrl: null,
      minCgpa: null,
      minIelts: 6.5,
      professorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mapped = toOpportunity(row);
    expect(mapped.degreeLevels).toEqual(['Masters', 'PhD']);
    expect(mapped.labName).toBeUndefined();
    expect(mapped.minCgpa).toBeUndefined();
    expect(mapped.deadline).toBe(o.deadline);
  });

  it('returns null for an unknown id (no demo fallback)', async () => {
    expect(await getOpportunity('opp_bremen_ux_03')).toBeNull();
  });

  it('returns null when the database is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    h.findUnique = async () => {
      throw new Error('down');
    };
    expect(await getOpportunity('opp_cmu_hcii_ux_01')).toBeNull();
  });
});
