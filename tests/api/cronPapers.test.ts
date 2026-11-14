/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A tiny in-memory stand-in for the two tables the cron touches
const db = vi.hoisted(() => ({ papers: [] as any[] }));
vi.mock('@/lib/prisma', () => {
  const matches = (row: any, where: any): boolean => {
    if (where.OR) return where.OR.some((w: any) => matches(row, w));
    return Object.entries(where).every(([key, cond]: [string, any]) =>
      cond && typeof cond === 'object' && 'in' in cond ? cond.in.includes(row[key]) : row[key] === cond,
    );
  };
  return {
    prisma: {
      professor: {
        findMany: async () => [
          { id: 'prof_1', openAlexId: 'A1' },
          { id: 'prof_2', openAlexId: 'A2' },
        ],
      },
      researchPaper: {
        count: async ({ where }: any) => db.papers.filter((r) => matches(r, where)).length,
        findMany: async ({ where }: any) => db.papers.filter((r) => matches(r, where)),
        createMany: async ({ data }: any) => {
          let count = 0;
          for (const row of data) {
            if (db.papers.some((r) => r.id === row.id || r.openAlexId === row.openAlexId || (row.doi && r.doi === row.doi))) continue;
            db.papers.push({ ...row, authors: [] });
            count++;
          }
          return { count };
        },
        update: async ({ where, data }: any) => Object.assign(db.papers.find((r) => r.id === where.id), data),
      },
      paperAuthor: {
        createMany: async ({ data }: any) => {
          for (const { paperId, ...a } of data) db.papers.find((r) => r.id === paperId).authors.push(a);
          return { count: data.length };
        },
      },
    },
  };
});

import { GET } from '@/app/api/cron/papers/route';

const ABSTRACT = 'We study how graduate students choose supervisors using a large survey across many universities and fields of study';
const index = Object.fromEntries(ABSTRACT.split(' ').map((w, i) => [w, [i]]));
const work = (n: number, author: string, date: string, extra: Record<string, unknown> = {}) => ({
  id: `https://openalex.org/W${n}`,
  doi: `https://doi.org/10.1000/${n}`,
  title: `Paper ${n}`,
  publication_date: date,
  publication_year: Number(date.slice(0, 4)),
  type: 'article',
  cited_by_count: n,
  abstract_inverted_index: index,
  primary_location: null,
  best_oa_location: null,
  open_access: null,
  primary_topic: null,
  authorships: [{ author: { id: `https://openalex.org/${author}`, display_name: author }, institutions: [] }],
  ...extra,
});
const RESULTS = [work(1, 'A1', '2026-03-01'), work(2, 'A2', '2025-07-15'), work(3, 'A1', '2025-01-10', { type: 'preprint' })];

const cronRequest = (auth?: string) => new Request('http://localhost/api/cron/papers', { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  db.papers = [];
  process.env.CRON_SECRET = 'test-secret';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: RESULTS }), { status: 200 })));
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/cron/papers', () => {
  it('returns 401 without the cron secret', async () => {
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
    expect((await GET(cronRequest('Bearer wrong'))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('backfills from 2025 on the first run and saves the new papers as cron papers', async () => {
    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();
    expect(body).toMatchObject({ success: true, fromDate: '2025-01-01', kept: 3, added: 3, updated: 0 });
    expect(db.papers.map((p) => p.id).sort()).toEqual(['paper_W1', 'paper_W2', 'paper_W3']);
    expect(db.papers.every((p) => p.importedBy === 'cron')).toBe(true);
    expect(db.papers.find((p) => p.id === 'paper_W2').authors[0]).toMatchObject({ name: 'A2', professorId: 'prof_2' });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('author.id:A1|A2,from_publication_date:2025-01-01');
    expect(url).toContain('type:article|conference-paper|preprint');
    expect(url).toContain('sort=publication_date:desc');
  });

  it('adds no duplicates when it runs again, and only looks at recent days', async () => {
    await GET(cronRequest('Bearer test-secret'));
    const body = await (await GET(cronRequest('Bearer test-secret'))).json();
    expect(body).toMatchObject({ success: true, added: 0, updated: 0 });
    expect(body.fromDate).not.toBe('2025-01-01');
    expect(db.papers).toHaveLength(3);
  });

  it('keeps seed papers as they are and skips a work whose DOI another row already has', async () => {
    db.papers.push({ id: 'paper_W1', importedBy: 'seed', citationCount: 0, doi: '10.1000/1', openAlexId: null });
    db.papers.push({ id: 'paper_old', importedBy: 'seed', citationCount: 5, doi: '10.1000/2', openAlexId: null });
    const body = await (await GET(cronRequest('Bearer test-secret'))).json();
    expect(body).toMatchObject({ added: 1, updated: 1, skipped: 1 });
    expect(db.papers.find((p) => p.id === 'paper_W1')).toMatchObject({ importedBy: 'seed', citationCount: 1 });
    expect(db.papers.map((p) => p.id).sort()).toEqual(['paper_W1', 'paper_W3', 'paper_old']);
  });

  it('returns 500 when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { prisma } = await import('@/lib/prisma');
    vi.spyOn(prisma.professor, 'findMany').mockRejectedValueOnce(new Error('down'));
    const res = await GET(cronRequest('Bearer test-secret'));
    expect(res.status).toBe(500);
  });
});
