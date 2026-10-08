// Pure logic for the Pipeline (Kanban) page: columns, card view-models, filter / sort and drag-and-drop moves.
// No React here, so everything is unit-tested in tests/unit/pipeline.test.ts.
import type {
  Application,
  ApplicationStatus,
  DecisionResult,
  FundingType,
  OutreachRecord,
  OutreachStatus,
  Professor,
  UserProfile,
} from '@/types';
import { calculateMatchScore } from '@/lib/utils';
import { matchScore } from '@/lib/professorDetails';

export type PipelineMode = 'scholarships' | 'outreach';
export type PipelineSort = 'manual' | 'deadline' | 'match' | 'updated';
export type DeadlineWindow = 'any' | '7' | '30' | '90';

export interface PipelineFilters {
  country: string; // 'ALL' or a country name
  funding: 'ALL' | FundingType;
  deadline: DeadlineWindow;
}

export const DEFAULT_FILTERS: PipelineFilters = { country: 'ALL', funding: 'ALL', deadline: 'any' };

export interface PipelineColumn {
  id: string;
  label: string;
  /** Status dot colour (Figma 316:5231 etc.) */
  dot: string;
}

// Figma 316:5228 column dots: Wishlist grey, Preparing orange, Submitted brand, Under Review blue, Decided green
export const SCHOLARSHIP_COLUMNS: PipelineColumn[] = [
  { id: 'Wishlist', label: 'Wishlist', dot: '#98a2b3' },
  { id: 'Preparing', label: 'Preparing', dot: '#f79009' },
  { id: 'Submitted', label: 'Submitted', dot: '#7150e7' },
  { id: 'Under Review', label: 'Under Review', dot: '#2e90fa' },
  { id: 'Decided', label: 'Decided', dot: '#12b76a' },
];

export const OUTREACH_COLUMNS: PipelineColumn[] = [
  { id: 'Prospect', label: 'Prospect', dot: '#98a2b3' },
  { id: 'Drafting', label: 'Drafting', dot: '#f79009' },
  { id: 'Email Sent', label: 'Email Sent', dot: '#7150e7' },
  { id: 'Follow-up Due', label: 'Follow-up Due', dot: '#f04438' },
  { id: 'Interview', label: 'Interview', dot: '#2e90fa' },
  { id: 'Funded Offer', label: 'Funded Offer', dot: '#12b76a' },
];

export const columnsFor = (mode: PipelineMode) => (mode === 'scholarships' ? SCHOLARSHIP_COLUMNS : OUTREACH_COLUMNS);

/** Everything a card needs, for both scholarship applications and professor outreach */
export interface PipelineItem {
  id: string;
  mode: PipelineMode;
  status: string;
  providerLabel: string;
  provider: string;
  title: string;
  href: string | null;
  /** 0-100, or null when the card shows a decision pill instead */
  progress: number | null;
  decision: DecisionResult | null;
  dateLabel: string;
  dateUrgent: boolean;
  notesCount: number;
  tasksDone: number | null;
  tasksTotal: number | null;
  match: number | null;
  /** ISO date used by the deadline filter / sort */
  deadline: string | null;
  updatedAt: string;
  countries: string[];
  fundingType: FundingType | null;
}

const DAY = 86_400_000;

/** Whole calendar days from `now` to `iso` (negative when past) */
export function daysUntil(iso: string, now: Date): number {
  const d = new Date(iso);
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / DAY);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "15 Oct 2026" (fixed English months: browsers disagree on "Sep" vs "Sept") */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const URGENT_DAYS = 7;

function dueLabel(prefix: string, iso: string, now: Date) {
  const days = daysUntil(iso, now);
  const tail = days < 0 ? `${-days}d overdue` : `${days}d`;
  return { dateLabel: `${prefix} ${formatDay(iso)} · ${tail}`, dateUrgent: days <= URGENT_DAYS };
}

export const countNotes = (notes: string | undefined) => (notes ?? '').split('\n').filter((l) => l.trim()).length;

