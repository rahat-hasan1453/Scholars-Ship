// Matching UKRI Gateway to Research (GtR) data to our faculty. Pure functions (no network), so the rules are tested.
// Same rule as NIH: the person counts only when last name, start of first name AND institution all agree.
import { institutionOverlap, MIN_INSTITUTION_OVERLAP, titleCase } from './nihMatch';

export interface GtrPerson {
  id: string;
  firstName?: string | null;
  surname?: string | null;
  links?: { link?: { rel: string; href: string }[] };
}

const PLAIN = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const last = (full: string) => PLAIN(full.trim().split(/\s+/).slice(-1)[0] ?? '');
const first = (full: string) => PLAIN(full.trim().split(/\s+/)[0] ?? '');

/** Id at the end of a GtR link: ".../organisations/ABC-123" → "ABC-123" */
export const idOf = (href: string) => href.replace(/\/+$/, '').split('/').pop() ?? '';

export const linksOf = (x: { links?: { link?: { rel: string; href: string }[] } }, rel: string) =>
  (x.links?.link ?? []).filter((l) => l.rel === rel).map((l) => l.href);

/** GtR people whose name matches ours (the search is free text, so this check is ours) */
export function namedLike(professor: { name: string }, people: GtrPerson[]): GtrPerson[] {
  const l = last(professor.name);
  const f = first(professor.name);
  if (l.length < 2 || f.length < 2) return [];
  return people.filter((p) => PLAIN(p.surname ?? '') === l && PLAIN(p.firstName ?? '').slice(0, 3) === f.slice(0, 3));
}

/** The employer (GtR organisation name) must be the professor's university */
export const sameInstitution = (professor: { university: string }, orgName: string | undefined) =>
  !!orgName && institutionOverlap(professor.university, orgName) >= MIN_INSTITUTION_OVERLAP;

export interface GtrProject {
  id: string;
  title?: string | null;
  leadFunder?: string | null;
  identifiers?: { identifier?: { value: string; type: string }[] };
  links?: { link?: { rel: string; href: string; start?: number | null; end?: number | null }[] };
}

/** Start of the project's funding (ms), from its FUND link */
export const fundStart = (p: GtrProject): number | undefined => (p.links?.link ?? []).find((l) => l.rel === 'FUND' && l.start)?.start ?? undefined;

/** The newest project that started in `fromYear` or later */
export function latestProject(projects: GtrProject[], fromYear: number): GtrProject | undefined {
  const cutoff = Date.UTC(fromYear, 0, 1);
  return projects
    .filter((p) => p.title && (fundStart(p) ?? 0) >= cutoff)
    .sort((a, b) => (fundStart(b) ?? 0) - (fundStart(a) ?? 0))[0];
}

/** 399334 → "£399K"; 1,250,000 → "£1.3M" */
export function formatGbp(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  return `£${Math.round(n / 1000)}K`;
}

/** GtR titles come with HTML entities: "Vision &amp; Graphics" */
export const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

export interface UkriGrantSeed {
  id: string;
  professorId: string;
  title: string;
  funder: 'UKRI';
  amount: string;
  year: number;
  url: string;
}

export function toGrant(professorId: string, project: GtrProject, amountGbp: number): UkriGrantSeed {
  const ref = project.identifiers?.identifier?.find((i) => i.type === 'RCUK')?.value;
  const start = fundStart(project) ?? 0;
  return {
    id: `ukri_${project.id.slice(0, 8)}_${professorId}`.slice(0, 120),
    professorId,
    // Titles are normal sentence case already; shout-case ones are fixed
    title: decodeEntities(project.title && project.title === project.title.toUpperCase() ? titleCase(project.title) : (project.title ?? '')),
    funder: 'UKRI',
    amount: formatGbp(amountGbp),
    year: new Date(start).getUTCFullYear(),
    url: ref ? `https://gtr.ukri.org/projects?ref=${encodeURIComponent(ref)}` : `https://gtr.ukri.org/projects?ref=${project.id}`,
  };
}
