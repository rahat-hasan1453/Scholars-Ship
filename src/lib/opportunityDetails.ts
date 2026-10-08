import type { DegreeLevel, Opportunity, OpportunitySource, UserProfile } from '@/types';
import { formatDeadline } from '@/lib/scholarshipDetails';

// Pure helpers for the Opportunity Feed card and details page (no React, no database).

/** Shown when an imported post doesn't name an institution or a place */
export const INSTITUTION_NOT_STATED = 'Institution not stated';
export const LOCATION_NOT_STATED = 'Location not stated';

/** Mock data writes "UK"; the Country filter uses "United Kingdom". */
export function normalizeCountry(country: string): string {
  return country === 'UK' ? 'United Kingdom' : country;
}

const FLAG_CODES: Record<string, string> = {
  USA: 'us', Germany: 'de', 'United Kingdom': 'gb', Canada: 'ca', Switzerland: 'ch', Australia: 'au',
  Netherlands: 'nl', Sweden: 'se', Norway: 'no', France: 'fr', Japan: 'jp', Singapore: 'sg', 'South Korea': 'kr',
};

/** Round flag in /public/flags, or null when we don't ship one */
export function countryFlagSrc(country: string): string | null {
  const code = FLAG_CODES[country];
  return code ? `/flags/${code}.svg` : null;
}

export function countryShortLabel(country: string): string {
  return country === 'United Kingdom' ? 'UK' : country;
}

// Subject filter values (ALL_SUBJECTS) matched against free-text field tags
const SUBJECT_RULES: [string, RegExp][] = [
  ['UX & Product Design', /\bux\b|product design|interaction design|service design/i],
  ['HCI', /\bhci\b|human-computer/i],
  ['Computer Science', /computer science|informatics|software|computing|\bcs\b/i],
  ['Artificial Intelligence', /artificial intelligence|\bai\b/i],
  ['Data Science', /data science|statistics|econometrics/i],
  ['Machine Learning', /machine learning|deep learning|computer vision|natural language/i],
  ['Human Factors', /cognitive|ergonomics|human factors|haptics|accessib|assistive/i],
  ['Robotics', /robot|mechatronics|autonomous/i],
  ['Information Systems', /information science|information systems|social computing|cscw/i],
  ['Cybersecurity', /cyber/i],
  ['Biomedical Informatics', /bioinformatics|biomedical|health informatics|genomics/i],
  ['Electrical Engineering', /electrical|internet of things|quantum computing/i],
];

export function subjectTagsFor(fieldTags: string[]): string[] {
  const text = fieldTags.join(' | ');
  return SUBJECT_RULES.filter(([, re]) => re.test(text)).map(([subject]) => subject);
}

/** Acceptance rate (%) at or above which a listing counts as a "Safe Regional" pick */
export const SAFE_REGIONAL_MIN_ACCEPTANCE = 20;
export const HIGH_ACCEPTANCE_MIN = 85;

/** Acceptance & Funding filter values that describe this listing */
export function fundingTagsFor(funding: string, acceptanceRate?: number): string[] {
  const tags: string[] = [];
  const tuition = /tuition|fees? (covered|remission)|remission|€0|0 chf/i.test(funding);
  const living = /stipend|salary|fellowship|living|allowance|gsr|assistantship|scholarship/i.test(funding);
  if (acceptanceRate !== undefined && acceptanceRate >= SAFE_REGIONAL_MIN_ACCEPTANCE) tags.push('Safe Regional');
  if (tuition) tags.push('Tuition Waiver');
  if ((tuition && living) || /salary|fully[- ]funded|full(?:y)? funding|TV-L/i.test(funding)) tags.push('Full Funding');
  if (/assistantship|\bRA\b|\bTA\b|gsr/i.test(funding)) tags.push('Graduate Assistantship (TA/RA)');
  if (/stipend|living|allowance|salary/i.test(funding)) tags.push('Stipend / Living Allowance');
  if (acceptanceRate !== undefined && acceptanceRate >= HIGH_ACCEPTANCE_MIN) tags.push('High Acceptance (85%+)');
  if (/fellowship|fellow|scholarship/i.test(funding)) tags.push('University Fellowship');
  return tags;
}

/** 3 → "3.0", 2.65 → "2.65" */
export const formatScore = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

const DEGREE_LABEL: Record<DegreeLevel, string> = { Bachelors: 'Bachelors', Masters: 'Masters', PhD: 'PhD' };

