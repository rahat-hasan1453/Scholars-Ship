import type { DegreeLevel, LookingFor, Professor, ProfessorGrant, UserProfile } from '@/types';
import { countryShortLabel, formatScore, subjectTagsFor } from '@/lib/opportunityDetails';

// Pure helpers for the Faculty & Research Labs details page (no React, no database).

const UNIVERSITY_CITY: Record<string, string> = {
  'University of California San Diego (UCSD)': 'San Diego',
  'Carnegie Mellon University (CMU)': 'Pittsburgh',
  'Stanford University': 'Stanford',
  'University College London (UCL)': 'London',
  'Massachusetts Institute of Technology (MIT)': 'Cambridge, MA',
  'Hasso Plattner Institute (University of Potsdam)': 'Potsdam',
  'University of Toronto': 'Toronto',
  'National University of Singapore (NUS)': 'Singapore',
  'Harvard University': 'Cambridge, MA',
  'ETH Zurich': 'Zurich',
  'University of Cambridge': 'Cambridge',
  'University of Oxford': 'Oxford',
  KAIST: 'Daejeon',
  'Technical University of Munich (TUM)': 'Munich',
  'Delft University of Technology (TU Delft)': 'Delft',
  'Northeastern University': 'Boston',
  'University of California, Berkeley': 'Berkeley',
  'Université de Montréal / Mila': 'Montréal',
  'University of Washington': 'Seattle',
  'University of British Columbia (UBC)': 'Vancouver',
  'University of Melbourne': 'Melbourne',
};

export const cityFor = (university: string): string | undefined => UNIVERSITY_CITY[university];

/** "Stockholm, Sweden" (or just the country when the city is unknown; Singapore isn't repeated) */
export function locationLine(p: Pick<Professor, 'city' | 'country'>): string {
  return p.city && p.city !== p.country ? `${p.city}, ${p.country}` : p.country;
}

const GRANT_AMOUNT = /(?:[A-Z]{2,4}\s?)?[$£€]?\s?\d[\d.,]*\s?[MBK]\b(?:\s?KRW)?/;

