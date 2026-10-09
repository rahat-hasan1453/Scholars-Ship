/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma';

const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db; } }));

import { POST } from '@/app/api/search-miss/route';

const post = (body: unknown, ip = '203.0.113.7') =>
  new Request('http://localhost:3000/api/search-miss', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

let rows: any[];
beforeEach(() => {
  rows = [];
  h.db = createFakePrisma();
  h.db.searchMiss = { create: async ({ data }: any) => (rows.push(data), data) };
});

describe('POST /api/search-miss', () => {
  it('stores an anonymous record of the empty search', async () => {
    const res = await POST(post({ page: 'opportunities', query: ' haptics ', subjects: ['Human Factors'], countries: ['Ireland'] }));
    expect(res.status).toBe(200);
    expect(rows).toEqual([
      { page: 'opportunities', query: 'haptics', subjects: ['Human Factors'], degrees: [], countries: ['Ireland'], funding: [], matchMode: 'all' },
    ]);
  });

  it('rejects unknown pages and malformed bodies', async () => {
    expect((await POST(post({ page: 'admin' }))).status).toBe(400);
    expect((await POST(post('not json'))).status).toBe(400);
    expect((await POST(post({ page: 'faculty', subjects: Array(61).fill('x') }))).status).toBe(400);
    expect(rows).toHaveLength(0);
  });

  it('limits each IP to 60 records an hour', async () => {
    for (let i = 0; i < 60; i++) expect((await POST(post({ page: 'research' }))).status).toBe(200);
    expect((await POST(post({ page: 'research' }))).status).toBe(429);
    expect((await POST(post({ page: 'research' }, '198.51.100.1'))).status).toBe(200);
  });
});