/** "CGPA 3.0+, IELTS 6.5+, Open to Masters & PhD" */
export function admissionLine(o: Pick<Opportunity, 'minCgpa' | 'minIelts' | 'degreeLevels'>): string {
  const parts: string[] = [];
  if (o.minCgpa) parts.push(`CGPA ${formatScore(o.minCgpa)}+`);
  if (o.minIelts) parts.push(`IELTS ${formatScore(o.minIelts)}+`);
  parts.push(`Open to ${o.degreeLevels.map((d) => DEGREE_LABEL[d]).join(' & ')}`);
  return parts.join(', ');
}

/** The degree a post is mainly hiring for: the first one it lists */
export const primaryDegree = (degreeLevels: DegreeLevel[]): DegreeLevel => degreeLevels[0] ?? 'PhD';

/** "PhD Student (4 years)" / "Graduate Assistant (2 years)" */
export function positionTypeFor(degreeLevels: DegreeLevel[], duration: string): string {
  return `${primaryDegree(degreeLevels) === 'PhD' ? 'PhD Student' : 'Graduate Assistant'} (${duration})`;
}

const SUBJECT_CODES: Record<string, string> = {
  HCI: 'HCI', 'UX & Product Design': 'UX', 'Computer Science': 'CS', 'Artificial Intelligence': 'AI',
  'Data Science': 'DS', 'Machine Learning': 'ML', 'Human Factors': 'HF', Robotics: 'ROBOTICS',
  'Information Systems': 'IS', Cybersecurity: 'SEC', 'Biomedical Informatics': 'BIO', 'Electrical Engineering': 'EE',
};

/** Short email subject code, e.g. "HCI-PhD-2027" */
export function applicationCode(o: Pick<Opportunity, 'subjectTags' | 'fieldTags' | 'degreeLevels' | 'startDate'>): string {
  const field =
    (o.subjectTags[0] && SUBJECT_CODES[o.subjectTags[0]]) ||
    (o.fieldTags[0] ?? 'Research').split(/\s+/)[0].replace(/[^A-Za-z]/g, '').toUpperCase();
  const year = o.startDate?.match(/\d{4}/)?.[0] ?? '';
  return [field, primaryDegree(o.degreeLevels), year].filter(Boolean).join('-');
}

export function aboutLabFor(o: { labName?: string; institution: string; fieldTags: string[]; recentPaperTopic?: string }): string {
  const lab = o.labName ? `${o.labName} at ${o.institution}` : o.institution;
  const focus = o.fieldTags.slice(0, 3).join(', ');
  const recent = o.recentPaperTopic ? ` Recent work: ${o.recentPaperTopic}.` : '';
  return `${lab} works on ${focus}.${recent}`;
}

export function defaultApplySteps(
  o: Pick<Opportunity, 'authorName' | 'contactEmail' | 'deadline' | 'subjectTags' | 'fieldTags' | 'degreeLevels' | 'startDate'>,
): string[] {
  const to = o.contactEmail ? `${o.authorName} (${o.contactEmail})` : o.authorName;
  return [
    `Email your CV and a 1-page research statement to ${to}`,
    `Use “${applicationCode(o)}” as the email subject line`,
    o.deadline
      ? `Apply before ${formatDeadline(o.deadline)}; shortlisted candidates are invited to an interview`
      : 'Check the original post for the deadline and how to apply',
  ];
}

const SOURCE_LABEL: Record<OpportunitySource, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  lab_website: 'the lab website',
  web: 'the web',
  reddit: 'Reddit',
  mastodon: 'Mastodon',
};

export const sourceLabel = (source: OpportunitySource) => SOURCE_LABEL[source] ?? 'the web';

/** "Posted on LinkedIn · 2 days ago" */
export function postedLine(o: Pick<Opportunity, 'source' | 'postedAt'>, now = Date.now()): string {
  const days = Math.max(0, Math.floor((now - new Date(o.postedAt).getTime()) / 86_400_000));
  const ago = days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  return `Posted on ${sourceLabel(o.source)} · ${ago}`;
}

/** Short value for the Funding fact, e.g. "Salaried position" */
export function fundingKind(funding: string): string {
  if (/salary|contract/i.test(funding)) return 'Salaried position';
  if (/fellowship|scholarship/i.test(funding)) return 'Fellowship';
  if (/assistantship|gsr|\bRA\b|\bTA\b/i.test(funding)) return 'Assistantship';
  if (/stipend|allowance|living/i.test(funding)) return 'Stipend + tuition';
  return 'Funded';
}

export const isFullyFunded = (o: Pick<Opportunity, 'fundingTags'>) => o.fundingTags.includes('Full Funding');