/** "$3.8M NSF Human-Centered Computing Grant" → { amount: "$3.8M", title: "NSF Human-Centered Computing Grant" } */
export function parseGrant(text: string | undefined): ProfessorGrant | undefined {
  if (!text) return undefined;
  const match = text.match(GRANT_AMOUNT);
  if (!match) return undefined;
  const title = text.replace(match[0], '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  const year = text.match(/\b(20\d{2})\b/)?.[1];
  return { amount: match[0].trim(), title, ...(year ? { year: Number(year) } : {}) };
}

const DEGREE_NOUN: Record<DegreeLevel, string> = { Bachelors: "Bachelor's", Masters: "Master's", PhD: 'PhD' };

/** Typical entry requirements, used until a professor's own requirements are recorded */
export function defaultLookingFor(p: Pick<Professor, 'degreeLevels' | 'researchTags' | 'country'>): LookingFor {
  const levels = p.degreeLevels?.length ? p.degreeLevels : (['Masters', 'PhD'] as DegreeLevel[]);
  // PhD applicants need the degree below it
  const prior = levels.includes('PhD') ? "Master's" : "Bachelor's";
  const fields = p.researchTags.slice(0, 2).join(' or ');
  return {
    degree: fields ? `${prior} in ${fields}` : `${prior} degree`,
    minIelts: p.country === 'USA' ? 7 : 6.5,
    minToefl: p.country === 'USA' ? 100 : 90,
    experience: 'Prior research or project experience',
    publications: levels.includes('PhD') ? 'preferred' : 'none',
  };
}

/** Last name with academic titles kept: "Dr. Scott Klemmer" → "Dr. Klemmer" */
export function shortName(name: string): string {
  const parts = name.split(' ');
  const titles = parts.filter((x) => x.endsWith('.'));
  return [...titles, parts[parts.length - 1]].join(' ');
}

export function defaultContactSteps(p: Pick<Professor, 'name' | 'email' | 'university'>): string[] {
  const to = p.email ? `${shortName(p.name)} (${p.email})` : shortName(p.name);
  return [
    'Read 2–3 of their recent papers and note what interests you',
    `Email ${to} a short introduction, your CV and research interests`,
    `Apply to the ${p.university} graduate call when a position in the lab opens`,
  ];
}

/** Fills the details-page fields the mock list doesn't carry */
export function withFacultyDefaults(p: Professor): Professor {
  return {
    ...p,
    degreeLevels: p.degreeLevels?.length ? p.degreeLevels : ['Masters', 'PhD'],
    city: p.city ?? cityFor(p.university),
    recentGrant: p.recentGrant ?? parseGrant(p.recentGrants),
    lookingFor: p.lookingFor ?? defaultLookingFor(p),
    contactSteps: p.contactSteps?.length ? p.contactSteps : defaultContactSteps(p),
  };
}

const DEGREE_ORDER: DegreeLevel[] = ['PhD', 'Masters', 'Bachelors'];

/** Degrees the lab takes, PhD first: ["PhD", "Masters"] */
export const degreesOffered = (p: Pick<Professor, 'degreeLevels'>): DegreeLevel[] =>
  DEGREE_ORDER.filter((d) => (p.degreeLevels ?? ['Masters', 'PhD']).includes(d));

/** "Profile updated 1 week ago" */
export function updatedLine(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const days = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'Profile updated today';
  if (days < 7) return `Profile updated ${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Profile updated ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(days / 30);
  return `Profile updated ${months} month${months === 1 ? '' : 's'} ago`;
}

/** "https://www.dgp.toronto.edu/~dwigdor" → "dgp.toronto.edu/~dwigdor" */
export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export type GlanceRow = { label: string; value: string };

/** "Lab at a Glance" rows; unknown values are left out instead of guessed */
export function glanceRows(p: Professor): GlanceRow[] {
  const rows: GlanceRow[] = [];
  const members = [
    p.phdStudents != null && `${p.phdStudents} PhD`,
    p.postdocs != null && `${p.postdocs} Postdoc${p.postdocs === 1 ? '' : 's'}`,
  ].filter(Boolean);
  if (members.length) rows.push({ label: 'Lab members', value: members.join(' · ') });

  const pubs = p.publicationCount ?? (p.recentPapers?.length || undefined);
  const pubParts = [pubs != null && String(pubs), p.hIndex != null && `h-index ${p.hIndex}`].filter(Boolean);
  if (pubParts.length) rows.push({ label: 'Publications', value: pubParts.join(' · ') });

  if (p.recentGrant) {
    rows.push({ label: 'Recent grant', value: p.recentGrant.year ? `${p.recentGrant.amount} (${p.recentGrant.year})` : p.recentGrant.amount });
  }

  const level = degreesOffered(p)[0] ?? 'PhD';
  rows.push({
    label: 'Open positions',
    value: !p.openPositions ? 'None right now' : p.openPositionCount ? `${p.openPositionCount} ${level}` : degreesOffered(p).join(' & '),
  });
  return rows;
}

/* ---------- Matching against the student's profile ---------- */

const ratio = (have: number | undefined, need: number | undefined) =>
  !need ? 100 : have ? Math.min(100, Math.round((have / need) * 100)) : 0;

/** How many of the student's specialisations the lab works on (by text or by Subject filter value) */
function fieldOverlap(p: Professor, profile: UserProfile): number {
  const tags = p.researchTags.map((t) => t.toLowerCase());
  const subjects = subjectTagsFor(p.researchTags);
  return profile.specializations.filter((ps) => {
    const a = ps.toLowerCase();
    if (tags.some((t) => t.includes(a) || a.includes(t))) return true;
    return subjectTagsFor([ps]).some((s) => subjects.includes(s));
  }).length;
}

export type MatchRow = { label: string; percent: number };

/** Sidebar bars (Figma 258:3679). Requirements that aren't set count as fully met. */
export function matchBreakdown(p: Professor, profile: UserProfile): MatchRow[] {
  const req = p.lookingFor ?? defaultLookingFor(p);
  return [
    // One shared research interest = 50%, two or more = 100%
    { label: 'Research fit', percent: Math.min(100, fieldOverlap(p, profile) * 50) },
    { label: 'Academic (CGPA)', percent: ratio(profile.cgpa, req.minCgpa) },
    { label: 'Language (IELTS)', percent: ratio(profile.testScores?.ielts, req.minIelts) },
    // The profile has no experience list yet, so a stated requirement counts half
    { label: 'Experience', percent: req.experience ? 50 : 100 },
  ];
}

/** Overall match: average of the bars, minus 20 when the lab doesn't take the student's degree level */
export function matchScore(p: Professor, profile: UserProfile): number {
  const rows = matchBreakdown(p, profile);
  const avg = rows.reduce((sum, r) => sum + r.percent, 0) / rows.length;
  const degreeOk = degreesOffered(p).includes(profile.degreeLevel);
  return Math.max(0, Math.round(degreeOk ? avg : avg - 20));
}

export type LookingForRow = { label: string; requirement: string; you: string; met: boolean };

export function lookingForRows(p: Professor, profile: UserProfile): LookingForRow[] {
  const req = p.lookingFor ?? defaultLookingFor(p);
  const ielts = profile.testScores?.ielts;
  const toefl = profile.testScores?.toefl;
  const offered = degreesOffered(p);
  const rows: LookingForRow[] = [
    {
      label: 'Degree',
      requirement: req.degree,
      you: `You: ${DEGREE_NOUN[profile.degreeLevel]} applicant`,
      met: offered.includes(profile.degreeLevel),
    },
  ];
  if (req.minIelts || req.minToefl) {
    const english = [req.minIelts && `IELTS ${formatScore(req.minIelts)}+`, req.minToefl && `TOEFL ${req.minToefl}+`]
      .filter(Boolean)
      .join(' or ');
    const met = (!!ielts && !!req.minIelts && ielts >= req.minIelts) || (!!toefl && !!req.minToefl && toefl >= req.minToefl);
    rows.push({
      label: 'English',
      requirement: english,
      you: ielts ? `You: ${formatScore(ielts)}` : toefl ? `You: TOEFL ${toefl}` : 'You: not set',
      met,
    });
  }
  if (req.minCgpa) {
    rows.push({
      label: 'CGPA',
      requirement: `${formatScore(req.minCgpa)}+`,
      you: profile.cgpa ? `You: ${profile.cgpa}` : 'You: not set',
      met: !!profile.cgpa && profile.cgpa >= req.minCgpa,
    });
  }
  if (req.experience) {
    rows.push({ label: 'Research', requirement: req.experience, you: 'You: not set', met: false });
  }
  if (req.publications !== 'none') {
    rows.push({
      label: 'Publications',
      requirement: req.publications === 'required' ? 'At least 1 paper required' : 'At least 1 paper preferred',
      you: 'You: not set',
      met: false,
    });
  }
  return rows;
}

export type SimilarItem = { id: string; title: string; subtitle: string; match: number };

/** Up to 3 other faculty sharing a country or research area, best overlap first. */
export function similarFaculty(p: Professor, all: Professor[], profile: UserProfile, limit = 3): SimilarItem[] {
  const fields = new Set([...p.researchTags, ...subjectTagsFor(p.researchTags)].map((x) => x.toLowerCase()));
  return all
    .filter((x) => x.id !== p.id && x.name !== p.name)
    .map((x) => ({
      x,
      overlap:
        (x.country === p.country ? 1 : 0) +
        [...x.researchTags, ...subjectTagsFor(x.researchTags)].filter((t) => fields.has(t.toLowerCase())).length,
      match: matchScore(x, profile),
    }))
    .filter((it) => it.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.match - a.match)
    .slice(0, limit)
    .map(({ x, match }) => ({
      id: x.id,
      title: x.name,
      subtitle: `${x.university} · ${countryShortLabel(x.country)}`,
      match,
    }));
}
