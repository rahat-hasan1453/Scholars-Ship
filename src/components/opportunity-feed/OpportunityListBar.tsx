'use client';

import React from 'react';
import { SegmentedToggle, type SegmentedOption } from '@/components/feed/SegmentedToggle';

export type ViewMode = 'grid' | 'list';

/** "All" shows every listing; "Eligible Now" only the ones the student can apply to with their current profile */
export type MatchMode = 'all' | 'eligible';

interface OpportunityListBarProps {
  /** Heading above the cards, e.g. "Scholarship List" */
  title?: string;
  count: number;
  acceptanceRange: string | null;
  /** Word after the range: "Acceptance Rate" (Opportunity Feed) or "Match" (pages that use match scores) */
  rangeLabel?: string;
  /** Figma uses #1b806a on Scholarship Radar, #36b37e on Faculty & Research Labs */
  acceptanceColor?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Shows the All / Eligible Now switch when both are given */
  matchMode?: MatchMode;
  onMatchModeChange?: (mode: MatchMode) => void;
}

function ViewToggleIcon({ src, size }: { src: string; size: number }) {
  // Takes the colour of the segment text: brand purple when on, grey when off
  return (
    <span
      aria-hidden
      className="bg-current"
      style={{ width: size, height: size, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

const MATCH_OPTIONS: SegmentedOption<MatchMode>[] = [
  { value: 'all', label: 'All' },
  { value: 'eligible', label: 'Eligible Now' },
];

const VIEW_OPTIONS: SegmentedOption<ViewMode>[] = [
  { value: 'grid', ariaLabel: 'Grid view', icon: <ViewToggleIcon src="/opportunity-feed/grid-view.svg" size={14.3333} /> },
  { value: 'list', ariaLabel: 'List view', icon: <ViewToggleIcon src="/opportunity-feed/list-view.svg" size={13.3334} /> },
];

// Figma: list bar above the cards (Opportunity Feed 183:4558 + toggles 295:5069, Scholarship Radar 233:8930)
export const OpportunityListBar: React.FC<OpportunityListBarProps> = ({
  title = 'Opportunity List',
  count,
  acceptanceRange,
  rangeLabel = 'Acceptance Rate',
  acceptanceColor = '#1b806a',
  viewMode,
  onViewModeChange,
  matchMode,
  onMatchModeChange,
}) => (
  <div className="flex items-center justify-between gap-3 shrink-0">
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1">
        <h2 className="text-[20px] leading-[28px] font-semibold text-[#101828] whitespace-nowrap">
          {title}
        </h2>
        <span className="flex items-center h-[25px] text-[14px] leading-[18px] text-[#627181] whitespace-nowrap">
          / {count} Items
        </span>
      </div>
      {acceptanceRange && (
        <p className="text-[14px] leading-[18px] text-[#627181] truncate">
          <span className="font-semibold italic" style={{ color: acceptanceColor }}>✓ {acceptanceRange}</span> {rangeLabel} on your customise filter
        </p>
      )}
    </div>

    <div className="flex items-center justify-end gap-4 shrink-0">
      {matchMode && onMatchModeChange && (
        <SegmentedToggle label="Show" value={matchMode} onValueChange={onMatchModeChange} options={MATCH_OPTIONS} />
      )}
      <SegmentedToggle label="View mode" value={viewMode} onValueChange={onViewModeChange} options={VIEW_OPTIONS} />
    </div>
  </div>
);
