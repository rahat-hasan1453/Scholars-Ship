import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import { toListProfessor, toProfessor } from '@/lib/professors';

const row = {
  id: 'oa_A1', name: 'Ada Lovelace', title: 'Researcher · Biology', university: 'TU Munich', department: 'Biology', country: 'Germany',
  universityId: null, universityRef: null, labId: null, lab: null, labName: null, researchTags: ['Biology', 'Genomics'], openPositions: false,
  recentGrants: null, email: null, linkedInUrl: null, googleScholar: null, orcid: null, openAlexId: 'A1', dataSource: 'OpenAlex',
  labWebsite: null, avatarUrl: null, acceptingTerms: [], school: null, bio: null, publicationCount: 40, hIndex: 12, lookingFor: null,
  contactSteps: [], createdAt: new Date(), updatedAt: new Date('2026-10-01'), grants: [], _count: { papers: 0 },
} as unknown as Parameters<typeof toListProfessor>[0];

describe('professor list item', () => {
  it('leaves out details-only extras and the generated avatar', () => {
    const p = toListProfessor(row);
    expect(p.recentPapers).toBeUndefined();
    expect(p.contactSteps).toBeUndefined();
    expect(p.avatarUrl).toBe('');
    expect(p).toMatchObject({ id: 'oa_A1', name: 'Ada Lovelace', country: 'Germany', hIndex: 12, researchTags: ['Biology', 'Genomics'] });
  });
  it('keeps a real avatar url', () => {
    expect(toListProfessor({ ...row, avatarUrl: 'https://x.test/a.jpg' }).avatarUrl).toBe('https://x.test/a.jpg');
  });
  it('the details version still has contact steps and a generated avatar', () => {
    const p = toProfessor({ ...row, papers: [] });
    expect(p.contactSteps?.length).toBe(3);
    expect(p.avatarUrl).toMatch(/^data:image\/svg/);
  });
});