export function toScholarshipItem(app: Application, profile: UserProfile, now: Date): PipelineItem {
  const s = app.scholarship;
  const done = app.tasks.filter((t) => t.isCompleted).length;
  const total = app.tasks.length;
  const deadline = app.deadline || s.deadline;
  let date: { dateLabel: string; dateUrgent: boolean };
  switch (app.status) {
    case 'Submitted':
      date = { dateLabel: `Submitted ${formatDay(app.updatedAt)}`, dateUrgent: false };
      break;
    case 'Under Review':
      date = { dateLabel: `In review since ${formatDay(app.updatedAt)}`, dateUrgent: false };
      break;
    case 'Decided':
      date = { dateLabel: `Decided ${formatDay(app.updatedAt)}`, dateUrgent: false };
      break;
    default:
      date = dueLabel('Due', deadline, now);
  }
  const decided = app.status === 'Decided';
  return {
    id: app.id,
    mode: 'scholarships',
    status: app.status,
    providerLabel: 'Provider',
    provider: s.provider,
    title: s.title,
    href: `/scholarships/${s.id}`,
    progress: decided ? null : total ? Math.round((done / total) * 100) : 0,
    decision: decided ? app.decision : null,
    ...date,
    notesCount: countNotes(app.notes),
    tasksDone: decided ? null : done,
    tasksTotal: decided ? null : total,
    match: calculateMatchScore(s, profile),
    deadline,
    updatedAt: app.updatedAt,
    countries: s.countries ?? [],
    fundingType: s.fundingType ?? null,
  };
}

export function toOutreachItem(rec: OutreachRecord, professors: Professor[], profile: UserProfile, now: Date): PipelineItem {
  const prof = rec.professorId ? professors.find((p) => p.id === rec.professorId) : undefined;
  const cols = OUTREACH_COLUMNS.map((c) => c.id);
  const stage = Math.max(0, cols.indexOf(rec.status));
  let date: { dateLabel: string; dateUrgent: boolean };
  if (rec.nextFollowUpDate) date = dueLabel('Follow up', rec.nextFollowUpDate, now);
  else if (rec.lastContactDate) date = { dateLabel: `Contacted ${formatDay(rec.lastContactDate)}`, dateUrgent: false };
  else date = { dateLabel: `Added ${formatDay(rec.updatedAt)}`, dateUrgent: false };
  return {
    id: rec.id,
    mode: 'outreach',
    status: rec.status,
    providerLabel: 'University',
    provider: rec.institution,
    title: rec.labName ? `${rec.professorName} · ${rec.labName}` : rec.professorName,
    href: rec.professorId ? `/professors/${rec.professorId}` : rec.opportunityId ? `/opportunities/${rec.opportunityId}` : null,
    progress: Math.round((stage / (cols.length - 1)) * 100),
    decision: null,
    ...date,
    notesCount: countNotes(rec.notes),
    tasksDone: null,
    tasksTotal: null,
    match: prof ? matchScore(prof, profile) : null,
    deadline: rec.nextFollowUpDate ?? null,
    updatedAt: rec.updatedAt,
    countries: rec.country ? [rec.country] : prof ? [prof.country] : [],
    fundingType: prof?.fundingType ?? null,
  };
}

export function filterItems(items: PipelineItem[], f: PipelineFilters, now: Date): PipelineItem[] {
  return items.filter((it) => {
    if (f.country !== 'ALL' && !it.countries.includes(f.country)) return false;
    if (f.funding !== 'ALL' && it.fundingType !== f.funding) return false;
    if (f.deadline !== 'any') {
      if (!it.deadline) return false;
      const d = daysUntil(it.deadline, now);
      if (d < 0 || d > Number(f.deadline)) return false;
    }
    return true;
  });
}

export const activeFilterCount = (f: PipelineFilters) =>
  (f.country !== 'ALL' ? 1 : 0) + (f.funding !== 'ALL' ? 1 : 0) + (f.deadline !== 'any' ? 1 : 0);

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);

