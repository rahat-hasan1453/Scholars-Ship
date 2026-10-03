/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';

const h = vi.hoisted(() => ({ findMany: (async () => []) as (args: any) => Promise<any[]> }));
vi.mock('@/lib/prisma', () => ({ prisma: { opportunity: { findMany: (args: any) => h.findMany(args) } } }));

import { GET } from '@/app/api/opportunities/route';

const first = OPPORTUNITY_LISTINGS[0];
const row = {
  ...first,
  degreeLevels: ['PHD'],
  postedAt: new Date(first.postedAt),
  deadline: new Date(first.deadline),
  authorAvatar: null,
  labName: null,
  city: null,
  contactEmail: null,
  officialUrl: null,
  minCgpa: 3.2,
  minIelts: null,
  professorId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => {
  h.findMany = async () => [];
  vi.restoreAllMocks();
});

describe('GET /api/opportunities', () => {
  it('maps database rows to the listing shape', async () => {
    h.findMany = async () => [row];
    const body = await (await GET()).json();
    expect(body).toMatchObject({ success: true, source: 'database', count: 1 });
    expect(body.data[0]).toMatchObject({ id: first.id, degreeLevels: ['PhD'], minCgpa: 3.2, deadline: first.deadline });
    expect(body.data[0].minIelts).toBeUndefined();
  });

  it('serves the mock listings while the table is empty', async () => {
    const body = await (await GET()).json();
    expect(body).toMatchObject({ source: 'mock', count: OPPORTUNITY_LISTINGS.length });
  });

  it('serves the mock listings when the database is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    h.findMany = async () => {
      throw new Error('down');
    };
    const body = await (await GET()).json();
    expect(body.source).toBe('mock');
  });
});
