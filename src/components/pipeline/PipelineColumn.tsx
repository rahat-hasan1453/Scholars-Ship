'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronsLeftRight, MoreVertical, Plus } from 'lucide-react';
import type { DecisionResult } from '@/types';
import { cn } from '@/lib/utils';
import type { PipelineColumn as Column, PipelineItem, PipelineSort } from '@/lib/pipeline';
import { SortablePipelineCard } from './PipelineCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

const ICON = { strokeWidth: 1.5 } as const;

export const SORT_LABELS: Record<PipelineSort, string> = {
  manual: 'Manual order',
  deadline: 'Deadline (soonest)',
  match: 'Match (highest)',
  updated: 'Recently updated',
};

interface PipelineColumnProps {
  column: Column;
  columns: Column[];
  items: PipelineItem[];
  /** True while a dragged card is over this column */
  highlighted: boolean;
  collapsed: boolean;
  sort: PipelineSort | null;
  onSort: (sort: PipelineSort | null) => void;
  onToggleCollapsed: () => void;
  onAdd: () => void;
  onOpen: (item: PipelineItem) => void;
  onMove: (item: PipelineItem, status: string) => void;
  onDecision?: (item: PipelineItem, decision: DecisionResult) => void;
  onRemove: (item: PipelineItem) => void;
}

const iconButton = 'flex size-6 -m-[3px] shrink-0 items-center justify-center rounded-[6px] text-[#344054] hover:bg-[#eef2f6] focus-visible:outline-2 focus-visible:outline-[#7150e7] cursor-pointer';

// One board column (Figma 316:5229): #f8fafc, r16, p8; header 60px; white cards; "Add new" at the bottom.
export function PipelineColumnView(props: PipelineColumnProps) {
  const { column, columns, items, highlighted, collapsed, sort, onSort, onToggleCollapsed, onAdd } = props;
  const { setNodeRef } = useDroppable({ id: `column:${column.id}`, data: { column: column.id } });
  const headingId = `pipeline-col-${column.id.replace(/\W+/g, '-').toLowerCase()}`;

  if (collapsed) {
    return (
      <section
        ref={setNodeRef}
        aria-labelledby={headingId}
        data-testid="pipeline-column"
        data-column={column.id}
        className={cn(
          'relative flex w-[52px] shrink-0 snap-start flex-col items-center gap-3 self-stretch rounded-[16px] bg-[#f8fafc] px-1 py-3 transition-colors',
          highlighted && 'bg-[#f4f2fd] ring-2 ring-[#7150e7]/40',
        )}
      >
        <button type="button" onClick={onToggleCollapsed} aria-label={`Expand ${column.label} column`} className={cn(iconButton, 'm-0')}>
          <ChevronsLeftRight {...ICON} className="size-[18px]" aria-hidden />
        </button>
        <span aria-hidden className="size-[10px] shrink-0 rounded-full" style={{ background: column.dot }} />
        <h2 id={headingId} className="text-[14px] leading-5 font-medium whitespace-nowrap text-[#101828] [writing-mode:vertical-rl]">
          {column.label}
        </h2>
        <span className="rounded-[6px] bg-[#eef2f6] px-[5px] text-[13px] leading-5 font-medium text-[#344054]">{items.length}</span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-testid="pipeline-column"
      data-column={column.id}
      className={cn(
        'relative flex min-w-[260px] flex-1 snap-start flex-col items-start gap-2 rounded-[16px] bg-[#f8fafc] p-2 transition-colors lg:min-w-[220px]',
        highlighted && 'bg-[#f4f2fd] ring-2 ring-[#7150e7]/40',
      )}
    >
      <div className="flex h-[60px] w-full items-center gap-2 px-2 py-[6px]">
        <span aria-hidden className="size-[10px] shrink-0 rounded-full" style={{ background: column.dot }} />
        <h2 id={headingId} className="truncate text-[16px] leading-[22px] font-medium text-[#101828]">
          {column.label}
        </h2>
        <span className="shrink-0 rounded-[6px] bg-[#eef2f6] px-[7px] text-[13px] leading-5 font-medium text-[#344054]">
          <span className="sr-only">Cards: </span>
          {items.length}
        </span>
        <span className="flex-1" />
        <button type="button" onClick={onAdd} aria-label={`Add to ${column.label}`} className={iconButton}>
          <Plus {...ICON} className="size-[18px]" aria-hidden />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`${column.label} column options`} className={iconButton}>
            <MoreVertical {...ICON} className="size-[18px]" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="px-2 pt-1 pb-0.5 text-[12px] leading-4 font-medium text-[#627181]">Sort this column</DropdownMenuLabel>
            <DropdownMenuRadioGroup aria-label="Sort this column" value={sort ?? 'board'} onValueChange={(v) => onSort(v === 'board' ? null : (v as PipelineSort))}>
              <DropdownMenuRadioItem value="board">Same as board</DropdownMenuRadioItem>
              {(Object.keys(SORT_LABELS) as PipelineSort[]).map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {SORT_LABELS[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onToggleCollapsed}>Collapse column</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SortableContext id={column.id} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul aria-labelledby={headingId} className="flex w-full flex-col gap-2">
          {items.map((item) => (
            <SortablePipelineCard
              key={item.id}
              item={item}
              columns={columns}
              onOpen={props.onOpen}
              onMove={props.onMove}
              onDecision={props.onDecision}
              onRemove={props.onRemove}
            />
          ))}
        </ul>
      </SortableContext>

      {items.length === 0 && (
        <div
          className={cn(
            'flex h-[88px] w-full items-center justify-center rounded-[12px] border border-dashed border-[#d0d5dd] text-[13px] leading-[18px] text-[#627181]',
            highlighted && 'border-[#7150e7] text-[#5b3fd1]',
          )}
        >
          Drop a card here
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center gap-2 rounded-[8px] p-[10px] text-[14px] leading-5 font-medium text-[#627181] hover:bg-[#eef2f6] focus-visible:outline-2 focus-visible:outline-[#7150e7] cursor-pointer"
      >
        <Plus {...ICON} className="size-4" aria-hidden />
        Add new
        <span className="sr-only"> to {column.label}</span>
      </button>
    </section>
  );
}
