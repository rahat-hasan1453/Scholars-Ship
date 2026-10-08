import { describe, expect, it } from 'vitest';
import { planImport, referencedIds, type ImportContext, type ImportPayload } from '@/lib/userDataImport';
import { DEMO_RECORD_IDS } from '@/lib/legacyStorage';
import { initialApplications } from '../fixtures/mockData';
import { initialOutreachRecords } from '../fixtures/mockOpportunities';

const empty = (): ImportPayload => ({ applications: [], outreach: [], opportunities: [], professors: [], papers: [] });
const ctx = (over: Partial<ImportContext['existing']> = {}): ImportContext => ({
  known: {
    scholarships: new Set(['sch_a', 'sch_b', 'sch_chevening_uk_01', 'sch_daad_design_02']),
    professors: new Set(['prof_a', 'prof_b']),
    opportunities: new Set(['opp_a', 'opp_stanford_ai_01']),
    papers: new Set(['paper_a']),
  },
  existing: {
    scholarships: new Set(),
    outreachProfessors: new Set(),
    outreachOpportunities: new Set(),
    opportunities: new Set(),
    professors: new Set(),
    papers: new Set(),
    ...over,
  },
});

describe('planImport', () => {
  it('drops every old demo card, even when its ids exist in the database', () => {
    expect([...DEMO_RECORD_IDS]).toEqual([...initialApplications.map((a) => a.id), ...initialOutreachRecords.map((r) => r.id)]);
    const plan = planImport({ ...empty(), applications: initialApplications, outreach: initialOutreachRecords }, ctx());
    expect(plan.applications).toEqual([]);
    expect(plan.outreach).toEqual([]);
    expect(plan.skipped).toBe(initialApplications.length + initialOutreachRecords.length);
  });

  it('dedupes applications by scholarship (payload and existing) and drops unknown scholarships', () => {
    const plan = planImport(
      {
        ...empty(),
        applications: [
          { id: 'app_1', scholarshipId: 'sch_a', status: 'Preparing' },
          { id: 'app_2', scholarshipId: 'sch_a', status: 'Submitted' },
          { id: 'app_3', scholarshipId: 'sch_b' },
          { id: 'app_4', scholarshipId: 'sch_nope' },
        ],
      },
      ctx({ scholarships: new Set(['sch_b']) }),
    );
    expect(plan.applications.map((a) => [a.scholarshipId, a.status])).toEqual([['sch_a', 'Preparing']]);
    expect(plan.skipped).toBe(3);
  });

  it('repairs bad fields with defaults but skips items without a usable id', () => {
    const plan = planImport(
      {
        ...empty(),
        applications: [
          { scholarshipId: 'sch_a', status: 'Lost', decision: 9, notes: null, deadline: 'never', tasks: 'x' },
          { status: 'Wishlist' },
          null,
        ],
      },
      ctx(),
    );
    expect(plan.applications).toEqual([{ scholarshipId: 'sch_a', status: 'Wishlist', decision: 'Pending', notes: '', deadline: undefined, tasks: [] }]);
    expect(plan.skipped).toBe(2);
  });

  it('outreach: keeps a valid professor or feed post, drops unknown references, dedupes', () => {
    const base = { professorName: 'P', institution: 'U', status: 'Drafting', notes: '' };
    const plan = planImport(
      {
        ...empty(),
        outreach: [
          { ...base, id: 'o1', professorId: 'prof_a' },
          { ...base, id: 'o2', professorId: 'prof_a' }, // duplicate professor
          { ...base, id: 'o3', opportunityId: 'opp_a', professorId: 'openalex_A1' }, // unknown professor, known post
          { ...base, id: 'o4', opportunityId: 'opp_live_x' }, // nothing known
          { ...base, id: 'o5', professorId: 'prof_b' }, // already tracked
        ],
      },
      ctx({ outreachProfessors: new Set(['prof_b']) }),
    );
    expect(plan.outreach.map((o) => [o.id, o.professorId, o.opportunityId])).toEqual([
      ['o1', 'prof_a', undefined],
      ['o3', undefined, 'opp_a'],
    ]);
    expect(plan.skipped).toBe(3);
  });

  it('bookmarks: only known ids, once, and not ones the user already saved', () => {
    const plan = planImport(
      { ...empty(), opportunities: ['opp_a', 'opp_a', 'opp_x', 5], professors: ['prof_a', 'prof_b'], papers: ['paper_a', 'x'.repeat(200)] },
      ctx({ professors: new Set(['prof_b']) }),
    );
    expect(plan).toMatchObject({ opportunities: ['opp_a'], professors: ['prof_a'], papers: ['paper_a'] });
    expect(plan.skipped).toBe(5);
  });
});

describe('referencedIds', () => {
  it('collects the ids to look up, once each, ignoring junk', () => {
    const refs = referencedIds({
      applications: [{ scholarshipId: 'sch_a' }, { scholarshipId: 'sch_a' }, { scholarshipId: 3 }, 'x'],
      outreach: [{ professorId: 'prof_a', opportunityId: 'opp_a' }],
      opportunities: ['opp_a', 'opp_b', {}],
      professors: ['prof_b'],
      papers: ['paper_a', 'y'.repeat(101)],
    });
    expect(refs).toEqual({ scholarships: ['sch_a'], professors: ['prof_a', 'prof_b'], opportunities: ['opp_a', 'opp_b'], papers: ['paper_a'] });
  });
});