/** Stable sort; 'manual' keeps the saved order */
export function sortItems(items: PipelineItem[], sort: PipelineSort): PipelineItem[] {
  if (sort === 'manual') return items;
  const copy = [...items];
  if (sort === 'deadline') copy.sort((a, b) => time(a.deadline) - time(b.deadline));
  if (sort === 'match') copy.sort((a, b) => (b.match ?? -1) - (a.match ?? -1));
  if (sort === 'updated') copy.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
  return copy;
}

export type Board = Record<string, string[]>;

/** Ids per column, in display order */
export function buildBoard(items: PipelineItem[], columns: PipelineColumn[], sortFor: (col: string) => PipelineSort): Board {
  const board: Board = {};
  for (const c of columns) board[c.id] = sortItems(items.filter((i) => i.status === c.id), sortFor(c.id)).map((i) => i.id);
  return board;
}

export function findColumn(board: Board, id: string): string | undefined {
  if (id in board) return id;
  return Object.keys(board).find((col) => board[col].includes(id));
}

/** Move a card to `toColumn` at `toIndex` (clamped; end when omitted). Returns a new board. */
export function moveCard(board: Board, id: string, toColumn: string, toIndex?: number): Board {
  const from = findColumn(board, id);
  if (!from || !(toColumn in board)) return board;
  const next: Board = { ...board, [from]: board[from].filter((x) => x !== id) };
  const target = [...next[toColumn]];
  const index = toIndex === undefined ? target.length : Math.max(0, Math.min(toIndex, target.length));
  target.splice(index, 0, id);
  next[toColumn] = target;
  return next;
}

/** Status changes between two boards: id → new column */
export function statusChanges(before: Board, after: Board): { id: string; status: string }[] {
  const changes: { id: string; status: string }[] = [];
  for (const col of Object.keys(after)) {
    for (const id of after[col]) if (findColumn(before, id) !== col) changes.push({ id, status: col });
  }
  return changes;
}

/**
 * New full order after a drag: visible cards take the order of the board (column by column),
 * cards hidden by a filter keep their slots.
 */
export function mergeOrder(allIds: string[], board: Board): string[] {
  const visible = Object.values(board).flat();
  const visibleSet = new Set(visible);
  const queue = [...visible];
  const result = allIds.map((id) => (visibleSet.has(id) ? queue.shift()! : id));
  return [...result, ...queue.filter((id) => !result.includes(id))];
}

export interface PipelineSummary {
  active: number;
  dueThisWeek: number;
  accepted: number;
}

export function scholarshipSummary(apps: Application[], now: Date): PipelineSummary {
  const live = apps.filter((a) => !(a.status === 'Decided' && a.decision === 'Rejected'));
  const open = (s: ApplicationStatus) => s === 'Wishlist' || s === 'Preparing';
  return {
    active: live.length,
    dueThisWeek: apps.filter((a) => {
      if (!open(a.status)) return false;
      const d = daysUntil(a.deadline || a.scholarship.deadline, now);
      return d >= 0 && d <= URGENT_DAYS;
    }).length,
    accepted: apps.filter((a) => a.status === 'Decided' && a.decision === 'Accepted').length,
  };
}

export function outreachSummary(records: OutreachRecord[], now: Date): PipelineSummary {
  return {
    active: records.length,
    dueThisWeek: records.filter((r) => {
      if (!r.nextFollowUpDate) return false;
      const d = daysUntil(r.nextFollowUpDate, now);
      return d >= 0 && d <= URGENT_DAYS;
    }).length,
    accepted: records.filter((r) => r.status === ('Funded Offer' satisfies OutreachStatus)).length,
  };
}

/** Progress ring colour (Figma 316:5248): grey track at 0, orange below 50, blue below 100, green when done */
export function progressColor(pct: number): string {
  if (pct >= 100) return '#12b76a';
  if (pct >= 50) return '#2e90fa';
  if (pct > 0) return '#f79009';
  return '#d0d5dd';
}
