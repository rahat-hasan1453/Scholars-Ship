import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { RorRecord } from '@/lib/ingest/ror';
import { SUBJECTS } from '@/data/subjectCatalog';
import { staleFacultyWhere } from '../../prisma/facultyFiles';
import {
  type Candidate,
  type OpenAlexAuthor,
  SUBJECT_OPENALEX,
  cellCap,
  createOpenAlexClient,
  fromDate,
  groupUrl,
  selectResearchers,
} from '../../prisma/import/openalexResearchers';

const ror = (id: string, name: string, country: string, extra: Partial<RorRecord> = {}): RorRecord => ({
  id: `https://ror.org/${id}`, name, country, city: '', aliases: [], acronyms: [], ...extra,
});
const RORS = [ror('dhaka', 'University of Dhaka', 'Bangladesh'), ror('mit', 'Massachusetts Institute of Technology', 'USA'), ror('nsf', 'National Science Foundation', 'USA', { nonHost: true })];
const rorById = new Map(RORS.map((r) => [r.id, r]));

const author = (id: string, over: Partial<OpenAlexAuthor> = {}): OpenAlexAuthor => ({
  id: `https://openalex.org/${id}`,
  orcid: null,
  display_name: `Person ${id}`,
  works_count: 80,
  summary_stats: { h_index: 20 },
  last_known_institutions: [{ ror: 'https://ror.org/dhaka', display_name: 'Dhaka Uni (OpenAlex spelling)', country_code: 'US', type: 'education' }],
  topics: [{ display_name: 'Infectious Disease Epidemiology' }, { display_name: 'COVID-19 epidemiological studies' }],
  ...over,
});

const SUBJECT = 'Public Health & Epidemiology';
const run = (cands: Candidate[], authors: OpenAlexAuthor[], existing = { openAlexIds: new Set<string>(), orcids: new Set<string>() }) => {
  const byId = new Map(authors.map((a) => [a.id.replace('https://openalex.org/', ''), a]));
  const getAuthors = vi.fn(async (ids: string[]) => new Map(ids.filter((i) => byId.has(i)).map((i) => [i, byId.get(i)!])));
  const groups = new Map([[SUBJECT, new Map([['bd', cands]])]]);
  return { getAuthors, result: selectResearchers({ groups, getAuthors, rorById, existing }) };
};
const cand = (id: string, recentWorks = 10): Candidate => ({ authorId: `https://openalex.org/${id}`, recentWorks });

describe('subject → OpenAlex map', () => {
  it('covers every subject except Computer Science, each with ids', () => {
    expect(Object.keys(SUBJECT_OPENALEX).sort()).toEqual(SUBJECTS.filter((s) => s !== 'Computer Science').sort());
    for (const m of Object.values(SUBJECT_OPENALEX)) {
      expect(m.ids.length).toBeGreaterThan(0);
      for (const id of m.ids) expect(id).toMatch(m.by === 'subfield' ? /^\d{4}$/ : /^T\d+$/);
    }
  });

  it('asks OpenAlex for recent works at education institutions of one country, grouped by author', () => {
    const url = groupUrl(SUBJECT, 'bd', fromDate(new Date('2026-10-28T00:00:00Z')), 'me@example.com');
    expect(url).toContain('primary_topic.subfield.id:2739|2713');
    expect(url).toContain('from_publication_date:2023-10-28');
    expect(url).toContain('authorships.institutions.country_code:bd,authorships.institutions.type:education');
    expect(url).toContain('group_by=authorships.author.id');
    expect(groupUrl('Machine Learning', 'us', '2023-10-28', 'x')).toContain('primary_topic.id:T12072|');
  });
});

