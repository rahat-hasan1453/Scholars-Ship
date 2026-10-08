'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowUpDown, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useSessionState } from '@/hooks/useSessionState';
import type { ApplicationStatus, DecisionResult, OutreachStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  activeFilterCount,
  buildBoard,
  columnsFor,
  DEFAULT_FILTERS,
  filterItems,
  findColumn,
  mergeOrder,
  moveCard,
  outreachSummary,
  scholarshipSummary,
  statusChanges,
  toOutreachItem,
  toScholarshipItem,
  type Board,
  type PipelineFilters,
  type PipelineItem,
  type PipelineMode,
  type PipelineSort,
} from '@/lib/pipeline';
import { SegmentedToggle } from '@/components/feed/SegmentedToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { PipelineColumnView, SORT_LABELS } from './PipelineColumn';
import { cardShell, PipelineCardBody } from './PipelineCard';
import { AddApplicationDialog } from './AddApplicationDialog';

const ICON = { strokeWidth: 1.5 } as const;
const COLUMN_PREFIX = 'column:';
const colOf = (id: UniqueIdentifier) => (String(id).startsWith(COLUMN_PREFIX) ? String(id).slice(COLUMN_PREFIX.length) : null);

const FUNDING_LABELS: Record<string, string> = {
  FULL: 'Fully funded',
  PARTIAL: 'Partial funding',
  TUITION_WAIVER: 'Tuition waiver',
  RESEARCH_ASSISTANTSHIP: 'Research assistantship',
};

const neutralButton =
  'flex items-center gap-[6px] rounded-[10px] bg-[#f8fafc] px-3 py-[6px] text-[14px] leading-5 font-medium text-[#344054] hover:bg-[#eef2f6] focus-visible:outline-2 focus-visible:outline-[#7150e7] cursor-pointer data-[state=open]:bg-[#eef2f6]';

const selectCls =
  'h-9 w-full rounded-[8px] border border-[#d0d5dd] bg-white px-2 text-[14px] font-normal text-[#101828] focus-visible:outline-2 focus-visible:outline-[#7150e7]';

