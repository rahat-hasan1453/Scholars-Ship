import { describe, expect, it } from 'vitest';
import { ApplicationStatus, DecisionResult, OutreachStatus } from '@prisma/client';
import {
  APPLICATION_STATUSES,
  DECISIONS,
  OUTREACH_STATUSES,
  applicationStatusFromDb,
  applicationStatusToDb,
  decisionFromDb,
  decisionToDb,
  degreeLevelFromDb,
  degreeLevelToDb,
  outreachStatusFromDb,
  outreachStatusToDb,
} from '@/lib/userDataMapping';

describe('Pipeline enum mapping', () => {
  it('maps every application status to the Prisma enum and back', () => {
    expect(APPLICATION_STATUSES).toEqual(['Wishlist', 'Preparing', 'Submitted', 'Under Review', 'Decided']);
    expect(APPLICATION_STATUSES.map(applicationStatusToDb)).toEqual(['WISHLIST', 'PREPARING', 'SUBMITTED', 'UNDER_REVIEW', 'DECIDED']);
    for (const s of APPLICATION_STATUSES) expect(applicationStatusFromDb(applicationStatusToDb(s))).toBe(s);
  });
  it('maps every decision both ways', () => {
    expect(DECISIONS.map(decisionToDb)).toEqual(['PENDING', 'ACCEPTED', 'WAITLISTED', 'REJECTED']);
    for (const d of DECISIONS) expect(decisionFromDb(decisionToDb(d))).toBe(d);
  });
  it('maps every outreach status both ways', () => {
    expect(OUTREACH_STATUSES.map(outreachStatusToDb)).toEqual(['PROSPECT', 'DRAFTING', 'EMAIL_SENT', 'FOLLOW_UP_DUE', 'INTERVIEW', 'FUNDED_OFFER']);
    for (const s of OUTREACH_STATUSES) expect(outreachStatusFromDb(outreachStatusToDb(s))).toBe(s);
  });
  it('degree levels both ways', () => {
    expect(degreeLevelToDb('PhD')).toBe('PHD');
    expect(degreeLevelFromDb('BACHELORS')).toBe('Bachelors');
  });
  it('uses exactly the values of the Prisma enums', () => {
    expect(new Set(APPLICATION_STATUSES.map(applicationStatusToDb))).toEqual(new Set(Object.values(ApplicationStatus)));
    expect(new Set(DECISIONS.map(decisionToDb))).toEqual(new Set(Object.values(DecisionResult)));
    expect(new Set(OUTREACH_STATUSES.map(outreachStatusToDb))).toEqual(new Set(Object.values(OutreachStatus)));
  });
  it('unknown database values fall back instead of breaking the board', () => {
    expect(applicationStatusFromDb('ARCHIVED')).toBe('Wishlist');
    expect(decisionFromDb('?')).toBe('Pending');
    expect(outreachStatusFromDb('')).toBe('Prospect');
    expect(degreeLevelFromDb('POSTDOC')).toBe('Masters');
  });
});