describe('selection rules', () => {
  it('keeps a senior researcher; country and university come from ROR, not OpenAlex', async () => {
    const { researchers } = await run([cand('A1')], [author('A1')]).result;
    expect(researchers).toHaveLength(1);
    expect(researchers[0]).toMatchObject({ id: 'oa_A1', university: 'University of Dhaka', country: 'Bangladesh', department: SUBJECT, dataSource: 'OpenAlex' });
  });

  it('drops juniors: too few recent works, low h-index or few works', async () => {
    const { researchers } = await run(
      [cand('A1', 4), cand('A2'), cand('A3')],
      [author('A1'), author('A2', { summary_stats: { h_index: 9 } }), author('A3', { works_count: 19 })],
    ).result;
    expect(researchers).toEqual([]);
  });

  it('drops authors whose institution is not education, has no ROR id, is not in our index, or is a funder', async () => {
    const inst = (ror: string | null, type = 'education') => ({ last_known_institutions: [{ ror, display_name: 'X', country_code: 'BD', type }] });
    const { researchers } = await run(
      [cand('A1'), cand('A2'), cand('A3'), cand('A4')],
      [author('A1', inst('https://ror.org/dhaka', 'company')), author('A2', inst(null)), author('A3', inst('https://ror.org/unknown')), author('A4', inst('https://ror.org/nsf'))],
    ).result;
    expect(researchers).toEqual([]);
  });

  it('counts a co-author only in the country they are based in', async () => {
    const atMit = { last_known_institutions: [{ ror: 'https://ror.org/mit', display_name: 'MIT', country_code: 'US', type: 'education' }] };
    const { researchers } = await run([cand('A1')], [author('A1', atMit)]).result;
    expect(researchers).toEqual([]);
  });

  it('skips people already in CSRankings, by OpenAlex id or ORCID', async () => {
    const { researchers } = await run(
      [cand('A1'), cand('A2'), cand('A3')],
      [author('A1'), author('A2', { orcid: 'https://orcid.org/0000-0001-2345-6789' }), author('A3')],
      { openAlexIds: new Set(['A1']), orcids: new Set(['0000-0001-2345-6789']) },
    ).result;
    expect(researchers.map((r) => r.id)).toEqual(['oa_A3']);
  });

  it('stops at the subject × country cap', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `A${i + 1}`);
    const { researchers, counts } = await run(ids.map((i) => cand(i)), ids.map((i) => author(i))).result;
    expect(researchers).toHaveLength(cellCap(3)); // Bangladesh has 3 institutions in COUNTRY_QUOTA
    expect(counts.get(SUBJECT)?.get('Bangladesh')).toBe(6);
  });

  it('only looks up authors that pass the recent-works rule', async () => {
    const { getAuthors, result } = run([cand('A1'), cand('A2', 1)], [author('A1'), author('A2')]);
    await result;
    expect(getAuthors).toHaveBeenCalledWith(['A1']);
  });
});

describe('researcher fields', () => {
  it('is never titled Professor, has the subject tag and no invented contact data', async () => {
    const { researchers } = await run([cand('A1')], [author('A1', { orcid: 'https://orcid.org/0000-0002-4892-745X' })]).result;
    const r = researchers[0];
    expect(r.title).toBe(`Researcher · ${SUBJECT}`);
    expect(r.title).not.toMatch(/professor/i);
    expect(r.title).not.toMatch(/\bPI\b/);
    expect(r.researchTags[0]).toBe(SUBJECT);
    expect(r.researchTags).toContain('Infectious Disease Epidemiology');
    expect(r).toMatchObject({ email: null, grant: null, googleScholar: null, homepage: 'https://orcid.org/0000-0002-4892-745X', orcid: '0000-0002-4892-745X' });
  });

  it('links the OpenAlex page when there is no ORCID', async () => {
    const { researchers } = await run([cand('A1')], [author('A1')]).result;
    expect(researchers[0].homepage).toBe('https://openalex.org/A1');
  });
});

describe('OpenAlex client', () => {
  it('caches answers and retries a 429', async () => {
    const cacheDir = mkdtempSync(path.join(tmpdir(), 'oa-'));
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    const get = createOpenAlexClient({ cacheDir, gapMs: 0, retryMs: 0, fetchFn, log: () => {} });
    expect(await get('https://api.openalex.org/x?a=1&mailto=a@b.c')).toEqual({ ok: 1 });
    expect(await get('https://api.openalex.org/x?a=1&mailto=other@b.c')).toEqual({ ok: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe('seed delete rule for faculty', () => {
  it('removes only rows in neither file', () => {
    expect(staleFacultyWhere(['prof_a', 'oa_A1'])).toEqual({ id: { notIn: ['prof_a', 'oa_A1'] } });
  });
});
