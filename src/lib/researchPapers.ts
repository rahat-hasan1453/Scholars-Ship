import type { PaperAuthor, ResearchPaper as ResearchPaperRow } from '@prisma/client';
import type { PaperFinding, ResearchPaper, UserProfile } from '@/types';
import { subjectTagsFor } from '@/lib/opportunityDetails';

/** Papers in the Research Paper tab. The daily cron adds thousands, and a Vercel response is capped at 4.5 MB (~2.5 KB a paper). */
export const FEED_LIMIT = 800;

export type ResearchPaperWithAuthors = ResearchPaperRow & { authors: PaperAuthor[] };

// Semantic Scholar paper ids are 40-char hex hashes; anything else is not a real id
const SEMANTIC_SCHOLAR_ID = /^[0-9a-f]{40}$/;

export function semanticScholarIdFromUrl(url?: string): string | null {
  const last = url?.split('/').pop();
  return last && SEMANTIC_SCHOLAR_ID.test(last) ? last : null;
}

// DB row -> the shape ResearchPaperCard renders
export function toResearchPaper(row: ResearchPaperWithAuthors): ResearchPaper {
  const published = row.publishedAt ?? (row.year ? new Date(Date.UTC(row.year, 0, 1)) : null);
  return {
    id: row.id,
    title: row.title,
    authors: [...row.authors]
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ name: a.name, institution: a.institution ?? undefined, professorId: a.professorId ?? undefined })),
    abstract: row.abstract,
    publicationDate: published ? published.toISOString().slice(0, 10) : '',
    year: row.year ?? published?.getUTCFullYear() ?? 0,
    venue: row.venue ?? '',
    citationCount: row.citationCount,
    fieldsOfStudy: row.fieldsOfStudy,
    tags: row.tags,
    doi: row.doi ?? undefined,
    pdfUrl: row.pdfUrl ?? undefined,
    googleScholarUrl:
      row.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(row.title)}`,
    semanticScholarUrl: row.semanticScholarId
      ? `https://www.semanticscholar.org/paper/${row.semanticScholarId}`
      : undefined,
    isOpenAccess: row.isOpenAccess,
    venueShort: row.venueShort ?? undefined,
    paperType: row.paperType ?? undefined,
    peerReviewed: row.peerReviewed ?? undefined,
    institution: row.institution ?? undefined,
    funding: row.funding ?? undefined,
    keyFindings: parseFindings(row.keyFindings),
  };
}

/** Keeps only well-formed rows from the keyFindings JSON column */
export function parseFindings(json: unknown): PaperFinding[] | undefined {
  if (!Array.isArray(json)) return undefined;
  const rows = json.filter(
    (f): f is PaperFinding =>
      !!f && typeof f.label === 'string' && typeof f.text === 'string' && typeof f.value === 'string' && typeof f.met === 'boolean',
  );
  return rows.length ? rows : undefined;
}

/* ---------- Details modal (Figma 261:3390) ---------- */

/** Stored lead institution, else the first author's */
export function leadInstitution(p: Pick<ResearchPaper, 'institution' | 'authors'>): string | undefined {
  return p.institution ?? p.authors.find((a) => a.institution)?.institution;
}

/** Venue without a trailing "(CHI 2025)" style abbreviation */
const venueName = (venue: string) => venue.replace(/\s*\([^)]*\)\s*$/, '').trim();

/** "CHI 2025 · ACM CHI Conference on Human Factors in Computing Systems" */
export function venueLine(p: Pick<ResearchPaper, 'venue' | 'venueShort'>): string {
  const name = venueName(p.venue);
  if (!p.venueShort || p.venueShort === name) return name;
  return `${p.venueShort} · ${name}`;
}

/** "April 2026", or null when the date is unknown */
export function publishedLabel(p: Pick<ResearchPaper, 'publicationDate' | 'year'>): string | null {
  const d = p.publicationDate ? new Date(`${p.publicationDate}T00:00:00Z`) : null;
  if (d && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return p.year ? String(p.year) : null;
}

/** "📄 Conference paper · Published April 2026" */
export function metaLine(p: ResearchPaper): string | undefined {
  const published = publishedLabel(p);
  const parts = [p.paperType, published && `Published ${published}`].filter(Boolean);
  return parts.length ? `📄 ${parts.join(' · ')}` : undefined;
}

/** "Dr. Sarah Jenkins +2" */
export function authorsSummary(p: Pick<ResearchPaper, 'authors'>): string | null {
  if (!p.authors.length) return null;
  const more = p.authors.length - 1;
  return more > 0 ? `${p.authors[0].name} +${more}` : p.authors[0].name;
}

/** Fields of study as #hashtags, then keyword tags as written */
export function topicChips(p: Pick<ResearchPaper, 'fieldsOfStudy' | 'tags'>): string[] {
  const seen = new Set<string>();
  return [...p.fieldsOfStudy.map((f) => `#${f}`), ...p.tags].filter((t) => {
    const key = t.replace(/^#/, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The student's specialisations this paper covers (by text or by Subject filter value) */
export function matchedInterests(p: Pick<ResearchPaper, 'fieldsOfStudy' | 'tags'>, profile: Pick<UserProfile, 'specializations'>): string[] {
  const topics = [...p.fieldsOfStudy, ...p.tags].map((t) => t.toLowerCase());
  const subjects = subjectTagsFor([...p.fieldsOfStudy, ...p.tags]);
  return profile.specializations.filter((ps) => {
    const a = ps.toLowerCase();
    if (topics.some((t) => t.includes(a) || a.includes(t))) return true;
    return subjectTagsFor([ps]).some((s) => subjects.includes(s));
  });
}

/** Share of the student's specialisations the paper covers; null when there is nothing to compare */
export function relevance(p: Pick<ResearchPaper, 'fieldsOfStudy' | 'tags'>, profile: Pick<UserProfile, 'specializations'>): number | null {
  if (!profile.specializations.length) return null;
  const matched = matchedInterests(p, profile).length;
  return matched ? Math.round((matched / profile.specializations.length) * 100) : null;
}

/** "Why It Matters" text built from the student's profile; null hides the section */
export function whyItMatters(p: ResearchPaper, profile: Pick<UserProfile, 'specializations'>): string | null {
  const parts: string[] = [];
  const matched = matchedInterests(p, profile);
  if (matched.length) parts.push(`Matches your interests in ${matched.slice(0, 3).join(' & ')}.`);
  const linked = p.authors.find((a) => a.professorId);
  if (linked) parts.push(`${linked.name} is in Faculty & Research Labs — see their lab for open positions.`);
  return parts.length ? parts.join(' ') : null;
}
