import { describe, expect, it } from 'vitest';
import {
  buildBoard,
  daysUntil,
  DEFAULT_FILTERS,
  filterItems,
  findColumn,
  mergeOrder,
  moveCard,
  progressColor,
  scholarshipSummary,
  SCHOLARSHIP_COLUMNS,
  sortItems,
  statusChanges,
  toOutreachItem,
  toScholarshipItem,
  type PipelineItem,
} from '@/lib/pipeline';
import type { Application, OutreachRecord, Scholarship, UserProfile } from '@/types';

const NOW = new Date('2026-10-08T12:00:00');
const profile = { degreeLevel: 'Masters', targetCountries: ['germany'], specializations: ['Design'] } as unknown as UserProfile;

const scholarship = (over: Partial<Scholarship> = {}) =>
  ({
    id: 's1', title: 'DAAD Study Scholarship', provider: 'DAAD', deadline: '2026-10-15T23:59:59', fundingType: 'FULL',
    degreeLevels: ['Masters'], countries: ['Germany'], specializations: ['Design'], ...over,
  }) as Scholarship;

const app = (over: Partial<Application> = {}): Application => ({
  id: 'a1', scholarshipId: 's1', scholarship: scholarship(), status: 'Preparing', decision: 'Pending', notes: 'one\n\ntwo',
  deadline: '2026-10-15T23:59:59', updatedAt: '2026-10-01T10:00:00',
  tasks: [
    { id: 't1', title: 'a', isCompleted: true },
    { id: 't2', title: 'b', isCompleted: false },
    { id: 't3', title: 'c', isCompleted: true },
    { id: 't4', title: 'd', isCompleted: false },
  ],
  ...over,
});

const item = (id: string, over: Partial<PipelineItem> = {}): PipelineItem => ({
  id, mode: 'scholarships', status: 'Wishlist', providerLabel: 'Provider', provider: 'P', title: id, href: null, progress: 0, decision: null,
  dateLabel: '', dateUrgent: false, notesCount: 0, tasksDone: 0, tasksTotal: 0, match: 50, deadline: null, updatedAt: '2026-10-01',
  countries: [], fundingType: null, ...over,
});

describe('daysUntil', () => {
  it('counts calendar days, negative when past', () => {
    expect(daysUntil('2026-10-15T23:59:59', NOW)).toBe(7);
    expect(daysUntil('2026-10-08T01:00:00', NOW)).toBe(0);
    expect(daysUntil('2026-10-06T01:00:00', NOW)).toBe(-2);
  });
});

describe('toScholarshipItem', () => {
  it('builds the card: provider, progress from tasks, notes, urgent due date', () => {
    const it1 = toScholarshipItem(app(), profile, NOW);
    expect(it1).toMatchObject({ provider: 'DAAD', title: 'DAAD Study Scholarship', progress: 50, tasksDone: 2, tasksTotal: 4, notesCount: 2, href: '/scholarships/s1', dateUrgent: true });
    expect(it1.dateLabel).toBe('Due 15 Oct 2026 · 7d');
    expect(it1.match).toBeGreaterThan(0);
  });
  it('is not urgent when more than 7 days away and labels overdue', () => {
    expect(toScholarshipItem(app({ deadline: '2026-11-05T12:00:00' }), profile, NOW).dateUrgent).toBe(false);
    expect(toScholarshipItem(app({ deadline: '2026-10-06T12:00:00' }), profile, NOW).dateLabel).toContain('2d overdue');
  });
  it('shows a decision pill (no progress / tasks) in Decided', () => {
    const d = toScholarshipItem(app({ status: 'Decided', decision: 'Accepted' }), profile, NOW);
    expect(d).toMatchObject({ decision: 'Accepted', progress: null, tasksTotal: null });
    expect(d.dateLabel).toBe('Decided 1 Oct 2026');
  });
});

describe('toOutreachItem', () => {
  it('uses the university as provider and the stage for progress', () => {
    const rec: OutreachRecord = { id: 'o1', professorName: 'Dr. Ada', labName: 'HCI Lab', institution: 'KTH', status: 'Email Sent', notes: '', updatedAt: '2026-10-01' };
    expect(toOutreachItem(rec, [], profile, NOW)).toMatchObject({ provider: 'KTH', providerLabel: 'University', title: 'Dr. Ada · HCI Lab', progress: 40, match: null, href: null });
  });
});

