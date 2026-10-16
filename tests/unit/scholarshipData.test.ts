import { describe, expect, it } from 'vitest';
import { BATCHES, CURATED_SCHOLARSHIPS, CURATED_VERIFIED_ON, SCHOLARSHIPS } from '../../prisma/data/scholarships';
import { scholarshipSchema, type ScholarshipSeed } from '../../prisma/data/scholarships/schema';
import { checkEntries } from '../../prisma/import/scholarshipCheck';
import { WORLD_COUNTRIES } from '@/data/countries';
import { matchesSubjects, SUBJECTS } from '@/data/subjectCatalog';

const sources = [
  { file: '_curated.ts', entries: CURATED_SCHOLARSHIPS, legacyIds: true },
  ...Object.entries(BATCHES).map(([file, entries]) => ({ file, entries })),
];

const entry = (over: Partial<ScholarshipSeed> = {}): ScholarshipSeed => ({
  id: 'gov-jp-mext-research',
  title: 'MEXT Research Student Scholarship',
  provider: 'Government of Japan (MEXT)',
  providerCountry: 'Japan',
  deadline: '2027-05-15T00:00:00Z',
  deadlineEstimated: true,
  fundingAmount: 'Monthly stipend + tuition + airfare',
  fundingType: 'FULL',
  degreeLevels: ['Masters', 'PhD'],
  countries: ['Japan'],
  specializations: ['All fields'],
  requirements: {},
  officialUrl: 'https://www.studyinjapan.go.jp/en/smap-stopj-applications-research.html',
  sourceUrl: 'https://www.studyinjapan.go.jp/en/smap-stopj-applications-research.html',
  verifiedOn: '2026-10-01',
  description: 'Japanese government scholarships for graduate research at Japanese universities.',
  tags: [],
  ...over,
});

describe('scholarship data', () => {
  it('passes every rule, with unique ids and official links', () => {
    const { problems, valid } = checkEntries(sources);
    expect(problems.filter((p) => p.level === 'error')).toEqual([]);
    expect(valid.length).toBe(SCHOLARSHIPS.length);
  });

  it('keeps the curated ids that bookmarks and applications point at', () => {
    // 24 at first; SINGA was dropped on 2026-10-16 when A*STAR took its page down
    expect(CURATED_SCHOLARSHIPS.length).toBe(23);
    expect(CURATED_SCHOLARSHIPS.every((s) => s.id.startsWith('sch_'))).toBe(true);
  });

  it('gives curated entries CURATED_VERIFIED_ON unless they were re-checked later', () => {
    const recheck = CURATED_SCHOLARSHIPS.filter((s) => s.verifiedOn !== CURATED_VERIFIED_ON).map((s) => s.id);
    expect(recheck.sort()).toEqual(['sch_kaust_fellowship', 'sch_stipendium_hungaricum', 'sch_turkiye_burslari']);
  });

  it('uses catalog countries, and every scholarship is found by some Subject filter', () => {
    const countries = new Set(WORLD_COUNTRIES.map((c) => c.value));
    for (const s of SCHOLARSHIPS) {
      for (const c of [...s.countries, ...(s.providerCountry ? [s.providerCountry] : [])]) expect(countries, s.id).toContain(c);
      expect(SUBJECTS.some((subject) => matchesSubjects([subject], s.specializations)), s.id).toBe(true);
    }
  });
});

describe('scholarship rules', () => {
  const errors = (raw: unknown, legacyIds = false) =>
    checkEntries([{ file: 'batch.ts', entries: [raw], legacyIds }], new Date('2026-10-16')).problems.filter((p) => p.level === 'error');

  it('accepts a well-formed new entry', () => {
    expect(scholarshipSchema.safeParse(entry()).success).toBe(true);
    expect(errors(entry({ id: 'gov-int-world-bank-jj', providerCountry: undefined }))).toEqual([]);
  });

  it.each([
    ['old-style id', { id: 'sch_mext' }],
    ['unknown country code in id', { id: 'gov-zz-mext' }],
    ['http link', { officialUrl: 'http://example.gov/x' }],
    ['date-only deadline', { deadline: '2027-05-15' }],
    ['country outside the catalog', { countries: ['Japon'] }],
    ['future verifiedOn', { verifiedOn: '2999-01-01' }],
    ['IELTS above 9', { requirements: { minIelts: 10 } }],
  ])('rejects %s', (_label, over) => {
    expect(errors(entry(over as Partial<ScholarshipSeed>)).length).toBeGreaterThan(0);
  });

  it('rejects a missing verifiedOn and unknown fields', () => {
    const noDate: Partial<ScholarshipSeed> = entry();
    delete noDate.verifiedOn;
    expect(errors(noDate).length).toBeGreaterThan(0);
    expect(errors({ ...entry(), amount: 5 }).length).toBeGreaterThan(0);
  });

  it('flags repeated ids and officialUrls across files', () => {
    const a = entry();
    const b = entry({ id: 'gov-jp-mext-masters', officialUrl: `${a.officialUrl}/#apply` });
    const { problems } = checkEntries([
      { file: 'a.ts', entries: [a] },
      { file: 'b.ts', entries: [a, b] },
    ]);
    const messages = problems.map((p) => p.message);
    expect(messages.some((m) => m.startsWith('id is already used'))).toBe(true);
    expect(messages.filter((m) => m.startsWith('officialUrl is already used')).length).toBe(2);
  });

  it('warns (not fails) on a stale verifiedOn and an off-catalog subject', () => {
    const { problems } = checkEntries(
      [{ file: 'batch.ts', entries: [entry({ verifiedOn: '2025-09-01', specializations: ['Civil Engineering'] })] }],
      new Date('2026-10-16'),
    );
    expect(problems.map((p) => p.level)).toEqual(['warning', 'warning']);
  });
});
