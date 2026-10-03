/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Professor, UserProfile } from '@/types';
import {
  defaultLookingFor,
  degreesOffered,
  glanceRows,
  locationLine,
  lookingForRows,
  matchBreakdown,
  matchScore,
  parseGrant,
  shortName,
  similarFaculty,
  updatedLine,
  websiteLabel,
  withFacultyDefaults,
} from '@/lib/professorDetails';
import { mockProfessors } from '@/data/mockData';

const h = vi.hoisted(() => ({
  findUnique: (async () => null) as (args: any) => Promise<any>,
  count: (async () => 0) as () => Promise<number>,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { professor: { findUnique: (a: any) => h.findUnique(a), count: () => h.count(), findMany: async () => [] } },
}));

import { getProfessor, toProfessor } from '@/lib/professors';

const profile: UserProfile = {
  id: 'u', name: 'U', email: 'u@x.test', degreeLevel: 'Masters', specializations: ['UX Design', 'HCI'],
  targetCountries: ['Germany'], cgpa: 3.5, testScores: { ielts: 7 }, onboardingCompleted: true,
};

const prof = (over: Partial<Professor> = {}): Professor =>
  withFacultyDefaults({ ...mockProfessors.find((p) => p.id === 'prof_baudisch_hpi_06')!, ...over });

afterEach(() => {
  h.findUnique = async () => null;
  h.count = async () => 0;
});

describe('faculty mock data', () => {
  it('has unique ids, so list and details URLs match', () => {
    const ids = mockProfessors.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fills every field the details page needs', () => {
    for (const p of mockProfessors.map(withFacultyDefaults)) {
      expect(p.lookingFor, p.id).toBeDefined();
      expect(p.contactSteps, p.id).toHaveLength(3);
      expect(p.recentGrant?.amount, p.id).toBeTruthy();
      expect(p.city, p.id).toBeTruthy();
    }
  });
});

describe('faculty helpers', () => {
  it('splits a grant line into amount and title', () => {
    expect(parseGrant('$3.8M NSF Human-Centered Computing Grant')).toEqual({ amount: '$3.8M', title: 'NSF Human-Centered Computing Grant' });
    expect(parseGrant('Swiss National Science Foundation (SNSF) Advanced Investigator Grant (CHF 2.2M)')).toEqual({
      amount: 'CHF 2.2M',
      title: 'Swiss National Science Foundation (SNSF) Advanced Investigator Grant',
    });
    expect(parseGrant('1.2B KRW National Research Foundation of Korea (NRF) Grant')?.amount).toBe('1.2B KRW');
    expect(parseGrant('$2.4M ONR Young Investigator & NSF CAREER Award (2025-2028)')?.year).toBe(2025);
    expect(parseGrant('No amount here')).toBeUndefined();
    expect(parseGrant(undefined)).toBeUndefined();
  });

  it('formats names, places and links', () => {
    expect(shortName('Dr. Scott Klemmer')).toBe('Dr. Klemmer');
    expect(shortName('Prof. Dr. Rainer Malaka')).toBe('Prof. Dr. Malaka');
    expect(locationLine({ city: 'Potsdam', country: 'Germany' })).toBe('Potsdam, Germany');
    expect(locationLine({ city: 'Singapore', country: 'Singapore' })).toBe('Singapore');
    expect(locationLine({ country: 'Canada' })).toBe('Canada');
    expect(websiteLabel('https://www.dgp.toronto.edu/~dwigdor/')).toBe('dgp.toronto.edu/~dwigdor');
  });

  it('formats the profile-updated line', () => {
    const now = Date.parse('2026-10-03T12:00:00Z');
    expect(updatedLine(undefined, now)).toBeNull();
    expect(updatedLine('2026-10-03T08:00:00Z', now)).toBe('Profile updated today');
    expect(updatedLine('2026-09-26T08:00:00Z', now)).toBe('Profile updated 1 week ago');
    expect(updatedLine('2026-07-01T08:00:00Z', now)).toBe('Profile updated 3 months ago');
  });

  it('lists degrees PhD first', () => {
    expect(degreesOffered({ degreeLevels: ['Masters', 'PhD'] })).toEqual(['PhD', 'Masters']);
  });

  it('asks for the degree below PhD and stricter English in the USA', () => {
    const us = defaultLookingFor({ degreeLevels: ['PhD'], researchTags: ['HCI', 'Haptics', 'AR'], country: 'USA' });
    expect(us).toMatchObject({ degree: "Master's in HCI or Haptics", minIelts: 7, minToefl: 100, publications: 'preferred' });
    expect(defaultLookingFor({ degreeLevels: ['Masters'], researchTags: [], country: 'Germany' })).toMatchObject({
      degree: "Bachelor's degree",
      minIelts: 6.5,
      publications: 'none',
    });
  });

  it('leaves unknown Lab at a Glance rows out', () => {
    expect(glanceRows(prof()).map((r) => r.label)).toEqual(['Recent grant', 'Open positions']);
    const full = glanceRows(prof({ phdStudents: 5, postdocs: 2, publicationCount: 64, hIndex: 22, openPositionCount: 2 }));
    expect(full).toEqual([
      { label: 'Lab members', value: '5 PhD · 2 Postdocs' },
      { label: 'Publications', value: '64 · h-index 22' },
      { label: 'Recent grant', value: '€2.5M' },
      { label: 'Open positions', value: '2 PhD' },
    ]);
    expect(glanceRows(prof({ openPositions: false })).at(-1)).toEqual({ label: 'Open positions', value: 'None right now' });
  });
});

