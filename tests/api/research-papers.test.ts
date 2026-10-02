/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialResearchPapers } from '@/data/researchPapers';

const h = vi.hoisted(() => ({ findMany: (async () => []) as (args: any) => Promise<any[]> }));
vi.mock('@/lib/prisma', () => ({ prisma: { researchPaper: { findMany: (args: any) => h.findMany(args) } } }));

import { GET } from '@/app/api/research/papers/route';

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
    const body = await (await GET()).json();
    expect(body.source).toBe('database');
    expect(body.count).toBe(1);
    const p = body.data[0];
    expect(p.authors.map((a: any) => a.name)).toEqual(['First', 'Second']);
    expect(p.publicationDate).toBe('2024-05-02');
    expect(p.doi).toBe('10.1/x');
    expect(p.pdfUrl).toBeUndefined();
    expect(p.googleScholarUrl).toBe('https://scholar.google.com/scholar?q=A%20Paper');
  });

  it('serves mock papers while the table is empty', async () => {
    const body = await (await GET()).json();
    expect(body.source).toBe('mock');
    expect(body.count).toBe(initialResearchPapers.length);
  });

  it('serves mock papers when the database read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    h.findMany = async () => {
      throw new Error('db down');
    };
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).source).toBe('mock');
  });
});
