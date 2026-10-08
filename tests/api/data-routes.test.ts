import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockScholarships } from '../fixtures/mockData';

// The route reads the database through getScholarships; feed it the fixture list
vi.mock('@/lib/scholarships', () => ({ getScholarships: async () => mockScholarships }));
import { GET as scholarships, POST as scholarshipsPost } from '@/app/api/scholarships/route';
import { GET as researchSearch } from '@/app/api/research/search/route';
import { GET as professorSearch } from '@/app/api/professors/search/route';
import { GET as liveOpps } from '@/app/api/opportunities/live/route';

const get = (url: string) => new Request(`http://localhost:3000${url}`);
afterEach(() => vi.restoreAllMocks());

describe('GET /api/scholarships (database mocked)', () => {
  it('returns all with count', async () => {
    const body = await (await scholarships(get('/api/scholarships'))).json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(body.data.length);
    expect(body.count).toBeGreaterThan(0);
  });
  it('filters by degree and country case-insensitively', async () => {
    const body = await (await scholarships(get('/api/scholarships?degree=phd&country=germany'))).json();
    for (const s of body.data) {
      expect(s.degreeLevels.map((d: string) => d.toLowerCase())).toContain('phd');
      expect(s.countries.map((c: string) => c.toLowerCase())).toContain('germany');
    }
  });
  it('unknown filter returns empty list, not an error', async () => {
    expect((await (await scholarships(get('/api/scholarships?country=atlantis'))).json()).count).toBe(0);
  });
  it('POST requires an X-API-Key', async () => {
    const req = new Request('http://localhost:3000/api/scholarships', { method: 'POST', body: '{}' });
    expect((await scholarshipsPost(req)).status).toBe(401);
  });
  // BUG-10: any key starting with "highscholar_" is accepted; there is no real secret check.
  it.fails('POST rejects a made-up API key', async () => {
    const req = new Request('http://localhost:3000/api/scholarships', {
      method: 'POST', headers: { 'x-api-key': 'highscholar_anything' }, body: JSON.stringify({ title: 't', provider: 'p' }),
    });
    expect((await scholarshipsPost(req)).status).toBe(401);
  });
});

describe('GET /api/research/search (OpenAlex mocked)', () => {
  it('maps OpenAlex works and rebuilds the abstract', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      results: [
        { id: 'https://openalex.org/W1', title: '"Quoted Title"', publication_year: 2025, abstract_inverted_index: { world: [1], Hello: [0] }, authorships: [], cited_by_count: 7, doi: 'https://doi.org/10.1/x' },
        { id: 'https://openalex.org/W2', title: null, publication_year: 2025 },
      ],
    })));
    const body = await (await researchSearch(get('/api/research/search?query=hci&field=ux'))).json();
    expect(String(fetchSpy.mock.calls[0][0])).toContain('search=hci%20ux');
    expect(body.count).toBe(1);
    expect(body.papers[0]).toMatchObject({ id: 'openalex-paper-W1', title: 'Quoted Title', abstract: 'Hello world...', citationCount: 7, doi: '10.1/x' });
  });
  // BUG-11: an OpenAlex outage is reported as success with 0 papers (professors/search returns 502).
  it.fails('reports an upstream failure instead of an empty success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }));
    expect((await researchSearch(get('/api/research/search?query=x'))).status).toBe(502);
  });
});

describe('GET /api/professors/search (OpenAlex mocked)', () => {
  it('502 when OpenAlex is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }));
    expect((await professorSearch(get('/api/professors/search?query=x'))).status).toBe(502);
  });
  it('drops authors with <= 5 works and maps country codes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      results: [
        { id: 'https://openalex.org/A1', display_name: 'Ada Lovelace', works_count: 40, cited_by_count: 1000, last_known_institution: { display_name: 'TU Munich', country_code: 'DE' }, topics: [{ display_name: 'HCI' }] },
        { id: 'https://openalex.org/A2', display_name: 'New Author', works_count: 2 },
      ],
    })));
    const body = await (await professorSearch(get('/api/professors/search?query=hci'))).json();
    expect(body.count).toBe(1);
    expect(body.professors[0]).toMatchObject({ id: 'openalex_A1', country: 'Germany', university: 'TU Munich', researchTags: ['HCI'] });
  });
});

describe('GET /api/opportunities/live (Mastodon mocked)', () => {
  it('survives every upstream failing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = await (await liveOpps(get('/api/opportunities/live'))).json();
    expect(body).toMatchObject({ success: true, count: 0, data: [] });
  });
  // BUG-12: ?limit=abc -> parseInt gives NaN -> slice(0, NaN) returns [] even when posts exist.
  it.fails('falls back to the default limit for a non-numeric limit', async () => {
    const post = { id: '1', url: 'https://mastodon.social/@prof/1', created_at: '2026-09-30T00:00:00Z', content: '<p>Fully funded PhD position in Machine Learning at TU Munich, Germany. Apply by Dec 1. #PhDPositions</p>', account: { display_name: 'Prof X', username: 'profx', avatar: '' } };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify([post])));
    const ok = await (await liveOpps(get('/api/opportunities/live'))).json();
    expect(ok.count).toBeGreaterThan(0);
    const bad = await (await liveOpps(get('/api/opportunities/live?limit=abc'))).json();
    expect(bad.data.length).toBe(ok.data.length);
  });
});
