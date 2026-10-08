'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Clock, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { DecisionResult } from '@/types';
import { cn } from '@/lib/utils';
import { progressColor, type PipelineColumn, type PipelineItem } from '@/lib/pipeline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

const ICON = { strokeWidth: 1.5 } as const;
const menuLabel = 'px-2 pt-1 pb-0.5 text-[12px] leading-4 font-medium text-[#627181]';

/** 14px progress ring (Figma 316:5248) */
function ProgressRing({ pct }: { pct: number }) {
  const r = 5.5;
  const c = 2 * Math.PI * r;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="-rotate-90 shrink-0">
      <circle cx="7" cy="7" r={r} fill="none" stroke="#eaecf0" strokeWidth="2" />
      {pct > 0 && (
        <circle cx="7" cy="7" r={r} fill="none" stroke={progressColor(pct)} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${(c * Math.min(pct, 100)) / 100} ${c}`} />
      )}
    </svg>
  );
}

const DECISION_PILL: Record<DecisionResult, { label: string; cls: string }> = {
  Accepted: { label: 'Accepted', cls: 'bg-[#ebfdef] text-[#1b806a]' },
  Waitlisted: { label: 'Waitlisted', cls: 'bg-[#fff7e6] text-[#7a4100]' },
  Rejected: { label: 'Rejected', cls: 'bg-[#fef3f2] text-[#b42318]' },
  Pending: { label: 'Awaiting decision', cls: 'bg-[#eef2f6] text-[#344054]' },
};

const pill = 'shrink-0 rounded-[999px] px-[8px] py-px text-[12px] leading-[18px] font-medium italic whitespace-nowrap';

/** The card's visual body (Figma 316:5242). Used in the column and in the drag overlay. */
export function PipelineCardBody({ item }: { item: PipelineItem }) {
  return (
    <>
      <div className="flex w-full gap-1 border-b border-[#f1f1f1] pb-[10px] pr-6 text-[12px] leading-4 whitespace-nowrap">
        <span className="shrink-0 text-[#627181]">{item.providerLabel}:</span>
        <span className="min-w-0 flex-1 truncate font-medium text-[#344054]">{item.provider}</span>
      </div>
      <p className="w-full truncate text-[16px] leading-[22px] font-medium text-[#101828]">{item.title}</p>
      {item.decision ? (
        <span className={cn(pill, DECISION_PILL[item.decision].cls)}>{DECISION_PILL[item.decision].label}</span>
      ) : item.progress !== null ? (
        <div className="flex items-center gap-[6px]">
          <ProgressRing pct={item.progress} />
          <span className="text-[14px] leading-5 text-[#344054]">{item.progress}%</span>
        </div>
      ) : null}
      <div className={cn('flex items-center gap-[6px] text-[14px] leading-5', item.dateUrgent ? 'font-medium text-[#b42318]' : 'text-[#344054]')}>
        <Clock {...ICON} className="size-[15px] shrink-0" aria-hidden />
        <span className="truncate">{item.dateLabel}</span>
      </div>
      <div className="flex w-full items-center gap-3 pt-[2px] text-[13px] leading-[18px] text-[#627181]">
        <span className="flex items-center gap-1" title="Notes">
          <MessageCircle {...ICON} className="size-[15px]" aria-hidden />
          <span className="sr-only">Notes: </span>
          {item.notesCount}
        </span>
        {item.tasksTotal !== null && (
          <span className="flex items-center gap-1" title="Tasks done">
            <CheckSquare {...ICON} className="size-[15px]" aria-hidden />
            <span className="sr-only">Tasks done: </span>
            {item.tasksDone}/{item.tasksTotal}
          </span>
        )}
        <span className="flex-1" />
        {item.match !== null && (
          <span className={cn(pill, item.match >= 80 ? 'bg-[#ebfdef] text-[#1b806a]' : 'bg-[#f4f2fd] text-[#5b3fd1]')}>{item.match}% Match</span>
        )}
      </div>
    </>
  );
}

export const cardShell = 'relative flex w-full flex-col items-start gap-[10px] rounded-[12px] bg-white px-[14px] py-[12px] shadow-[0px_1px_2px_0px_rgba(15,23,41,0.04)]';

interface SortableCardProps {
  item: PipelineItem;
  columns: PipelineColumn[];
  onOpen: (item: PipelineItem) => void;
  onMove: (item: PipelineItem, status: string) => void;
  onDecision?: (item: PipelineItem, decision: DecisionResult) => void;
  onRemove: (item: PipelineItem) => void;
}

export function SortablePipelineCard({ item, columns, onOpen, onMove, onDecision, onRemove }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className={cn(cardShell, 'group list-none', isDragging && 'opacity-40')} data-testid="pipeline-card" data-card-id={item.id}>
      {/* The card body is the drag handle (Space / Enter-free drag via dnd-kit) and opens details on click or Enter */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`${item.title}, ${item.providerLabel} ${item.provider}`}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onOpen(item);
            return;
          }
          listeners?.onKeyDown?.(e);
        }}
        className="flex w-full cursor-grab touch-manipulation flex-col items-start gap-[10px] rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[#7150e7] focus-visible:ring-offset-4 active:cursor-grabbing"
      >
        <PipelineCardBody item={item} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${item.title}`}
          className="absolute top-[8px] right-[8px] flex size-6 items-center justify-center rounded-[6px] text-[#627181] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#f2f4f7] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#7150e7] data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100 cursor-pointer"
        >
          <MoreHorizontal {...ICON} className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {item.href && <DropdownMenuItem onSelect={() => onOpen(item)}>Open details</DropdownMenuItem>}
          {/* Flat groups instead of submenus: they also fit on phones */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={menuLabel}>Move to…</DropdownMenuLabel>
          <DropdownMenuRadioGroup aria-label="Move to" value={item.status} onValueChange={(v) => v !== item.status && onMove(item, v)}>
            {columns.map((c) => (
              <DropdownMenuRadioItem key={c.id} value={c.id}>
                {c.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {onDecision && item.decision !== null && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className={menuLabel}>Mark decision</DropdownMenuLabel>
              <DropdownMenuRadioGroup aria-label="Mark decision" value={item.decision} onValueChange={(v) => onDecision(item, v as DecisionResult)}>
                {(['Accepted', 'Waitlisted', 'Rejected', 'Pending'] as DecisionResult[]).map((d) => (
                  <DropdownMenuRadioItem key={d} value={d}>
                    {d === 'Pending' ? 'Awaiting decision' : d}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onRemove(item)} className="text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]">
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
