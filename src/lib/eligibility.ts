import type { DegreeLevel, Opportunity, Professor, ResearchPaper, Scholarship, UserProfile } from '@/types';
import { defaultLookingFor, degreesOffered } from '@/lib/professorDetails';
import { relevance } from '@/lib/researchPapers';

// One rule for the "Eligible Now" tab on every feed.
//
// A listing is eligible when, with the student's CURRENT profile:
//   1. their degree level is accepted (a listing that names no degree levels accepts everyone), AND
//   2. every minimum the listing states is met — CGPA, English (IELTS or TOEFL, whichever the listing
//      states; if it states both, either one is enough), GRE and work years.
// A score the student hasn't entered only blocks them when the listing states a minimum for it.
// Match percentages are for ranking and display; they don't decide eligibility.

export type Minimums = {
  minCgpa?: number;
  minIelts?: number;
  minToefl?: number;
  minGre?: number;
  minWorkYears?: number;
};

const atLeast = (have: number | undefined, need: number) => typeof have === 'number' && have >= need;

export function degreeAccepted(levels: DegreeLevel[] | undefined, profile: Pick<UserProfile, 'degreeLevel'>): boolean {
  return !levels?.length || levels.includes(profile.degreeLevel);
}

/** True when every stated minimum is met. No minimums stated → true. */
export function meetsMinimums(profile: Pick<UserProfile, 'cgpa' | 'testScores'>, req: Minimums): boolean {
  if (req.minCgpa && !atLeast(profile.cgpa, req.minCgpa)) return false;

  if (req.minIelts || req.minToefl) {
    const ieltsOk = !!req.minIelts && atLeast(profile.testScores?.ielts, req.minIelts);
    const toeflOk = !!req.minToefl && atLeast(profile.testScores?.toefl, req.minToefl);
    if (!ieltsOk && !toeflOk) return false;
  }

  if (req.minGre && !atLeast(profile.testScores?.gre, req.minGre)) return false;
  // The profile has no work history yet, so a work-experience requirement can't be met
  if (req.minWorkYears) return false;
  return true;
}

export const isScholarshipEligible = (s: Scholarship, profile: UserProfile): boolean =>
  degreeAccepted(s.degreeLevels, profile) && meetsMinimums(profile, s.requirements ?? {});

export const isOpportunityEligible = (o: Opportunity, profile: UserProfile): boolean =>
  degreeAccepted(o.degreeLevels, profile) && meetsMinimums(profile, { minCgpa: o.minCgpa, minIelts: o.minIelts });

export function isProfessorEligible(p: Professor, profile: UserProfile): boolean {
  const req = p.lookingFor ?? defaultLookingFor(p);
  return (
    degreeAccepted(degreesOffered(p), profile) &&
    meetsMinimums(profile, { minCgpa: req.minCgpa, minIelts: req.minIelts, minToefl: req.minToefl })
  );
}

/** Papers have no admission rules: "eligible" means relevant to at least one of the student's interests. */
export const isPaperEligible = (p: Pick<ResearchPaper, 'fieldsOfStudy' | 'tags'>, profile: Pick<UserProfile, 'specializations'>): boolean =>
  relevance(p, profile) !== null;
