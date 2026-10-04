'use client';

import React from 'react';

export type ViewMode = 'grid' | 'list';

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
}

function ViewToggleIcon({ src, size, active }: { src: string; size: number; active: boolean }) {
  return (
    <span
      aria-hidden
      className={active ? 'bg-[#7150e7]' : 'bg-[#627181]'}
      style={{ width: size, height: size, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

// Figma: list bar above the cards (Opportunity Feed 183:4558, Scholarship Radar 233:8930)
export const OpportunityListBar: React.FC<OpportunityListBarProps> = ({
  title = 'Opportunity List',
  count,
  acceptanceRange,
  rangeLabel = 'Acceptance Rate',
  acceptanceColor = '#1b806a',
  viewMode,
  onViewModeChange,
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
          <span className="font-bold italic" style={{ color: acceptanceColor }}>✓ {acceptanceRange}</span> {rangeLabel} on your customise filter
        </p>
      )}
    </div>

    <div className="flex items-center shrink-0" role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label="Grid view"
        className={`flex items-center justify-center h-8 w-9 rounded-l-[10px] cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-[#ede9fc] border border-[#7150e7]'
            : 'bg-white border-y border-l border-[#e1e8f0]'
        }`}
      >
        <span className="flex items-center justify-center size-4">
          <ViewToggleIcon src="/opportunity-feed/grid-view.svg" size={14.3333} active={viewMode === 'grid'} />
        </span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        aria-pressed={viewMode === 'list'}
        aria-label="List view"
        className={`flex items-center justify-center h-8 w-9 rounded-r-[10px] cursor-pointer ${
          viewMode === 'list'
            ? 'bg-[#ede9fc] border border-[#7150e7]'
            : 'bg-white border-y border-r border-[#e1e8f0]'
        }`}
      >
        <span className="flex items-center justify-center size-4">
          <ViewToggleIcon src="/opportunity-feed/list-view.svg" size={13.3334} active={viewMode === 'list'} />
        </span>
      </button>
    </div>
  </div>
);
