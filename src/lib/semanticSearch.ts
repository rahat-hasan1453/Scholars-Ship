import { Scholarship, Professor, HiringOpportunity } from '@/types';

export interface ParsedSearchIntent {
  rawQuery: string;
  tokens: string[];
  detectedCountry?: string;
  detectedFunding?: 'FULL' | 'FREE' | 'ASSISTANTSHIP';
  detectedDegree?: 'Bachelors' | 'Masters' | 'PhD';
  detectedCategory?: 'scholarships' | 'professors' | 'safe_unis' | 'opportunities' | 'research';
  subjectKeywords: string[];
}

const STOP_WORDS = new Set([
  'in', 'for', 'at', 'the', 'a', 'an', 'and', 'or', 'of', 'to', 'with', 'from',
  'by', 'on', 'about', 'is', 'are', 'find', 'show', 'me', 'i', 'want', 'need'
]);

const COUNTRY_SYNONYMS: Record<string, string> = {
  'united states': 'USA',
  'united kingdom': 'United Kingdom',
  'saudi arabia': 'Saudi Arabia',
  'south korea': 'South Korea',
  deutschland: 'Germany',
  germany: 'Germany',
  german: 'Germany',
  australia: 'Australia',
  australian: 'Australia',
  austria: 'Austria',
  austrian: 'Austria',
  switzerland: 'Switzerland',
  swiss: 'Switzerland',
  netherlands: 'Netherlands',
  dutch: 'Netherlands',
  holland: 'Netherlands',
  sweden: 'Sweden',
  swedish: 'Sweden',
  finland: 'Finland',
  finnish: 'Finland',
  france: 'France',
  french: 'France',
  ireland: 'Ireland',
  irish: 'Ireland',
  hungary: 'Hungary',
  hungarian: 'Hungary',
  singapore: 'Singapore',
  canada: 'Canada',
  canadian: 'Canada',
  japan: 'Japan',
  japanese: 'Japan',
  korea: 'South Korea',
  korean: 'South Korea',
  china: 'China',
  chinese: 'China',
  america: 'USA',
  american: 'USA',
  britain: 'United Kingdom',
  british: 'United Kingdom',
  england: 'United Kingdom',
  usa: 'USA',
  'u.s.': 'USA',
  'u.s.a.': 'USA',
  us: 'USA',
  uk: 'United Kingdom',
};

// Sort synonyms by length descending so longer phrases match first
const SORTED_COUNTRY_SYNS = Object.keys(COUNTRY_SYNONYMS).sort((a, b) => b.length - a.length);

const FUNDING_KEYWORDS = [
  'full funded', 'fully funded', 'full ride', 'full-ride', '100% funded',
  'free tuition', 'zero tuition', 'free', 'tuition waiver', 'stipend',
  'assistantship', 'funded'
];

export function parseNaturalLanguageQuery(query: string): ParsedSearchIntent {
  const lower = query.toLowerCase().trim();
  const rawTokens = lower.split(/[\s,+/]+/).filter(Boolean);
  const meaningfulTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));

  // 1. Strict word-boundary matching for country synonyms (e.g. 'us' must not match 'austria' or 'focus')
  let detectedCountry: string | undefined;
  for (const syn of SORTED_COUNTRY_SYNS) {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      detectedCountry = COUNTRY_SYNONYMS[syn];
      break;
    }
  }

  // 2. If user is in the middle of typing a country name (e.g. 'austri', 'germa', 'switz')
  if (!detectedCountry) {
    const typingTokens = rawTokens.filter((t) => t.length >= 4);
    for (const token of typingTokens) {
      for (const syn of SORTED_COUNTRY_SYNS) {
        if (syn.length >= 4 && syn.startsWith(token)) {
          detectedCountry = COUNTRY_SYNONYMS[syn];
          break;
        }
      }
      if (detectedCountry) break;
    }
  }

  let detectedFunding: 'FULL' | 'FREE' | 'ASSISTANTSHIP' | undefined;
  for (const fKw of FUNDING_KEYWORDS) {
    if (lower.includes(fKw)) {
      if (fKw.includes('free')) detectedFunding = 'FREE';
      else if (fKw.includes('assistantship') || fKw.includes('stipend')) detectedFunding = 'ASSISTANTSHIP';
      else detectedFunding = 'FULL';
      break;
    }
  }

  let detectedDegree: 'Bachelors' | 'Masters' | 'PhD' | undefined;
  if (/phd|doctoral|doctorate/i.test(lower)) detectedDegree = 'PhD';
  else if (/master|masters|msc|masc|ms/i.test(lower)) detectedDegree = 'Masters';
  else if (/bachelor|bachelors|undergrad|bsc/i.test(lower)) detectedDegree = 'Bachelors';

  let detectedCategory: ParsedSearchIntent['detectedCategory'];
  if (/scholarship|grant|fellowship/i.test(lower)) detectedCategory = 'scholarships';
  else if (/professor|faculty|lab|pi|advisor/i.test(lower)) detectedCategory = 'professors';
  else if (/university|universities|college|safe/i.test(lower)) detectedCategory = 'safe_unis';
  else if (/paper|research|publication/i.test(lower)) detectedCategory = 'research';
  else if (/opportunity|hiring|opening|position|job/i.test(lower)) detectedCategory = 'opportunities';

  return {
    rawQuery: query,
    tokens: meaningfulTokens,
    detectedCountry,
    detectedFunding,
    detectedDegree,
    detectedCategory,
    subjectKeywords: meaningfulTokens.filter(
      (t) =>
        t !== detectedCountry?.toLowerCase() &&
        !['scholarship', 'scholarships', 'phd', 'masters', 'bachelors', 'funded', 'full'].includes(t)
    ),
  };
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  usa: ['usa', 'us', 'u.s.', 'u.s.a.', 'united states', 'united states of america', 'america'],
  uk: ['uk', 'u.k.', 'united kingdom', 'britain', 'great britain', 'england'],
};

