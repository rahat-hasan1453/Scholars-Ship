'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/components/opportunity-feed/OpportunityListBar';

// Card height is fixed (Figma: 330px); width fills its column.
export const FEED_CARD_HEIGHT = 330;
export const FEED_CARD_GAP = 16;

// Columns follow the browser width: 1 → 2 (sm) → 3 (lg) → 4 (≥ 2200px). List view is a single column.
const GRID_COLUMNS = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[2200px]:grid-cols-4';

export function FeedGrid({ viewMode, children }: { viewMode: ViewMode; children: React.ReactNode }) {
  return <div className={cn('grid gap-4', viewMode === 'list' ? 'grid-cols-1' : GRID_COLUMNS)}>{children}</div>;
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
