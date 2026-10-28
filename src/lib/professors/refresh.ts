// Weekly refresh of professor metrics from OpenAlex, used by the daily cron (/api/cron/professors).
// Only rows that already have an openAlexId are touched, and only hIndex, publicationCount and the OpenAlex topic tags change.
import { MAILTO } from '@/lib/papers/openalex';
import { SUBJECTS, subjectTagsFor } from '@/data/subjectCatalog';

export const BATCH_SIZE = 100;
export const SLICES = 7;
export const MAX_TAGS = 5;
const TOPICS_PER_PROFESSOR = 3;
const MAX_ATTEMPTS = 3;
const REQUEST_GAP_MS = 150;
const API_KEY = process.env.OPENALEX_API_KEY;

export type OpenAlexAuthor = {
  id: string;
  works_count?: number;
  summary_stats?: { h_index?: number };
  topics?: { display_name: string }[];
};

/** FNV-1a: the same id always lands in the same slice, whatever else is in the table */
export function sliceOf(openAlexId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < openAlexId.length; i++) h = Math.imul(h ^ openAlexId.charCodeAt(i), 0x01000193) >>> 0;
  return h % SLICES;
}

/** Which slice runs on this day (UTC), so every id is refreshed once a week */
export function sliceForDay(now: number): number {
  return Math.floor(now / 86_400_000) % SLICES;
}

const isSubjectTag = (tag: string) => SUBJECTS.some((s) => s.toLowerCase() === tag.toLowerCase()) || subjectTagsFor([tag]).length > 0;

/** Existing subject tags stay first; fresh OpenAlex topics fill the rest (no duplicates, at most MAX_TAGS) */
export function mergeTags(existing: string[], topics: string[]): string[] {
  const out: string[] = [];
  const add = (t: string) => {
    if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  };
  existing.filter(isSubjectTag).forEach(add);
  topics.slice(0, TOPICS_PER_PROFESSOR).forEach(add);
  return out.slice(0, MAX_TAGS);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function authorsUrl(ids: string[]): string {
  return (
    `https://api.openalex.org/authors?filter=openalex:${ids.join('|')}&select=id,works_count,summary_stats,topics` +
    `&per_page=${BATCH_SIZE}&mailto=${MAILTO}${API_KEY ? `&api_key=${API_KEY}` : ''}`
  );
}

/** One batch of authors, keyed by short id (A123…). Retries 429/5xx and network errors; returns null when it still fails. */
export async function fetchAuthors(ids: string[]): Promise<Map<string, OpenAlexAuthor> | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(authorsUrl(ids));
      if (res.ok) {
        const json = (await res.json()) as { results: OpenAlexAuthor[] };
        return new Map(json.results.map((a) => [a.id.split('/').pop()!, a]));
      }
      if (res.status !== 429 && res.status < 500) return null;
    } catch {
      // network error: retry
    }
    if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1000);
  }
  return null;
}

export const gap = () => sleep(REQUEST_GAP_MS);
