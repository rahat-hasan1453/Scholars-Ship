import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  professor: { findMany: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { GET } from '@/app/api/cron/professors/route';
import { SLICES, mergeTags, sliceForDay, sliceOf } from '@/lib/professors/refresh';

const NOW = Date.UTC(2026, 9, 28, 7, 0, 0);
const TODAY = sliceForDay(NOW);
const req = (auth?: string) => new Request('http://x/api/cron/professors', { headers: auth ? { authorization: auth } : {} });

/** An id in (or out of) today's slice */
const idIn = (inSlice: boolean, n: number) => {
  let k = 0;
  for (let i = 1; ; i++) if ((sliceOf(`A${i}`) === TODAY) === inSlice && ++k === n) return `A${i}`;
};
const row = (openAlexId: string, over = {}) => ({ id: `prof_${openAlexId}`, openAlexId, hIndex: 1, publicationCount: 1, researchTags: ['Computer Science', 'Old topic'], ...over });
const author = (id: string) => ({ id: `https://openalex.org/${id}`, works_count: 50, summary_stats: { h_index: 12 }, topics: [{ display_name: 'Graph Learning' }, { display_name: 'Robust Vision' }] });
const okJson = (results: unknown[]) => new Response(JSON.stringify({ results }), { status: 200 });

/** Run the handler while fake timers skip retry / gap sleeps */
async function run(r = req()) {
  const p = GET(r);
  await vi.runAllTimersAsync();
  return p;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout'] });
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  prismaMock.professor.update.mockResolvedValue({});
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  Object.values(prismaMock.professor).forEach((f) => f.mockReset());
});

describe('slices', () => {
  it('every id belongs to exactly one slice and the slice cycles weekly', () => {
    expect(sliceOf('A5023888391')).toBe(sliceOf('A5023888391'));
    expect(sliceOf('A1')).toBeLessThan(SLICES);
    expect(new Set(Array.from({ length: 7 }, (_, d) => sliceForDay(NOW + d * 86_400_000))).size).toBe(7);
  });
});

describe('mergeTags', () => {
  it('keeps subject tags first and renews topics, at most 5, no duplicates', () => {
    expect(mergeTags(['Computer Science', 'Old topic'], ['Graph Learning', 'computer science', 'Robust Vision', 'A', 'B'])).toEqual([
      'Computer Science',
      'Graph Learning',
      'Robust Vision',
    ]);
    expect(mergeTags(['Cybersecurity', 'Human Factors', 'Machine Learning', 'Biomedical Engineering', 'Information Systems'], ['X'])).toHaveLength(5);
  });
});

describe('GET /api/cron/professors', () => {
  it('rejects a call without the secret', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    expect((await run()).status).toBe(401);
    expect((await run(req('Bearer wrong'))).status).toBe(401);
    expect(prismaMock.professor.findMany).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('accepts the right secret', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    prismaMock.professor.findMany.mockResolvedValue([]);
    expect((await run(req('Bearer s3cret'))).status).toBe(200);
  });

  it("only refreshes the day's slice, never creates, keeps subject tags", async () => {
    const a = idIn(true, 1);
    const b = idIn(true, 2);
    const other = idIn(false, 1);
    prismaMock.professor.findMany.mockResolvedValue([row(a), row(b), row(other)]);
    vi.mocked(fetch).mockResolvedValue(okJson([author(a), author(b)]));

    const res = await run();
    const body = await res.json();

    expect(body).toMatchObject({ success: true, professors: 2, updated: 2, failedBatches: 0 });
    expect(fetch).toHaveBeenCalledTimes(1);
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain(`filter=openalex:${a}|${b}`);
    expect(url.split('filter=openalex:')[1].split('&')[0].split('|')).not.toContain(other);
    expect(url).toContain('per_page=100');
    expect(prismaMock.professor.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.professor.update).toHaveBeenCalledWith({
      where: { id: `prof_${a}` },
      data: { hIndex: 12, publicationCount: 50, researchTags: ['Computer Science', 'Graph Learning', 'Robust Vision'] },
    });
    for (const f of ['create', 'upsert', 'delete', 'deleteMany'] as const) expect(prismaMock.professor[f]).not.toHaveBeenCalled();
  });

  it('skips a failed batch and carries on with the next one', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => idIn(true, i + 1));
    prismaMock.professor.findMany.mockResolvedValue(ids.map((id) => row(id)));
    vi.mocked(fetch).mockImplementation(async (u) =>
      String(u).includes(`openalex:${ids[0]}|`) ? new Response('boom', { status: 503 }) : okJson([author(ids[100])]),
    );

    const body = await (await run()).json();

    expect(body).toMatchObject({ success: true, failedBatches: 1, updated: 1 });
    expect(fetch).toHaveBeenCalledTimes(3 + 1); // 3 attempts for the failed batch, 1 for the second
    expect(prismaMock.professor.update).toHaveBeenCalledTimes(1);
  });

  it('retries a 429 and then succeeds', async () => {
    const a = idIn(true, 1);
    prismaMock.professor.findMany.mockResolvedValue([row(a)]);
    vi.mocked(fetch).mockResolvedValueOnce(new Response('slow down', { status: 429 })).mockResolvedValueOnce(okJson([author(a)]));
    const body = await (await run()).json();
    expect(body).toMatchObject({ failedBatches: 0, updated: 1 });
  });

  it('leaves a row alone when OpenAlex has nothing new for it', async () => {
    const a = idIn(true, 1);
    prismaMock.professor.findMany.mockResolvedValue([row(a, { hIndex: 12, publicationCount: 50, researchTags: ['Computer Science', 'Graph Learning', 'Robust Vision'] })]);
    vi.mocked(fetch).mockResolvedValue(okJson([author(a)]));
    await run();
    expect(prismaMock.professor.update).not.toHaveBeenCalled();
  });

  it('stops starting batches once the time budget is gone', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => idIn(true, i + 1));
    prismaMock.professor.findMany.mockResolvedValue(ids.map((id) => row(id)));
    vi.mocked(fetch).mockResolvedValue(okJson([]));
    // 1st read = start, 2nd = first batch check; after that the clock is past the budget
    let calls = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => (++calls <= 2 ? NOW : NOW + 241_000));

    const body = await (await run()).json();

    expect(body).toMatchObject({ success: true, timedOut: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