/* ---------- Matching against the student's profile ---------- */

/** How many of the student's specialisations this listing covers (by text or by Subject filter value) */
const fieldOverlap = (o: Opportunity, profile: UserProfile) => {
  const tags = [...o.subjectTags, ...o.fieldTags].map((t) => t.toLowerCase());
  return profile.specializations.filter((ps) => {
    const a = ps.toLowerCase();
    if (tags.some((t) => t.includes(a) || a.includes(t))) return true;
    return subjectTagsFor([ps]).some((subject) => o.subjectTags.includes(subject));
  }).length;
};

const ratio = (have: number | undefined, need: number | undefined) =>
  !need ? 100 : have ? Math.min(100, Math.round((have / need) * 100)) : 0;

export type MatchRow = { label: string; percent: number };

/** Sidebar bars (Figma 258:3445). Rows without a requirement count as fully met. */
export function matchBreakdown(o: Opportunity, profile: UserProfile): MatchRow[] {
  return [
    { label: 'Academic (CGPA)', percent: ratio(profile.cgpa, o.minCgpa) },
    { label: 'Language (IELTS)', percent: ratio(profile.testScores?.ielts, o.minIelts) },
    // One shared research interest = 50%, two or more = 100%
    { label: 'Research fit', percent: Math.min(100, fieldOverlap(o, profile) * 50) },
    // The profile has no publication list yet: "preferred" counts half, "required" counts as unmet
    { label: 'Publications', percent: o.publications === 'none' ? 100 : o.publications === 'preferred' ? 50 : 0 },
  ];
}

/** Overall match: average of the breakdown bars, plus a penalty when the degree level isn't offered */
export function matchScore(o: Opportunity, profile: UserProfile): number {
  const rows = matchBreakdown(o, profile);
  const avg = rows.reduce((sum, r) => sum + r.percent, 0) / rows.length;
  const degreeOk = o.degreeLevels.includes(profile.degreeLevel);
  return Math.max(0, Math.round(degreeOk ? avg : avg - 20));
}

export type EligibilityRow = { label: string; requirement: string; you: string; met: boolean };

export function eligibilityRows(o: Opportunity, profile: UserProfile): EligibilityRow[] {
  const ielts = profile.testScores?.ielts;
  const rows: EligibilityRow[] = [
    {
      label: 'Degree',
      requirement: `Open to ${o.degreeLevels.map((d) => DEGREE_LABEL[d]).join(' & ')} applicants`,
      you: `You: ${profile.degreeLevel}`,
      met: o.degreeLevels.includes(profile.degreeLevel),
    },
    o.minIelts
      ? {
          label: 'English',
          requirement: `IELTS ${formatScore(o.minIelts)}+`,
          you: ielts ? `You: ${formatScore(ielts)}` : 'You: not set',
          met: !!ielts && ielts >= o.minIelts,
        }
      : { label: 'English', requirement: 'Not specified', you: '—', met: true },
  ];
  if (o.minCgpa) {
    rows.push({
      label: 'CGPA',
      requirement: `${formatScore(o.minCgpa)}+`,
      you: profile.cgpa ? `You: ${profile.cgpa}` : 'You: not set',
      met: !!profile.cgpa && profile.cgpa >= o.minCgpa,
    });
  }
  if (o.publications !== 'none') {
    rows.push({
      label: 'Publications',
      requirement: o.publications === 'required' ? 'At least 1 paper required' : 'At least 1 paper preferred',
      you: 'You: not set',
      met: false,
    });
  }
  return rows;
}

export type SimilarItem = { id: string; title: string; subtitle: string; match: number };

/** Up to 3 listings sharing a country or research field, best overlap first. */
export function similarOpportunities(o: Opportunity, all: Opportunity[], profile: UserProfile, limit = 3): SimilarItem[] {
  const fields = new Set([...o.subjectTags, ...o.fieldTags].map((x) => x.toLowerCase()));
  return all
    .filter((x) => x.id !== o.id)
    .map((x) => ({
      x,
      overlap:
        (x.country === o.country ? 1 : 0) +
        [...x.subjectTags, ...x.fieldTags].filter((t) => fields.has(t.toLowerCase())).length,
      match: matchScore(x, profile),
    }))
    .filter((it) => it.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.match - a.match)
    .slice(0, limit)
    .map(({ x, match }) => ({
      id: x.id,
      title: x.title,
      subtitle: `${x.institution} · ${countryShortLabel(x.country)}`,
      match,
    }));
}
