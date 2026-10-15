import { afterEach, describe, expect, it, vi } from 'vitest';
import { abstractText, fetchWorks, workToPaper, worksUrl, type OpenAlexWork } from '@/lib/papers/openalex';
import { selectRecentPapers } from '@/lib/papers/save';

const LONG = 'Deep learning methods for robust perception under distribution shift in autonomous driving scenes with limited labels';
const index = (text: string) => {
  const idx: Record<string, number[]> = {};
  text.split(' ').forEach((w, i) => (idx[w] = [...(idx[w] ?? []), i]));
  return idx;
};

const work = (over: Partial<OpenAlexWork> = {}): OpenAlexWork => ({
  id: 'https://openalex.org/W123',
  doi: 'https://doi.org/10.1000/xyz',
  title: 'A <i>robust</i> perception model',
  publication_date: '2025-03-04',
  publication_year: 2025,
  type: 'proceedings-article',
  cited_by_count: 7,
  abstract_inverted_index: index(LONG),
  primary_location: { source: { display_name: 'CVPR' } },
  best_oa_location: { pdf_url: 'https://example.org/p.pdf', landing_page_url: null },
  open_access: { is_oa: true, oa_url: null },
  primary_topic: { display_name: 'Perception', field: { display_name: 'Computer Science' }, subfield: { display_name: 'Computer Vision' } },
  keywords: [{ display_name: 'driving' }],
  authorships: [
    { author: { id: 'https://openalex.org/A1', display_name: 'Prof One' }, institutions: [{ display_name: 'ETH Zurich' }] },
    { author: { id: null, display_name: 'Student Two' }, institutions: [] },
  ],
  ...over,
});

describe('abstractText', () => {
  it('rebuilds the text from the inverted index', () => {
    expect(abstractText(index(LONG))).toBe(LONG);
  });
  it('drops missing and very short abstracts', () => {
    expect(abstractText(null)).toBeNull();
    expect(abstractText(index('Too short to use'))).toBeNull();
  });
});

describe('workToPaper', () => {
  const profs = new Map([['A1', 'prof_1']]);

  it('maps a work and links the authors we know', () => {
    const p = workToPaper(work(), profs)!;
    expect(p).toMatchObject({
      id: 'paper_W123',
      openAlexId: 'W123',
      title: 'A robust perception model',
      doi: '10.1000/xyz',
      year: 2025,
      venue: 'CVPR',
      paperType: 'Conference paper',
      isOpenAccess: true,
      fieldsOfStudy: ['Computer Science', 'Computer Vision'],
      tags: ['Perception', 'driving'],
      institution: 'ETH Zurich',
    });
    expect(p.authors).toEqual([
      { position: 0, name: 'Prof One', institution: 'ETH Zurich', professorId: 'prof_1' },
      { position: 1, name: 'Student Two', institution: null, professorId: null },
    ]);
  });

  it('skips works without a title or a usable abstract', () => {
    expect(workToPaper(work({ title: null }), profs)).toBeNull();
    expect(workToPaper(work({ abstract_inverted_index: null }), profs)).toBeNull();
    expect(workToPaper(work({ abstract_inverted_index: index('Too short') }), profs)).toBeNull();
  });

  it('leaves unknown types and funders empty instead of guessing', () => {
    const p = workToPaper(work({ type: 'dataset' }), profs)!;
    expect(p.paperType).toBeNull();
    expect(p.funding).toBeNull();
  });
});

describe('worksUrl', () => {
  it('filters by authors, date and abstract, and asks for the most cited', () => {
    const url = worksUrl(['A1', 'A2'], { fromDate: '2025-01-01', perPage: 12 });
    expect(url).toContain('filter=author.id:A1|A2,from_publication_date:2025-01-01,has_abstract:true');
    expect(url).toContain('sort=cited_by_count:desc');
    expect(url).toContain('per_page=12');
    expect(url).toContain('mailto=');
    expect(url).not.toContain('page=2');
  });

  it('adds the type filter and the page number', () => {
    const url = worksUrl(['A1'], { fromDate: '2025-01-01', perPage: 100, types: ['article', 'preprint'] }, 2);
    expect(url).toContain(',has_abstract:true,type:article|preprint&');
    expect(url).toContain('&page=2&');
  });
});

describe('selectRecentPapers', () => {
  const profs = new Map([['A1', 'prof_1']]);

  it('keeps new articles, conference papers and preprints, newest first', () => {
    const papers = selectRecentPapers(
      [
        work({ id: 'https://openalex.org/W1', publication_date: '2025-02-01' }),
        work({ id: 'https://openalex.org/W2', publication_date: '2026-05-01', type: 'preprint' }),
        work({ id: 'https://openalex.org/W3', publication_date: '2025-08-01', type: 'article' }),
      ],
      profs,
    );
    expect(papers.map((p) => p.id)).toEqual(['paper_W2', 'paper_W3', 'paper_W1']);
  });

  it('drops old work, other types, missing abstracts and papers without one of our professors', () => {
    const papers = selectRecentPapers(
      [
        work({ id: 'https://openalex.org/W1', publication_year: 2024, publication_date: '2024-12-30' }),
        work({ id: 'https://openalex.org/W2', type: 'book-chapter' }),
        work({ id: 'https://openalex.org/W3', abstract_inverted_index: null }),
        work({ id: 'https://openalex.org/W4', authorships: [{ author: { id: 'https://openalex.org/A9', display_name: 'Someone' }, institutions: [] }] }),
      ],
      profs,
    );
    expect(papers).toEqual([]);
  });

  it('keeps at most perProfessor papers for each professor', () => {
    const works = Array.from({ length: 5 }, (_, i) => work({ id: `https://openalex.org/W${i}`, publication_date: `2025-0${i + 1}-01` }));
    expect(selectRecentPapers(works, profs, { perProfessor: 2 }).map((p) => p.id)).toEqual(['paper_W4', 'paper_W3']);
  });
});

describe('fetchWorks', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const ok = (results: unknown[]) => new Response(JSON.stringify({ results }), { status: 200 });

  it('waits and retries once on a 429, and skips a batch that keeps failing', async () => {
    vi.useFakeTimers();
    const w1 = work({ id: 'https://openalex.org/W1' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 })) // batch 0, first try
      .mockResolvedValueOnce(ok([w1])) // batch 0, retry
      .mockResolvedValueOnce(new Response('', { status: 500 })); // batch 1
    vi.stubGlobal('fetch', fetchMock);
    const log = vi.fn();
    const ids = Array.from({ length: 51 }, (_, i) => `A${i}`); // 2 batches
    const promise = fetchWorks(ids, { fromDate: '2025-01-01', perPage: 12 }, log);
    await vi.runAllTimersAsync();
    const works = await promise;
    expect([...works.keys()]).toEqual(['https://openalex.org/W1']);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenCalledWith('[openalex] batch 1: HTTP 500');
  });
});
