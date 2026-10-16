// One subject list for onboarding, profile and every feed's Subject filter.
import { SUBJECT_KEYWORDS } from './subjectKeywords';
export const SUBJECTS = [
  'Computer Science',
  'Software Engineering & Distributed Systems',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science & Analytics',
  'Human-Computer Interaction (HCI)',
  'UX & Product Design',
  'Human Factors',
  'Information Systems',
  'Cybersecurity',
  'Robotics & Autonomous Systems',
  'Electrical & Computer Engineering',
  'Mechanical & Aerospace Engineering',
  'Materials Science & Nanotechnology',
  'Biomedical Engineering',
  'Biomedical Informatics',
  'Biotechnology & Genomics',
  'Neuroscience & Neurotechnology',
  'Public Health & Epidemiology',
  'Economics & Quantitative Finance',
  'Public Policy & Governance',
] as const;

// --- Keyword matching: see subjectKeywords.ts for the words behind every subject ---

const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
// Hyphens and spaces are interchangeable ("human-computer" = "human computer"); a trailing * allows any ending.
function wordPattern(word: string): string {
  const stem = word.endsWith('*');
  const body = escape(stem ? word.slice(0, -1) : word).replace(/[\s-]+/g, '[\\s-]+');
  return stem ? `${body}\\p{L}*` : body;
}
const compile = (words: string[]) =>
  words.length ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(wordPattern).join('|')})(?![\\p{L}\\p{N}])`, 'iu') : null;

const MATCHERS = SUBJECTS.map((subject) => ({
  subject: subject as string,
  core: compile(SUBJECT_KEYWORDS[subject].core),
  related: compile(SUBJECT_KEYWORDS[subject].related),
}));

/** Computer Science is on most computing papers as a broad label, so the bare label only counts as "related" */
const BROAD_LABEL = 'Computer Science';

/** 2 = the text is about the subject itself, 1 = it is close to it, 0 = not related */
export function subjectTier(subject: string, texts: string[]): 0 | 1 | 2 {
  const m = MATCHERS.find((x) => x.subject === subject);
  const name = subject.toLowerCase();
  let tier: 0 | 1 | 2 = 0;
  for (const raw of texts) {
    const t = raw.trim();
    if (!t) continue;
    if (t.toLowerCase() === name) {
      if (subject !== BROAD_LABEL) return 2;
      tier = 1;
    } else if (m?.core?.test(t)) return 2;
    else if (tier === 0 && m?.related?.test(t)) tier = 1;
  }
  return tier;
}

/** Subjects a free text is about (core words or the exact subject name), e.g. to tag a listing */
export function subjectTagsFor(texts: string[]): string[] {
  return MATCHERS.filter(({ subject, core }) =>
    texts.some((raw) => raw.trim().toLowerCase() === subject.toLowerCase() || !!core?.test(raw)),
  ).map(({ subject }) => subject);
}

// Names used before the single list existed (old onboarding + old filter values)
const LEGACY_NAMES: Record<string, string[]> = {
  'Artificial Intelligence & Machine Learning': ['Artificial Intelligence', 'Machine Learning'],
  'Human-Computer Interaction (HCI) & UX': ['Human-Computer Interaction (HCI)', 'UX & Product Design'],
  HCI: ['Human-Computer Interaction (HCI)'],
  'Data Science': ['Data Science & Analytics'],
  Robotics: ['Robotics & Autonomous Systems'],
  'Electrical Engineering': ['Electrical & Computer Engineering'],
};

/** Old names -> current names; custom subjects the user typed are kept as they are */
export function normalizeSubjects(list: string[] | undefined): string[] {
  return [...new Set((list ?? []).flatMap((s) => LEGACY_NAMES[s] ?? [s]))];
}

/** The best tier across the selected subjects (0 = no match). A scholarship open to "All fields" counts as related to everything. */
export function selectionTier(selected: string[], texts: string[]): 0 | 1 | 2 {
  if (selected.length === 0) return 2;
  if (texts.some((t) => t.trim().toLowerCase() === 'all fields')) return 1;
  let best: 0 | 1 | 2 = 0;
  for (const subject of selected) {
    const tier = subjectTier(subject, texts);
    if (tier > best) best = tier;
    if (best === 2) break;
  }
  return best;
}

/** A Subject filter selection matches an item described by these free-text tags */
export function matchesSubjects(selected: string[], tags: string[]): boolean {
  return selectionTier(selected, tags) > 0;
}

/**
 * Keeps the items that match the selected subjects and puts the closest first (core matches, then related), each group in its
 * original order. With no subject selected, everything is kept as is. `keepUnknown` keeps items with no text at the end.
 */
export function rankBySubject<T>(items: T[], selected: string[], textsOf: (item: T) => string[], keepUnknown = false): T[] {
  if (selected.length === 0) return items;
  const ranked: { item: T; tier: number; index: number }[] = [];
  items.forEach((item, index) => {
    const texts = textsOf(item);
    if (texts.length === 0) {
      if (keepUnknown) ranked.push({ item, tier: 0, index });
      return;
    }
    const tier = selectionTier(selected, texts);
    if (tier > 0) ranked.push({ item, tier, index });
  });
  return ranked.sort((a, b) => b.tier - a.tier || a.index - b.index).map((r) => r.item);
}
