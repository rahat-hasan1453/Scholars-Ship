// OpenAlex works → research papers. Shared by the import script (prisma/import/import-papers.ts) and the daily cron (/api/cron/papers).
//
// OpenAlex rules (docs.openalex.org / help.openalex.org, checked 2026-10-16):
// - An API key is optional. Without one the budget is $0.10 a day: a works list call costs $0.0001, so ~1,000 calls a day.
//   A free key gives 10x that. Single-entity lookups are free.
// - 10 requests a second without a key (30 with one); over a limit returns 429.
// - `per_page` is at most 100 and an OR filter takes at most 100 values.
// - Metadata is CC0.
// Only what OpenAlex returns is kept; a work without a title or an abstract of 80+ characters is skipped.

export const MAILTO = process.env.OPENALEX_MAILTO ?? 'xyz.brothers99@gmail.com';
/** Optional free key (10x the daily budget); set OPENALEX_API_KEY in Vercel if the keyless budget is ever too small */
const API_KEY = process.env.OPENALEX_API_KEY;
export const AUTHORS_PER_REQUEST = 50;
export const REQUEST_GAP_MS = 150;

export type OpenAlexWork = {
  id: string;
  doi: string | null;
  title: string | null;
  publication_date: string | null;
  publication_year: number | null;
  type: string | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  primary_location: { source: { display_name: string | null } | null } | null;
  best_oa_location: { pdf_url: string | null; landing_page_url: string | null } | null;
  open_access: { is_oa: boolean; oa_url: string | null } | null;
  primary_topic: { display_name: string; subfield?: { display_name: string }; field?: { display_name: string } } | null;
  keywords?: { display_name: string }[];
  authorships: { author: { id: string | null; display_name: string }; institutions: { display_name: string }[] }[];
  grants?: { funder_display_name: string; award_id: string | null }[];
};

export type PaperData = {
  id: string;
  openAlexId: string;
  title: string;
  abstract: string;
  year: number | null;
  publishedAt: string | null;
  venue: string | null;
  citationCount: number;
  doi: string | null;
  pdfUrl: string | null;
  isOpenAccess: boolean;
  paperType: string | null;
  fieldsOfStudy: string[];
  tags: string[];
  funding: string | null;
  institution: string | null;
  authors: { position: number; name: string; institution: string | null; professorId: string | null }[];
};

/** OpenAlex stores abstracts as word → positions; rebuild the plain text */
export function abstractText(index: Record<string, number[]> | null): string | null {
  if (!index) return null;
  const words: string[] = [];
  for (const [w, positions] of Object.entries(index)) for (const p of positions) words[p] = w;
  const text = words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return text.length >= 80 ? text : null;
}

export const PAPER_TYPE: Record<string, string> = {
  article: 'Journal article',
  'proceedings-article': 'Conference paper',
  preprint: 'Preprint',
  review: 'Review',
  'book-chapter': 'Book chapter',
};

/** One OpenAlex work → paper, or null when it has no title or no usable abstract. `profByAuthor` maps OpenAlex author id → our professor id. */
export function workToPaper(w: OpenAlexWork, profByAuthor: Map<string, string>): PaperData | null {
  const abstract = abstractText(w.abstract_inverted_index);
  if (!w.title || !abstract) return null;
  const doi = w.doi?.replace('https://doi.org/', '') ?? null;
  const fields = [w.primary_topic?.field?.display_name, w.primary_topic?.subfield?.display_name].filter((x): x is string => !!x);
  const grant = w.grants?.find((g) => g.funder_display_name);
  const openAlexId = w.id.split('/').pop()!;
  return {
    id: `paper_${openAlexId}`,
    openAlexId,
    title: w.title.replace(/<[^>]+>/g, ''),
    abstract,
    year: w.publication_year,
    publishedAt: w.publication_date,
    venue: w.primary_location?.source?.display_name ?? null,
    citationCount: w.cited_by_count,
    doi,
    pdfUrl: w.best_oa_location?.pdf_url ?? null,
    isOpenAccess: !!w.open_access?.is_oa,
    paperType: (w.type && PAPER_TYPE[w.type]) ?? null,
    fieldsOfStudy: [...new Set(fields)],
    tags: [w.primary_topic?.display_name, ...(w.keywords ?? []).slice(0, 3).map((k) => k.display_name)].filter((x): x is string => !!x),
    funding: grant ? [grant.funder_display_name, grant.award_id].filter(Boolean).join(' ') : null,
    institution: w.authorships[0]?.institutions[0]?.display_name ?? null,
    authors: w.authorships.slice(0, 12).map((a, position) => ({
      position,
      name: a.author.display_name,
      institution: a.institutions[0]?.display_name ?? null,
      professorId: (a.author.id && profByAuthor.get(a.author.id.split('/').pop()!)) || null,
    })),
  };
}

export type FetchWorksOptions = {
  /** Only works published on or after this date, `YYYY-MM-DD` */
  fromDate: string;
  /** Results kept per request of AUTHORS_PER_REQUEST authors */
  perPage: number;
  sort?: string;
  /** Only these OpenAlex work types, e.g. ['article', 'preprint'] */
  types?: string[];
  /** Pages fetched per batch of authors (default 1); paging stops early on a short page */
  pages?: number;
  /** Stop starting new requests after this time (ms since epoch); the rest waits for the next run */
  stopAt?: number;
};

export function worksUrl(authorIds: string[], { fromDate, perPage, sort = 'cited_by_count:desc', types }: FetchWorksOptions, page = 1): string {
  const typeFilter = types?.length ? `,type:${types.join('|')}` : '';
  return (
    `https://api.openalex.org/works?filter=author.id:${authorIds.join('|')},from_publication_date:${fromDate},has_abstract:true${typeFilter}` +
    `&sort=${sort}&per_page=${perPage}${page > 1 ? `&page=${page}` : ''}&mailto=${MAILTO}${API_KEY ? `&api_key=${API_KEY}` : ''}`
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Works for many authors, AUTHORS_PER_REQUEST at a time. A 429 waits and retries once; any other failure skips that batch. */
export async function fetchWorks(authorIds: string[], options: FetchWorksOptions, log: (msg: string) => void = console.warn): Promise<Map<string, OpenAlexWork>> {
  const works = new Map<string, OpenAlexWork>();
  const pages = options.pages ?? 1;
  for (let i = 0; i < authorIds.length; i += AUTHORS_PER_REQUEST) {
    for (let page = 1; page <= pages; page++) {
      if (options.stopAt && Date.now() >= options.stopAt) {
        log(`[openalex] time limit reached at batch ${i / AUTHORS_PER_REQUEST}`);
        return works;
      }
      const url = worksUrl(authorIds.slice(i, i + AUTHORS_PER_REQUEST), options, page);
      let res = await fetch(url);
      if (res.status === 429) {
        await sleep(2000);
        res = await fetch(url);
      }
      if (!res.ok) {
        log(`[openalex] batch ${i / AUTHORS_PER_REQUEST}: HTTP ${res.status}`);
        break;
      }
      const json = (await res.json()) as { results: OpenAlexWork[] };
      for (const w of json.results) works.set(w.id, w);
      await sleep(REQUEST_GAP_MS);
      if (json.results.length < options.perPage) break;
    }
  }
  return works;
}
