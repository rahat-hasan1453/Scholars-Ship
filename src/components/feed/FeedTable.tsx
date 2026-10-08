'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { cn } from '@/lib/utils';

/*
 * List view shared by all four feeds (shadcn Table).
 * - Click a sortable header to sort (click again to flip the direction).
 * - Click a row (or press Enter on it) to open its details; buttons and links inside a row work on their own.
 * - Optional `groupBy` splits rows into collapsible sections, e.g. Closing soon / Open / Closed.
 */

export type FeedColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Makes the column sortable */
  sortValue?: (row: T) => number | string;
  className?: string;
  /** Hidden below this breakpoint to keep the table readable on small screens */
  hideBelow?: 'md' | 'lg' | 'xl';
};

export type FeedGroup = { id: string; label: string; order: number; tone?: 'danger' | 'success' | 'muted' };

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

const HIDE: Record<NonNullable<FeedColumn<unknown>['hideBelow']>, string> = {
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

const GROUP_DOT: Record<NonNullable<FeedGroup['tone']>, string> = {
  danger: 'bg-[#d92d20]',
  success: 'bg-[#1b806a]',
  muted: 'bg-[#98a2b3]',
};

export function FeedTable<T>({
  rows,
  columns,
  getKey,
  getRowLabel,
  onOpen,
  getHref,
  groupBy,
  defaultSort = null,
  caption,
}: {
  rows: T[];
  columns: FeedColumn<T>[];
  getKey: (row: T) => string;
  /** Accessible name of the row, e.g. its title */
  getRowLabel: (row: T) => string;
  /** Opens the row (details page or modal); `getHref` is a shortcut for navigation */
  onOpen?: (row: T) => void;
  getHref?: (row: T) => string;
  groupBy?: (row: T) => FeedGroup;
  defaultSort?: SortState;
  caption: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const val = col.sortValue;
    const dir = sort!.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [rows, columns, sort]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ group: null as FeedGroup | null, items: sorted }];
    const map = new Map<string, { group: FeedGroup; items: T[] }>();
    for (const r of sorted) {
      const g = groupBy(r);
      if (!map.has(g.id)) map.set(g.id, { group: g, items: [] });
      map.get(g.id)!.items.push(r);
    }
    return [...map.values()].sort((a, b) => a.group.order - b.group.order);
  }, [sorted, groupBy]);

  const open = (row: T) => (onOpen ? onOpen(row) : getHref && router.push(getHref(row)));
  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  const toggleGroup = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Clicks on links/buttons inside a row should not also open the row
  const fromControl = (e: React.SyntheticEvent) => !!(e.target as HTMLElement).closest('a,button,input,[role="button"]');

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e4e7ec] bg-white">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="sticky top-0 z-[1] bg-[#f8fafc]">
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <TableHead
                  key={c.key}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn('h-10 text-[12px] font-medium text-[#627181]', c.hideBelow && HIDE[c.hideBelow], c.className)}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 cursor-pointer hover:text-[#101828]"
                    >
                      {c.header}
                      {active &&
                        (sort!.dir === 'asc' ? (
                          <ArrowUp aria-hidden className="size-3" strokeWidth={1.5} />
                        ) : (
                          <ArrowDown aria-hidden className="size-3" strokeWidth={1.5} />
                        ))}
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(({ group, items }) => (
            <React.Fragment key={group?.id ?? 'all'}>
              {group && (
                <TableRow className="border-[#f1f1f1] bg-white hover:bg-white">
                  <TableCell colSpan={columns.length} className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={!collapsed.has(group.id)}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#101828] cursor-pointer"
                    >
                      <ChevronDown
                        aria-hidden
                        strokeWidth={1.5}
                        className={cn('size-4 transition-transform', collapsed.has(group.id) && '-rotate-90')}
                      />
                      <span aria-hidden className={cn('size-2 rounded-full', GROUP_DOT[group.tone ?? 'muted'])} />
                      {group.label}
                      <span className="rounded-full bg-[#f1f5f9] px-2 text-[12px] font-medium text-[#627181]">{items.length}</span>
                    </button>
                  </TableCell>
                </TableRow>
              )}
              {!(group && collapsed.has(group.id)) &&
                items.map((row) => (
                  <TableRow
                    key={getKey(row)}
                    tabIndex={0}
                    aria-label={getRowLabel(row)}
                    onClick={(e) => !fromControl(e) && open(row)}
                    onKeyDown={(e) => e.key === 'Enter' && !fromControl(e) && open(row)}
                    className="cursor-pointer border-[#f1f1f1] hover:bg-[#f8f7fe] focus-visible:outline-2 focus-visible:outline-[#7150e7] focus-visible:-outline-offset-2"
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key} className={cn('py-3 align-middle text-[14px] text-[#101828]', c.hideBelow && HIDE[c.hideBelow], c.className)}>
                        {c.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---- small shared cells ---- */

export function TitleCell({ title, subtitle, leading }: { title: string; subtitle?: string; leading?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {leading}
      <div className="min-w-0">
        <p className="max-w-[340px] truncate font-medium" title={title}>{title}</p>
        {subtitle && <p className="max-w-[340px] truncate text-[12px] italic text-[#627181]" title={subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

const PILL = {
  success: 'bg-[#ebfdef] text-[#1b806a]',
  warning: 'bg-[#fff7e6] text-[#7a4100]',
  neutral: 'bg-[#f1f5f9] text-[#344054]',
  brand: 'bg-[#f4f2fd] text-[#5b3fd1]',
} as const;

export function Pill({ tone = 'neutral', children }: { tone?: keyof typeof PILL; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium italic', PILL[tone])}>
      {children}
    </span>
  );
}

export function MatchPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[#627181]">—</span>;
  return <Pill tone={value >= 80 ? 'success' : value >= 60 ? 'brand' : 'warning'}>{value}%</Pill>;
}

/** Days until an ISO date (negative = past) */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function DeadlineCell({ iso }: { iso: string }) {
  const d = daysUntil(iso);
  const date = new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <span className={cn('whitespace-nowrap', d < 0 ? 'text-[#627181]' : d <= 7 ? 'font-medium text-[#b42318]' : '')}>
      {date}
      {d >= 0 && <span className="text-[12px] text-[#627181]"> · {d}d</span>}
    </span>
  );
}

/** Closing soon (≤ 14 days) / Open / Closed */
export function deadlineGroup(iso: string): FeedGroup {
  const d = daysUntil(iso);
  if (d < 0) return { id: 'closed', label: 'Closed', order: 2, tone: 'muted' };
  if (d <= 14) return { id: 'soon', label: 'Closing soon', order: 0, tone: 'danger' };
  return { id: 'open', label: 'Open', order: 1, tone: 'success' };
}

export function CountryCell({ flagSrc, label }: { flagSrc?: string | null; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {flagSrc && <img src={flagSrc} alt="" width={16} height={16} className="size-4 rounded-full object-cover" />}
      {label}
    </span>
  );
}

const actionBtn =
  'inline-flex size-8 items-center justify-center rounded-[6px] text-[#627181] hover:bg-[#f4f2fd] hover:text-[#7150e7] transition-colors cursor-pointer';
export const tableActionClass = actionBtn;