// Pipeline page (Figma 315:5151): scholarship applications or professor outreach as a drag-and-drop Kanban board.
export function PipelineBoard() {
  const router = useRouter();
  const {
    profile,
    professors,
    applications,
    outreachRecords,
    updateApplicationStatus,
    updateOutreachStatus,
    removeApplication,
    removeOutreachRecord,
    reorderApplications,
    reorderOutreachRecords,
  } = useApp();

  const [mode, setMode] = useSessionState<PipelineMode>('pipeline:mode', 'scholarships');
  const [filters, setFilters] = useSessionState<PipelineFilters>('pipeline:filters', DEFAULT_FILTERS);
  const [sort, setSort] = useSessionState<PipelineSort>('pipeline:sort', 'manual');
  const [columnSort, setColumnSort] = useSessionState<Record<string, PipelineSort>>('pipeline:columnSort', {});
  const [collapsed, setCollapsed] = useSessionState<string[]>('pipeline:collapsed', []);
  const [addTo, setAddTo] = useState<string | null>(null);

  // One "now" per render pass keeps every countdown on the board consistent
  const now = useMemo(() => new Date(), [applications, outreachRecords]); // eslint-disable-line react-hooks/exhaustive-deps
  const columns = columnsFor(mode);

  const allItems = useMemo<PipelineItem[]>(
    () =>
      mode === 'scholarships'
        ? applications.map((a) => toScholarshipItem(a, profile, now))
        : outreachRecords.map((r) => toOutreachItem(r, professors, profile, now)),
    [mode, applications, outreachRecords, professors, profile, now],
  );
  const itemsById = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);
  const visible = useMemo(() => filterItems(allItems, filters, now), [allItems, filters, now]);
  const sortFor = (col: string): PipelineSort => columnSort[`${mode}:${col}`] ?? sort;
  const computedBoard = useMemo(() => buildBoard(visible, columns, sortFor), [visible, columns, sort, columnSort, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = mode === 'scholarships' ? scholarshipSummary(applications, now) : outreachSummary(outreachRecords, now);

  // ---- drag and drop ----
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragBoard, setDragBoard] = useState<Board | null>(null);
  const [startBoard, setStartBoard] = useState<Board | null>(null);
  const board = dragBoard ?? computedBoard;
  const overColumn = activeId ? findColumn(board, activeId) : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Pointer first (precise), then rectangles; a hit on a non-empty column is narrowed to its closest card
  const collision: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    const hits = pointer.length ? pointer : rectIntersection(args);
    const first = hits[0];
    if (!first) return closestCorners(args);
    const col = colOf(first.id);
    if (col && board[col]?.length) {
      const inCol = closestCorners({ ...args, droppableContainers: args.droppableContainers.filter((c) => board[col].includes(String(c.id))) });
      if (inCol.length) return inCol;
    }
    return [first];
  };

  const columnLabel = (id: string | undefined) => columns.find((c) => c.id === id)?.label ?? id ?? '';
  const titleOf = (id: UniqueIdentifier) => itemsById.get(String(id))?.title ?? 'card';
  const position = (id: UniqueIdentifier, b: Board) => {
    const col = findColumn(b, String(id));
    return col ? `${columnLabel(col)}, position ${b[col].indexOf(String(id)) + 1} of ${b[col].length}` : '';
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)} in ${position(active.id, board)}.`,
    onDragOver: ({ active, over }) => (over ? `${titleOf(active.id)} is over ${position(active.id, board)}.` : `${titleOf(active.id)} is not over a column.`),
    onDragEnd: ({ active, over }) => (over ? `Dropped ${titleOf(active.id)} in ${position(active.id, board)}.` : `${titleOf(active.id)} was dropped back where it started.`),
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled. It is back in ${columnLabel(startBoard ? findColumn(startBoard, String(active.id)) : undefined)}.`,
  };

  const screenReaderInstructions = {
    draggable:
      'To move this card, press Space. Use the arrow keys to move it within a column or to the next column, then press Space again to drop it, or Escape to cancel. Press Enter to open details.',
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDragBoard(computedBoard);
    setStartBoard(computedBoard);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const id = String(active.id);
    setDragBoard((prev) => {
      if (!prev) return prev;
      const from = findColumn(prev, id);
      const to = colOf(over.id) ?? findColumn(prev, String(over.id));
      if (!from || !to || from === to) return prev;
      const overIndex = colOf(over.id) ? undefined : prev[to].indexOf(String(over.id));
      return moveCard(prev, id, to, overIndex);
    });
  };

  const finish = () => {
    setActiveId(null);
    setDragBoard(null);
    setStartBoard(null);
  };

  const commit = (before: Board, after: Board) => {
    for (const { id, status } of statusChanges(before, after)) setStatus(id, status);
    const ids = (mode === 'scholarships' ? applications : outreachRecords).map((x) => x.id);
    const order = mergeOrder(ids, after);
    if (order.join() !== ids.join()) (mode === 'scholarships' ? reorderApplications : reorderOutreachRecords)(order);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!dragBoard || !startBoard) return finish();
    let next = dragBoard;
    const id = String(active.id);
    const col = findColumn(next, id);
    if (over && col && !colOf(over.id) && next[col].includes(String(over.id))) {
      const from = next[col].indexOf(id);
      const to = next[col].indexOf(String(over.id));
      if (from !== to) next = { ...next, [col]: arrayMove(next[col], from, to) };
    }
    if (over) commit(startBoard, next);
    finish();
  };

  // ---- card actions ----
  const setStatus = (id: string, status: string, decision?: DecisionResult) => {
    if (mode === 'scholarships') updateApplicationStatus(id, status as ApplicationStatus, decision);
    else updateOutreachStatus(id, status as OutreachStatus);
  };
  const openItem = (item: PipelineItem) => item.href && router.push(item.href);
  const moveItem = (item: PipelineItem, status: string) => setStatus(item.id, status);
  const removeItem = (item: PipelineItem) => (mode === 'scholarships' ? removeApplication(item.id) : removeOutreachRecord(item.id));
  const markDecision = (item: PipelineItem, decision: DecisionResult) => updateApplicationStatus(item.id, 'Decided', decision);

  // ---- filter options ----
  const countryOptions = useMemo(() => [...new Set(allItems.flatMap((i) => i.countries))].sort(), [allItems]);
  const filterCount = activeFilterCount(filters);
  const activeItem = activeId ? itemsById.get(activeId) : undefined;

  const summaryStats = [
    { label: 'Active', value: summary.active, color: '#101828' },
    { label: mode === 'scholarships' ? 'Due this week' : 'Follow-ups this week', value: summary.dueThisWeek, color: '#b42318' },
    { label: mode === 'scholarships' ? 'Accepted' : 'Funded offers', value: summary.accepted, color: '#1b806a' },
  ];

  return (
    <div className="flex w-full flex-col gap-6 rounded-[16px] bg-white px-4 py-5 sm:px-8 sm:py-6">
      {/* Header (Figma 315:5250) */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1">
          <h1 className="text-[24px] leading-8 font-[590] text-[#101828]">Pipeline</h1>
          <p className="text-[14px] leading-5 text-[#627181]">
            {mode === 'scholarships'
              ? 'Track every application from wishlist to decision. Drag a card to move it.'
              : 'Track every professor you reach out to, from prospect to funded offer. Drag a card to move it.'}
          </p>
        </div>
        <dl className="flex items-start gap-6" aria-label="Pipeline summary">
          {summaryStats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-end">
              <dt className="text-[12px] leading-4 text-[#627181]">{s.label}</dt>
              <dd className="text-[20px] leading-7 font-[590]" style={{ color: s.color }} data-testid={`summary-${s.label}`}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Toolbar (Figma 315:5264) */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#e4e7ec] pb-5 lg:min-h-[120px]">
        <SegmentedToggle
          label="Pipeline type"
          value={mode}
          onValueChange={(m) => {
            finish();
            setMode(m);
          }}
          segmentClassName="gap-[6px] px-3 font-sans font-medium"
          options={[
            { value: 'scholarships', label: 'Scholarships', count: applications.length },
            { value: 'outreach', label: 'Professor Outreach', count: outreachRecords.length },
          ]}
        />

        <Popover>
          <PopoverTrigger className={neutralButton}>
            <Plus {...ICON} className="size-4" aria-hidden />
            Filter
            {filterCount > 0 && <span className="rounded-[6px] bg-[#ede9fc] px-[6px] text-[12px] leading-[18px] text-[#5b3fd1]">{filterCount}</span>}
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-72 flex-col gap-3 rounded-[12px] p-4">
            <p className="text-[14px] leading-5 font-medium text-[#101828]">Filter cards</p>
            <label className="flex flex-col gap-1 text-[12px] leading-4 font-medium text-[#344054]">
              Country
              <select className={selectCls} value={filters.country} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}>
                <option value="ALL">All countries</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[12px] leading-4 font-medium text-[#344054]">
              Funding type
              <select className={selectCls} value={filters.funding} onChange={(e) => setFilters((f) => ({ ...f, funding: e.target.value as PipelineFilters['funding'] }))}>
                <option value="ALL">Any funding</option>
                {Object.entries(FUNDING_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[12px] leading-4 font-medium text-[#344054]">
              {mode === 'scholarships' ? 'Deadline' : 'Follow-up date'}
              <select className={selectCls} value={filters.deadline} onChange={(e) => setFilters((f) => ({ ...f, deadline: e.target.value as PipelineFilters['deadline'] }))}>
                <option value="any">Any time</option>
                <option value="7">Next 7 days</option>
                <option value="30">Next 30 days</option>
                <option value="90">Next 90 days</option>
              </select>
            </label>
            <button
              type="button"
              disabled={filterCount === 0}
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="self-start rounded-[8px] px-2 py-1 text-[13px] leading-[18px] font-medium text-[#5b3fd1] hover:bg-[#f4f2fd] disabled:text-[#627181] disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              Clear filters
            </button>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className={neutralButton}>
            <ArrowUpDown {...ICON} className="size-4" aria-hidden />
            Sort
            {sort !== 'manual' && <span className="sr-only">: {SORT_LABELS[sort]}</span>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as PipelineSort)}>
              {(Object.keys(SORT_LABELS) as PipelineSort[]).map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {SORT_LABELS[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="hidden flex-1 sm:block" />

        <button
          type="button"
          onClick={() => setAddTo(columns[0].id)}
          className="flex items-center gap-[6px] rounded-[8px] bg-[#7150e7] px-4 py-2 text-[14px] leading-5 font-medium text-white hover:bg-[#5f3fdc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7150e7] cursor-pointer"
        >
          <Plus {...ICON} className="size-4" aria-hidden />
          {mode === 'scholarships' ? 'Add application' : 'Add professor'}
        </button>
      </div>

      {/* Board (Figma 316:5228) */}
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={finish}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        <div
          data-testid="pipeline-board"
          className="relative -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:snap-none lg:px-0"
        >
          {columns.map((c) => {
            const key = `${mode}:${c.id}`;
            return (
              <PipelineColumnView
                key={key}
                column={c}
                columns={columns}
                items={(board[c.id] ?? []).map((id) => itemsById.get(id)).filter((x): x is PipelineItem => !!x)}
                highlighted={!!activeId && overColumn === c.id}
                collapsed={collapsed.includes(key)}
                sort={columnSort[key] ?? null}
                onSort={(s) =>
                  setColumnSort((prev) => {
                    const next = { ...prev };
                    if (s) next[key] = s;
                    else delete next[key];
                    return next;
                  })
                }
                onToggleCollapsed={() => setCollapsed((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))}
                onAdd={() => setAddTo(c.id)}
                onOpen={openItem}
                onMove={moveItem}
                onDecision={mode === 'scholarships' ? markDecision : undefined}
                onRemove={removeItem}
              />
            );
          })}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {activeItem ? (
            <div className={cn(cardShell, 'w-[258px] rotate-[1.5deg] cursor-grabbing shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]')}>
              <PipelineCardBody item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddApplicationDialog mode={mode} status={addTo} onClose={() => setAddTo(null)} />
    </div>
  );
}
