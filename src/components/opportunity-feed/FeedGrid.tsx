'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/components/opportunity-feed/OpportunityListBar';

// Card height is fixed (Figma: 330px); width fills its column.
export const FEED_CARD_HEIGHT = 330;
export const FEED_CARD_GAP = 16;

// Columns follow the browser width: 1 → 2 (sm) → 3 (lg) → 4 (≥ 2200px). List view is a single column.
const GRID_COLUMNS = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[2200px]:grid-cols-4';

/** Cards rendered at first and per "Show more" click; the real catalogue has hundreds of rows */
export const FEED_PAGE_SIZE = 48;

export function FeedGrid({ viewMode, children }: { viewMode: ViewMode; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const [limit, setLimit] = useState(FEED_PAGE_SIZE);
  // A new result set (filters changed) starts again from the first page
  const [seenCount, setSeenCount] = useState(items.length);
  if (seenCount !== items.length) {
    setSeenCount(items.length);
    setLimit(FEED_PAGE_SIZE);
  }
  const hidden = items.length - limit;
  return (
    <>
      <div className={cn('grid gap-4', viewMode === 'list' ? 'grid-cols-1' : GRID_COLUMNS)}>{items.slice(0, limit)}</div>
      {hidden > 0 && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            type="button"
            onClick={() => setLimit((l) => l + FEED_PAGE_SIZE)}
            className="h-9 px-4 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[14px] leading-5 font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors cursor-pointer"
          >
            Show more ({hidden.toLocaleString()} left)
          </button>
        </div>
      )}
    </>
  );
}

/** Placeholder cards while a feed loads */
export function FeedSkeleton({ viewMode, label }: { viewMode: ViewMode; label: string }) {
  return (
    <div role="status" aria-busy aria-label={label} className={cn('grid gap-4', viewMode === 'list' ? 'grid-cols-1' : GRID_COLUMNS)}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-[16px] border-[0.5px] border-[#f1f1f1] bg-[#fafafa] animate-pulse motion-reduce:animate-none"
          style={{ height: FEED_CARD_HEIGHT }}
        />
      ))}
    </div>
  );
}