function countryTerms(value: string): string[] {
  const v = value.trim();
  for (const terms of Object.values(COUNTRY_ALIASES)) {
    if (terms.includes(v)) return terms;
  }
  return [v];
}

/** Whole-word match so "us" never matches Australia/Austria/Russia. */
function containsWord(haystack: string, needle: string): boolean {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${esc}($|[^a-z])`).test(haystack);
}

function countryMatches(itemCountry: string, detected: string): boolean {
  const itemTerms = countryTerms(itemCountry);
  const wanted = countryTerms(detected);
  return wanted.some((w) => itemTerms.some((t) => t === w || containsWord(itemCountry, w) || containsWord(detected, t)));
}

export function matchItemSemantically(
  itemText: string,
  itemCountry: string | string[],
  intent: ParsedSearchIntent
): { matches: boolean; score: number } {
  if (intent.tokens.length === 0) return { matches: true, score: 0 };

  const lowerText = itemText.toLowerCase();
  const countries = Array.isArray(itemCountry) ? itemCountry.map((c) => c.toLowerCase()) : [itemCountry.toLowerCase()];

  let score = 0;

  // 1. Country match
  if (intent.detectedCountry) {
    const dc = intent.detectedCountry.toLowerCase();
    const hasCountry = countries.some((c) => countryMatches(c, dc));
    if (hasCountry) {
      score += 40;
    } else if (countries.length > 0 && !countries.includes('global') && !countries.includes('international')) {
      // Specified a different country, disqualify
      return { matches: false, score: 0 };
    }
  }

  // 2. Funding match
  if (intent.detectedFunding) {
    if (intent.detectedFunding === 'FULL' && (lowerText.includes('full') || lowerText.includes('100%') || lowerText.includes('waiver') || lowerText.includes('€0') || lowerText.includes('free'))) {
      score += 25;
    }
    if (intent.detectedFunding === 'FREE' && (lowerText.includes('free') || lowerText.includes('zero') || lowerText.includes('€0'))) {
      score += 30;
    }
    if (intent.detectedFunding === 'ASSISTANTSHIP' && (lowerText.includes('assistantship') || lowerText.includes('stipend') || lowerText.includes('ta/ra'))) {
      score += 25;
    }
  }

  // 3. Tokens match
  let matchedTokens = 0;
  for (const token of intent.tokens) {
    if (lowerText.includes(token)) {
      matchedTokens++;
      score += 15;
    }
  }

  // If user searched multiple tokens, ensure reasonable match
  if (intent.tokens.length === 1) {
    if (matchedTokens === 0 && score === 0) return { matches: false, score: 0 };
  } else {
    // If country matched and at least one other token or funding matched
    if (intent.detectedCountry && score >= 40) {
      return { matches: true, score };
    }
    if (matchedTokens >= 1) {
      return { matches: true, score };
    }
    return { matches: false, score: 0 };
  }

  return { matches: score > 0, score };
}
