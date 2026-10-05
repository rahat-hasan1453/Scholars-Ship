import { describe, expect, it } from 'vitest';
import type { Opportunity, Professor, ResearchPaper, Scholarship, UserProfile } from '@/types';
import {
  degreeAccepted,
  isOpportunityEligible,
  isPaperEligible,
  isProfessorEligible,
  isScholarshipEligible,
  meetsMinimums,
} from '@/lib/eligibility';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';

const profile: UserProfile = {
  id: 'u', name: 'U', email: 'u@x.test', degreeLevel: 'Masters', specializations: ['UX Design', 'HCI'],
  targetCountries: ['Germany'], cgpa: 3.5, testScores: { ielts: 7 }, onboardingCompleted: true,
};
const noScores: UserProfile = { ...profile, cgpa: 0, testScores: {} };

describe('degreeAccepted', () => {
  it('needs the student degree level to be listed', () => {
    expect(degreeAccepted(['Masters', 'PhD'], profile)).toBe(true);
    expect(degreeAccepted(['PhD'], profile)).toBe(false);
  });
  it('accepts everyone when the listing names no degree levels', () => {
    expect(degreeAccepted([], profile)).toBe(true);
    expect(degreeAccepted(undefined, profile)).toBe(true);
  });
});

describe('meetsMinimums', () => {
  it('is true when nothing is required, even without scores', () => {
    expect(meetsMinimums(noScores, {})).toBe(true);
  });
  it('checks CGPA', () => {
    expect(meetsMinimums(profile, { minCgpa: 3.5 })).toBe(true);
    expect(meetsMinimums(profile, { minCgpa: 3.6 })).toBe(false);
  });
  it('treats a missing score as not met only when a minimum is stated', () => {
    expect(meetsMinimums(noScores, { minCgpa: 3 })).toBe(false);
    expect(meetsMinimums(noScores, { minIelts: 6 })).toBe(false);
    expect(meetsMinimums(noScores, { minGre: 300 })).toBe(false);
    expect(meetsMinimums(noScores, { minWorkYears: 0 })).toBe(true);
  });
  it('accepts IELTS or TOEFL when both are stated', () => {
    expect(meetsMinimums(profile, { minIelts: 6.5, minToefl: 100 })).toBe(true);
    expect(meetsMinimums(profile, { minIelts: 7.5, minToefl: 100 })).toBe(false);
    expect(meetsMinimums({ ...profile, testScores: { toefl: 105 } }, { minIelts: 7.5, minToefl: 100 })).toBe(true);
  });
  it('needs the matching test when only one is stated', () => {
    expect(meetsMinimums({ ...profile, testScores: { toefl: 110 } }, { minIelts: 6 })).toBe(false);
    expect(meetsMinimums({ ...profile, testScores: { toefl: 110 } }, { minToefl: 100 })).toBe(true);
  });
  it('counts a work-experience requirement as unmet (no work history on the profile yet)', () => {
    expect(meetsMinimums(profile, { minWorkYears: 2 })).toBe(false);
  });
});

const scholarship = (over: Partial<Scholarship> = {}): Scholarship => ({
  id: 's', title: 'S', provider: 'P', deadline: '2026-12-01T00:00:00Z', fundingAmount: '1', fundingType: 'FULL',
  degreeLevels: ['Masters'], countries: ['Germany'], specializations: [], requirements: { minCgpa: 3.3, minIelts: 6.5 },
  officialUrl: 'https://x.test', description: 'd', tags: [], ...over,
});

describe('isScholarshipEligible', () => {
  it('needs degree and every stated minimum', () => {
    expect(isScholarshipEligible(scholarship(), profile)).toBe(true);
    expect(isScholarshipEligible(scholarship({ degreeLevels: ['PhD'] }), profile)).toBe(false);
    expect(isScholarshipEligible(scholarship({ requirements: { minCgpa: 3.8 } }), profile)).toBe(false);
    expect(isScholarshipEligible(scholarship({ requirements: { minWorkYears: 2 } }), profile)).toBe(false);
  });
  it('lets a student with no scores apply to listings that state no minimums', () => {
    expect(isScholarshipEligible(scholarship({ requirements: {} }), noScores)).toBe(true);
    expect(isScholarshipEligible(scholarship(), noScores)).toBe(false);
  });
});

describe('isOpportunityEligible', () => {
  const o = (over: Partial<Opportunity> = {}): Opportunity => ({ ...OPPORTUNITY_LISTINGS[0], ...over });
  it('checks degree, CGPA and IELTS', () => {
    expect(isOpportunityEligible(o({ degreeLevels: ['Masters'], minCgpa: 3, minIelts: 6.5 }), profile)).toBe(true);
    expect(isOpportunityEligible(o({ degreeLevels: ['PhD'], minCgpa: 3, minIelts: 6.5 }), profile)).toBe(false);
    expect(isOpportunityEligible(o({ degreeLevels: ['Masters'], minCgpa: 3.9 }), profile)).toBe(false);
    expect(isOpportunityEligible(o({ degreeLevels: ['Masters'], minCgpa: undefined, minIelts: 7.5 }), profile)).toBe(false);
    expect(isOpportunityEligible(o({ degreeLevels: ['Masters'], minCgpa: undefined, minIelts: undefined }), noScores)).toBe(true);
  });
});

describe('isProfessorEligible', () => {
  const p = (over: Partial<Professor> = {}): Professor => ({
    id: 'p', name: 'P', title: 'Prof', university: 'U', department: 'D', country: 'Germany', researchTags: ['HCI'],
    openPositions: true, avatarUrl: '', acceptingTerms: [], degreeLevels: ['Masters', 'PhD'], ...over,
  });
  it('uses the degrees the lab takes and its stated minimums', () => {
    expect(isProfessorEligible(p({ lookingFor: { degree: 'x', minCgpa: 3, minIelts: 6.5, publications: 'none' } }), profile)).toBe(true);
    expect(isProfessorEligible(p({ degreeLevels: ['PhD'] }), profile)).toBe(false);
    expect(isProfessorEligible(p({ lookingFor: { degree: 'x', minCgpa: 3.9, publications: 'none' } }), profile)).toBe(false);
  });
  it('falls back to the default lookingFor minimums (IELTS 6.5 outside the USA)', () => {
    expect(isProfessorEligible(p(), profile)).toBe(true);
    expect(isProfessorEligible(p(), noScores)).toBe(false);
  });
});

describe('isPaperEligible', () => {
  const paper = { fieldsOfStudy: ['Human-Computer Interaction'], tags: ['UX'] } as Pick<ResearchPaper, 'fieldsOfStudy' | 'tags'>;
  it('means relevant to at least one interest', () => {
    expect(isPaperEligible(paper, profile)).toBe(true);
    expect(isPaperEligible({ fieldsOfStudy: ['Astrophysics'], tags: [] }, profile)).toBe(false);
    expect(isPaperEligible(paper, { specializations: [] })).toBe(false);
  });
});
