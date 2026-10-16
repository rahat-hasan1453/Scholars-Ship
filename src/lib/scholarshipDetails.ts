import type { Scholarship, UserProfile } from '@/types';
import { calculateMatchScore } from '@/lib/utils';

export type FundingRow = { label: string; value: string };

/** "€992/mo Stipend + Travel Allowance" → [{ label: 'Stipend', value: '€992/mo' }, { label: 'Travel Allowance', value: 'Included' }] */
export function deriveFundingBreakdown(fundingAmount: string): FundingRow[] {
  return fundingAmount
    .split(' + ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const tokens = part.split(' ');
      const idx = tokens.findIndex((t) => /\d/.test(t));
      if (idx === -1) return { label: part, value: 'Included' };
      let end = idx;
      // "1,000,000 KRW/mo" keeps the currency token with the amount
      if (tokens[end + 1] && /^[A-Z]{2,4}(\/\w+)?$/.test(tokens[end + 1])) end++;
      const value = tokens.slice(0, end + 1).join(' ');
      const label = tokens.slice(end + 1).join(' ');
      if (!label || !/^[A-Z]/.test(label)) return { label: 'Award', value: part };
      return { label, value };
    });
}

/** "German Academic Exchange Service (DAAD)" → "DAAD" */
export function providerShortName(provider: string): string {
  const m = provider.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : provider;
}

export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

export function defaultApplySteps(s: Pick<Scholarship, 'deadline'>): string[] {
  return [
    'Check that you meet the eligibility requirements',
    'Prepare your CV, transcripts and motivation letter',
    `Submit your application on the official portal before ${formatDeadline(s.deadline)}`,
  ];
}

/** Fills the details-page fields that can be derived from the core listing data. */
export function withDetailDefaults(s: Scholarship): Scholarship {
  return {
    ...s,
    providerShort: s.providerShort ?? providerShortName(s.provider),
    fieldOfStudy: s.fieldOfStudy ?? s.specializations.slice(0, 3).join(', '),
    fundingBreakdown: s.fundingBreakdown?.length ? s.fundingBreakdown : deriveFundingBreakdown(s.fundingAmount),
    applySteps: s.applySteps?.length ? s.applySteps : defaultApplySteps(s),
  };
}

const COUNTRY_CODES: Record<string, string> = {
  USA: 'US', 'United Kingdom': 'GB', Germany: 'DE', Canada: 'CA', Australia: 'AU', Switzerland: 'CH',
  Sweden: 'SE', Finland: 'FI', Netherlands: 'NL', France: 'FR', Austria: 'AT', Ireland: 'IE', Italy: 'IT',
  Hungary: 'HU', Estonia: 'EE', Turkey: 'TR', Japan: 'JP', 'South Korea': 'KR', Singapore: 'SG',
  China: 'CN', 'Saudi Arabia': 'SA', Spain: 'ES', Portugal: 'PT', Cyprus: 'CY', Norway: 'NO',
};

export function countryFlagEmoji(country: string): string {
  const code = COUNTRY_CODES[country];
  if (!code) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const specOverlap = (s: Scholarship, profile: UserProfile) =>
  s.specializations.filter((spec) =>
    profile.specializations.some((ps) => {
      const a = ps.toLowerCase();
      const b = spec.toLowerCase();
      return a.includes(b) || b.includes(a);
    }),
  ).length;

export type MatchRow = { label: string; percent: number };

/** Per-criterion match bars for the sidebar. Rows without a requirement count as fully met. */
export function matchBreakdown(s: Scholarship, profile: UserProfile): MatchRow[] {
  const ratio = (have: number | undefined, need: number | undefined) =>
    !need ? 100 : have ? Math.min(100, Math.round((have / need) * 100)) : 0;
  const r = s.requirements ?? {};
  const rows: MatchRow[] = [
    { label: 'Academic (CGPA)', percent: ratio(profile.cgpa, r.minCgpa) },
    r.minToefl && !r.minIelts
      ? { label: 'Language (TOEFL)', percent: ratio(profile.testScores?.toefl, r.minToefl) }
      : { label: 'Language (IELTS)', percent: ratio(profile.testScores?.ielts, r.minIelts) },
    // One shared specialisation = 50%, two or more = 100%
    { label: 'Field of study', percent: Math.min(100, specOverlap(s, profile) * 50) },
  ];
  // The profile has no work history yet, so a work requirement shows as unmet
  if (r.minWorkYears) rows.push({ label: 'Experience', percent: 0 });
  return rows;
}

export type EligibilityRow = { label: string; requirement: string; you: string; met: boolean };

export function eligibilityRows(s: Scholarship, profile: UserProfile): EligibilityRow[] {
  const r = s.requirements ?? {};
  // Band scores read as "8.0", not "8"
  const fmt = (label: string, n: number) => (label === 'IELTS' ? n.toFixed(1) : String(n));
  const scoreRow = (label: string, need: number | undefined, have: number | undefined, none: string): EligibilityRow =>
    need
      ? { label, requirement: `${fmt(label, need)}+`, you: have ? `You: ${fmt(label, have)}` : 'You: not set', met: !!have && have >= need }
      : { label, requirement: none, you: '—', met: true };
  const rows = [
    scoreRow('CGPA', r.minCgpa, profile.cgpa, 'Not specified'),
    r.minToefl && !r.minIelts
      ? scoreRow('TOEFL', r.minToefl, profile.testScores?.toefl, 'Not specified')
      : scoreRow('IELTS', r.minIelts, profile.testScores?.ielts, 'Not specified'),
    scoreRow('GRE', r.minGre, profile.testScores?.gre, 'Not specified'),
  ];
  if (r.minWorkYears) {
    rows.push({ label: 'Work experience', requirement: `${r.minWorkYears} years after graduation`, you: 'You: not set', met: false });
  }
  return rows;
}

export type SimilarItem = { id: string; title: string; subtitle: string; match: number };

/** Up to 3 listings sharing a country or specialisation, best overlap first. */
export function similarScholarships(s: Scholarship, all: Scholarship[], profile: UserProfile, limit = 3): SimilarItem[] {
  const specs = new Set(s.specializations.map((x) => x.toLowerCase()));
  return all
    .filter((o) => o.id !== s.id)
    .map((o) => ({
      o,
      overlap:
        (o.countries.some((c) => s.countries.includes(c)) ? 2 : 0) +
        o.specializations.filter((x) => specs.has(x.toLowerCase())).length,
      match: calculateMatchScore(o, profile),
    }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.match - a.match)
    .slice(0, limit)
    .map(({ o, match }) => ({
      id: o.id,
      title: o.title,
      subtitle: `${o.providerShort ?? providerShortName(o.provider)} · ${o.countries[0] === 'United Kingdom' ? 'UK' : o.countries[0]}`,
      match,
    }));
}
