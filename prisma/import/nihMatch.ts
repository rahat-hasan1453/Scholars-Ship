// Matching NIH RePORTER awards to our faculty. Pure functions (no network), so the rules are tested.
// Nothing is guessed: an award counts only when the PI's last name, the start of the first name AND the institution all agree.

export interface NihProject {
  fiscal_year?: number;
  project_num?: string;
  project_title?: string;
  project_detail_url?: string;
  award_amount?: number | null;
  organization?: { org_name?: string | null } | null;
  principal_investigators?: { first_name?: string | null; last_name?: string | null; is_contact_pi?: boolean }[] | null;
}

const PLAIN = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Words that say nothing about which institution it is. "institute", "technology", "state" stay: they tell
// Georgia Institute of Technology from Georgia State University.
const FILLER = new Set(['the', 'of', 'at', 'and', 'in', 'univ', 'university', 'college', 'inc']);

/** "University of Texas at Austin (UT)" → {"texas","austin"}; "UNIV OF NORTH CAROLINA CHAPEL HILL" → {"north","carolina","chapel","hill"} */
export function institutionWords(name: string): Set<string> {
  return new Set(
    PLAIN(name)
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1 && !FILLER.has(w)),
  );
}

/** Share of words the two names have in common (0..1) */
export function institutionOverlap(a: string, b: string): number {
  const wa = institutionWords(a);
  const wb = institutionWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / (wa.size + wb.size - common);
}

export const MIN_INSTITUTION_OVERLAP = 0.6;

const lastNameOf = (full: string) => PLAIN(full.trim().split(/\s+/).slice(-1)[0] ?? '').replace(/[^a-z]/g, '');
const firstNameOf = (full: string) => PLAIN(full.trim().split(/\s+/)[0] ?? '').replace(/[^a-z]/g, '');

export function isSamePerson(
  professor: { name: string; university: string },
  project: NihProject,
): boolean {
  const last = lastNameOf(professor.name);
  const first = firstNameOf(professor.name);
  if (last.length < 2 || first.length < 2) return false;
  const org = project.organization?.org_name;
  if (!org || institutionOverlap(professor.university, org) < MIN_INSTITUTION_OVERLAP) return false;
  return (project.principal_investigators ?? []).some(
    (pi) =>
      PLAIN(pi.last_name ?? '').replace(/[^a-z]/g, '') === last &&
      PLAIN(pi.first_name ?? '').replace(/[^a-z]/g, '').slice(0, 3) === first.slice(0, 3),
  );
}

/** The most recent award of this person: newest fiscal year, then the biggest amount. Undefined when nothing matches. */
export function latestAward(professor: { name: string; university: string }, projects: NihProject[]): NihProject | undefined {
  return projects
    .filter((p) => isSamePerson(professor, p) && p.project_title && p.fiscal_year && p.award_amount)
    .sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0) || (b.award_amount ?? 0) - (a.award_amount ?? 0))[0];
}

/** $1,398,633 → "$1.4M"; $327,748 → "$328K" (same style as the NSF amounts) */
export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  return `$${Math.round(n / 1000)}K`;
}

const SMALL = new Set(['of', 'and', 'to', 'for', 'in', 'the', 'a', 'an', 'with', 'on', 'at', 'by', 'from', 'or', 'as']);
/** NIH titles are ALL CAPS: "TARGETED SUMMARIZATION OF RECORDS" → "Targeted Summarization of Records" */
const ACRONYMS = new Set(['ai', 'ml', 'fda', 'ehr', 'emr', 'dna', 'rna', 'mri', 'ct', 'pet', 'hiv', 'aids', 'covid', 'icu', 'nih', 'usa', 'us', 'ii', 'iii', 'iv', 'rct', 'crispr', 'eeg', 'ecg', 'fmri', 'copd', 'adhd', 'ptsd', 'lgbtq', 'sars', 'cov', 'rsv', 'ehrs', 'cdc', 'cns', 'gi', 'hpv', 'ivf', 'nlp', 'llm', 'vr', 'ar', 'iot', 'gps', 'qi', 'covid-19']);
export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s("-])([a-z][a-z']*)/g, (_, pre: string, w: string) => (ACRONYMS.has(w) ? pre + w.toUpperCase() : pre !== '' && SMALL.has(w) ? pre + w : pre + w[0].toUpperCase() + w.slice(1)));

export interface NihGrantSeed {
  id: string;
  professorId: string;
  title: string;
  funder: 'NIH';
  amount: string;
  year: number;
  url: string;
}

export function toGrant(professorId: string, p: NihProject): NihGrantSeed {
  const num = (p.project_num ?? '').replace(/^\d(?=[A-Z])/, '').replace(/-[0-9A-Z]+$/, '');
  return {
    id: `nih_${num || p.fiscal_year}_${professorId}`.slice(0, 120),
    professorId,
    title: titleCase(p.project_title ?? ''),
    funder: 'NIH',
    amount: formatUsd(p.award_amount ?? 0),
    year: p.fiscal_year ?? 0,
    url: p.project_detail_url ?? `https://reporter.nih.gov/search/projects?query=${encodeURIComponent(num)}`,
  };
}