describe('faculty matching', () => {
  it('scores research fit, academics, language and experience', () => {
    expect(matchBreakdown(prof(), profile)).toEqual([
      { label: 'Research fit', percent: 100 },
      { label: 'Academic (CGPA)', percent: 100 },
      { label: 'Language (IELTS)', percent: 100 },
      { label: 'Experience', percent: 50 },
    ]);
    expect(matchScore(prof(), profile)).toBe(88);
    // Lab doesn't take Masters students → 20 points off
    expect(matchScore(prof({ degreeLevels: ['PhD'] }), profile)).toBe(68);
  });

  it('builds the What They Look For checklist with the student values', () => {
    const rows = lookingForRows(prof(), profile);
    expect(rows.map((r) => [r.label, r.met])).toEqual([
      ['Degree', true],
      ['English', true],
      ['Research', false],
      ['Publications', false],
    ]);
    expect(rows[1]).toMatchObject({ requirement: 'IELTS 6.5+ or TOEFL 90+', you: 'You: 7.0' });
    const low = lookingForRows(prof({ lookingFor: { degree: 'Any', minCgpa: 3.8, publications: 'required' } }), profile);
    expect(low.map((r) => r.label)).toEqual(['Degree', 'CGPA', 'Publications']);
    expect(low[1]).toMatchObject({ met: false, you: 'You: 3.5' });
  });

  it('suggests similar faculty without the same person twice', () => {
    const all = mockProfessors.map(withFacultyDefaults);
    const p = all.find((x) => x.id === 'prof_ishii_media_05')!;
    const similar = similarFaculty(p, all, profile);
    expect(similar).toHaveLength(3);
    expect(similar.map((s) => s.title)).not.toContain(p.name);
  });
});

describe('getProfessor', () => {
  it('falls back to mock data while the table is empty', async () => {
    const p = await getProfessor('prof_baudisch_hpi_06');
    expect(p?.name).toBe('Dr. Patrick Baudisch');
    expect(p?.lookingFor).toBeDefined();
    expect(await getProfessor('missing')).toBeNull();
  });

  it('returns null for an unknown id once the table has rows', async () => {
    h.count = async () => 3;
    expect(await getProfessor('prof_baudisch_hpi_06')).toBeNull();
  });

  it('maps a database row with its lab, grant and papers', async () => {
    const now = new Date('2026-09-26T00:00:00Z');
    const row = {
      id: 'prof_x', name: 'Prof. Sarah Lindqvist', title: 'Associate Professor', university: 'KTH', department: 'HCT',
      country: 'Sweden', universityId: 'u1', labId: 'l1', labName: null, researchTags: ['HCI'], openPositions: true,
      recentGrants: null, email: 's@kth.se', linkedInUrl: null, googleScholar: null, labWebsite: null, avatarUrl: null,
      acceptingTerms: ['Fall 2027'], school: 'School of EECS', bio: 'About her lab', publicationCount: 64, hIndex: 22,
      lookingFor: { degree: "Master's in HCI", minIelts: 6.5, publications: 'preferred' }, contactSteps: ['a', 'b', 'c'],
      createdAt: now, updatedAt: now,
      universityRef: { id: 'u1', name: 'KTH', country: 'Sweden', city: 'Stockholm', website: null, createdAt: now, updatedAt: now },
      lab: {
        id: 'l1', name: 'Accessible Interaction Lab', universityId: 'u1', department: null, website: 'https://accessible-lab.kth.se',
        researchTags: [], openPositions: true, fundingSummary: null, fundingType: 'FULL', fundingSource: 'Swedish Research Council',
        degreeLevels: ['PHD', 'MASTERS'], acceptingTerms: ['Fall 2027'], phdStudents: 5, postdocs: 2, openPositionCount: 2,
        createdAt: now, updatedAt: now,
      },
      grants: [{ id: 'g', title: 'VR grant', funder: null, amount: 'SEK 4.2M', year: 2025, labId: 'l1', professorId: 'prof_x', createdAt: now, updatedAt: now }],
      papers: [{ paper: { id: 'p1', title: 'Haptic Maps for Blind Travellers', venue: 'CHI', year: 2026 } }],
      _count: { papers: 1 },
    };
    h.findUnique = async () => row;
    const p = toProfessor(row as any);
    expect(p).toMatchObject({
      labName: 'Accessible Interaction Lab',
      labWebsite: 'https://accessible-lab.kth.se',
      city: 'Stockholm',
      degreeLevels: ['PhD', 'Masters'],
      recentGrant: { amount: 'SEK 4.2M', title: 'VR grant', year: 2025 },
      recentPapers: [{ id: 'p1', title: 'Haptic Maps for Blind Travellers', venue: 'CHI', year: 2026 }],
      updatedAt: now.toISOString(),
    });
    expect(glanceRows(p).map((r) => r.value)).toEqual(['5 PhD · 2 Postdocs', '64 · h-index 22', 'SEK 4.2M (2025)', '2 PhD']);
    expect((await getProfessor('prof_x'))?.school).toBe('School of EECS');
  });
});