describe('filterItems', () => {
  const items = [
    item('de', { countries: ['Germany'], fundingType: 'FULL', deadline: '2026-10-12' }),
    item('uk', { countries: ['United Kingdom'], fundingType: 'PARTIAL', deadline: '2026-12-01' }),
    item('none'),
  ];
  it('passes everything with default filters', () => {
    expect(filterItems(items, DEFAULT_FILTERS, NOW)).toHaveLength(3);
  });
  it('filters by country, funding and deadline window', () => {
    expect(filterItems(items, { ...DEFAULT_FILTERS, country: 'Germany' }, NOW).map((i) => i.id)).toEqual(['de']);
    expect(filterItems(items, { ...DEFAULT_FILTERS, funding: 'PARTIAL' }, NOW).map((i) => i.id)).toEqual(['uk']);
    expect(filterItems(items, { ...DEFAULT_FILTERS, deadline: '7' }, NOW).map((i) => i.id)).toEqual(['de']);
    expect(filterItems(items, { ...DEFAULT_FILTERS, deadline: '90' }, NOW).map((i) => i.id)).toEqual(['de', 'uk']);
  });
});

describe('sortItems', () => {
  const items = [
    item('a', { deadline: '2026-12-01', match: 60, updatedAt: '2026-10-05' }),
    item('b', { deadline: null, match: 90, updatedAt: '2026-10-07' }),
    item('c', { deadline: '2026-10-10', match: 75, updatedAt: '2026-09-01' }),
  ];
  const ids = (xs: PipelineItem[]) => xs.map((x) => x.id);
  it('keeps manual order', () => expect(ids(sortItems(items, 'manual'))).toEqual(['a', 'b', 'c']));
  it('sorts by deadline with missing last', () => expect(ids(sortItems(items, 'deadline'))).toEqual(['c', 'a', 'b']));
  it('sorts by match, highest first', () => expect(ids(sortItems(items, 'match'))).toEqual(['b', 'c', 'a']));
  it('sorts by recently updated', () => expect(ids(sortItems(items, 'updated'))).toEqual(['b', 'a', 'c']));
});

describe('board moves', () => {
  const items = [item('w1'), item('w2'), item('p1', { status: 'Preparing' })];
  const board = buildBoard(items, SCHOLARSHIP_COLUMNS, () => 'manual');

  it('groups ids by column', () => {
    expect(board).toMatchObject({ Wishlist: ['w1', 'w2'], Preparing: ['p1'], Submitted: [], Decided: [] });
    expect(findColumn(board, 'p1')).toBe('Preparing');
    expect(findColumn(board, 'Submitted')).toBe('Submitted');
  });

  it('moves a card to another column at an index or the end', () => {
    expect(moveCard(board, 'w1', 'Preparing', 0)).toMatchObject({ Wishlist: ['w2'], Preparing: ['w1', 'p1'] });
    expect(moveCard(board, 'w1', 'Preparing')).toMatchObject({ Preparing: ['p1', 'w1'] });
    expect(moveCard(board, 'w1', 'Nope')).toBe(board);
  });

  it('reports the status changes between boards', () => {
    expect(statusChanges(board, moveCard(board, 'w2', 'Decided'))).toEqual([{ id: 'w2', status: 'Decided' }]);
    expect(statusChanges(board, board)).toEqual([]);
  });

  it('merges a new visible order while hidden cards keep their slots', () => {
    const next = { Wishlist: ['w2', 'w1'], Preparing: ['p1'] };
    expect(mergeOrder(['w1', 'hidden', 'w2', 'p1'], next)).toEqual(['w2', 'hidden', 'w1', 'p1']);
  });
});

describe('scholarshipSummary', () => {
  it('counts active (not rejected), due within 7 days, and accepted', () => {
    const apps = [
      app({ id: '1' }),
      app({ id: '2', deadline: '2026-12-01' }),
      app({ id: '3', status: 'Decided', decision: 'Accepted' }),
      app({ id: '4', status: 'Decided', decision: 'Rejected' }),
      app({ id: '5', status: 'Submitted' }),
    ];
    expect(scholarshipSummary(apps, NOW)).toEqual({ active: 4, dueThisWeek: 1, accepted: 1 });
  });
});

describe('progressColor', () => {
  it('matches the Figma ring colours', () => {
    expect(progressColor(0)).toBe('#d0d5dd');
    expect(progressColor(25)).toBe('#f79009');
    expect(progressColor(60)).toBe('#2e90fa');
    expect(progressColor(100)).toBe('#12b76a');
  });
});
