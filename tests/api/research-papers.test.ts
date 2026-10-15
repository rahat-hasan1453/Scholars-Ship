/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ findMany: (async () => []) as (args: any) => Promise<any[]> }));
vi.mock('@/lib/prisma', () => ({ prisma: { researchPaper: { findMany: (args: any) => h.findMany(args) } } }));

import { GET } from '@/app/api/research/papers/route';
import { FEED_LIMIT } from '@/lib/researchPapers';

const row = (over: Record<string, any> = {}) => ({
  id: 'p1',
  title: 'A Paper',
  abstract: 'Abstract text',
  year: 2024,
  publishedAt: new Date('2024-05-02T00:00:00Z'),
  venue: 'CHI',
  citationCount: 7,
  doi: '10.1/x',
  semanticScholarId: null,
  pdfUrl: null,
  googleScholarUrl: null,
  fieldsOfStudy: ['HCI'],
  tags: ['UX'],
  isOpenAccess: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  authors: [
    { id: 'a2', paperId: 'p1', position: 1, name: 'Second', institution: null, professorId: null },
    { id: 'a1', paperId: 'p1', position: 0, name: 'First', institution: 'MIT', professorId: null },
  ],
  ...over,
});

afterEach(() => {
  h.findMany = async () => [];
  vi.restoreAllMocks();
});

describe('GET /api/research/papers', () => {
  it('maps database rows to the card shape with authors in order', async () => {
    h.findMany = async () => [row()];
    const body = await (await GET(new Request('http://localhost/api/research/papers'))).json();
    expect(body.source).toBe('database');
    expect(body.count).toBe(1);
    const p = body.data[0];
    expect(p.authors.map((a: any) => a.name)).toEqual(['First', 'Second']);
    expect(p.publicationDate).toBe('2024-05-02');
    expect(p.doi).toBe('10.1/x');
    expect(p.pdfUrl).toBeUndefined();
    expect(p.googleScholarUrl).toBe('https://scholar.google.com/scholar?q=A%20Paper');
  });

  it('returns an empty list while the table is empty (no demo fallback)', async () => {
    const body = await (await GET(new Request('http://localhost/api/research/papers'))).json();
    expect(body).toMatchObject({ source: 'database', count: 0, data: [] });
  });

  it('lists at most FEED_LIMIT papers, newest year first, then most cited', async () => {
    let args: any;
    h.findMany = async (a) => ((args = a), []);
    await GET(new Request('http://localhost/api/research/papers'));
    expect(args.take).toBe(FEED_LIMIT);
    expect(args.where).toBeUndefined();
    expect(args.orderBy[0]).toEqual({ year: { sort: 'desc', nulls: 'last' } });
  });

  it('returns just the asked papers for ?ids= (saved papers), and nothing for an empty list', async () => {
    let args: any;
    h.findMany = async (a) => ((args = a), [row()]);
    const body = await (await GET(new Request('http://localhost/api/research/papers?ids=p1,p2'))).json();
    expect(args.where).toEqual({ id: { in: ['p1', 'p2'] } });
    expect(args.take).toBeUndefined();
    expect(body.count).toBe(1);
    args = undefined;
    const empty = await (await GET(new Request('http://localhost/api/research/papers?ids='))).json();
    expect(empty).toMatchObject({ count: 0, data: [] });
    expect(args).toBeUndefined();
  });

  it('answers 503 with an empty list when the database read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    h.findMany = async () => {
      throw new Error('db down');
    };
    const res = await GET(new Request('http://localhost/api/research/papers'));
    expect(res.status).toBe(503);
    expect((await res.json()).data).toEqual([]);
  });
});
