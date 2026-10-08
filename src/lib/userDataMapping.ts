// Database enum <-> UI string mapping for the Pipeline and the profile. Pure (no Prisma client), so the
// browser bundle and the tests can import it. Unit-tested in tests/unit/userDataMapping.test.ts.
import type { ApplicationStatus, DecisionResult, DegreeLevel, OutreachStatus } from '@/types';

export type DbApplicationStatus = 'WISHLIST' | 'PREPARING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DECIDED';
export type DbDecisionResult = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WAITLISTED';
export type DbOutreachStatus = 'PROSPECT' | 'DRAFTING' | 'EMAIL_SENT' | 'FOLLOW_UP_DUE' | 'INTERVIEW' | 'FUNDED_OFFER';
export type DbDegreeLevel = 'BACHELORS' | 'MASTERS' | 'PHD';

const invert = <A extends string, B extends string>(m: Record<A, B>) =>
  Object.fromEntries(Object.entries(m).map(([a, b]) => [b, a])) as Record<B, A>;

const APPLICATION_STATUS: Record<ApplicationStatus, DbApplicationStatus> = {
  Wishlist: 'WISHLIST',
  Preparing: 'PREPARING',
  Submitted: 'SUBMITTED',
  'Under Review': 'UNDER_REVIEW',
  Decided: 'DECIDED',
};
const DECISION: Record<DecisionResult, DbDecisionResult> = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Waitlisted: 'WAITLISTED',
  Rejected: 'REJECTED',
};
const OUTREACH_STATUS: Record<OutreachStatus, DbOutreachStatus> = {
  Prospect: 'PROSPECT',
  Drafting: 'DRAFTING',
  'Email Sent': 'EMAIL_SENT',
  'Follow-up Due': 'FOLLOW_UP_DUE',
  Interview: 'INTERVIEW',
  'Funded Offer': 'FUNDED_OFFER',
};
const DEGREE: Record<DegreeLevel, DbDegreeLevel> = { Bachelors: 'BACHELORS', Masters: 'MASTERS', PhD: 'PHD' };

const APPLICATION_STATUS_UI = invert(APPLICATION_STATUS);
const DECISION_UI = invert(DECISION);
const OUTREACH_STATUS_UI = invert(OUTREACH_STATUS);
const DEGREE_UI = invert(DEGREE);

export const APPLICATION_STATUSES = Object.keys(APPLICATION_STATUS) as [ApplicationStatus, ...ApplicationStatus[]];
export const DECISIONS = Object.keys(DECISION) as [DecisionResult, ...DecisionResult[]];
export const OUTREACH_STATUSES = Object.keys(OUTREACH_STATUS) as [OutreachStatus, ...OutreachStatus[]];
export const DEGREE_LEVELS = Object.keys(DEGREE) as [DegreeLevel, ...DegreeLevel[]];

export const applicationStatusToDb = (s: ApplicationStatus) => APPLICATION_STATUS[s];
export const decisionToDb = (d: DecisionResult) => DECISION[d];
export const outreachStatusToDb = (s: OutreachStatus) => OUTREACH_STATUS[s];
export const degreeLevelToDb = (d: DegreeLevel) => DEGREE[d];

// Unknown database values fall back to the first column instead of breaking the board
export const applicationStatusFromDb = (s: string): ApplicationStatus => APPLICATION_STATUS_UI[s as DbApplicationStatus] ?? 'Wishlist';
export const decisionFromDb = (d: string): DecisionResult => DECISION_UI[d as DbDecisionResult] ?? 'Pending';
export const outreachStatusFromDb = (s: string): OutreachStatus => OUTREACH_STATUS_UI[s as DbOutreachStatus] ?? 'Prospect';
export const degreeLevelFromDb = (d: string): DegreeLevel => DEGREE_UI[d as DbDegreeLevel] ?? 'Masters';
