'use client';

import React, { useEffect, useRef } from 'react';

interface FeedShellProps {
  /** UnifiedDiscoveryHeader with the filters. Stays in place while the cards scroll. */
  header: React.ReactNode;
  /** OpportunityListBar. Stays in place too. */
  listBar: React.ReactNode;
  /** Jumps the cards back to the top when this changes (filters, search, mode) */
  scrollResetKey: string;
  children: React.ReactNode;
}

// Page frame shared by the four feeds. On desktop only the cards scroll; the filters and list bar above
// them are fixed. On tablets and phones the whole page scrolls, because the stacked filters are tall.
export function FeedShell({ header, listBar, scrollResetKey, children }: FeedShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollResetKey]);

  return (
    <div className="relative flex flex-col min-w-0 lg:h-scaled-screen lg:py-5 lg:pl-5 lg:pr-[30px]">
      <div className="flex-1 min-h-0 flex flex-col bg-white lg:rounded-[16px] lg:overflow-hidden">
        {header}
        <section className="flex-1 min-h-0 flex flex-col gap-5 p-5">
          {listBar}
          {/* The negative margin + padding keep the card hover shadow from being clipped */}
          <div ref={scrollRef} data-feed-scroll className="flex flex-1 min-h-0 flex-col -m-2 p-2 lg:overflow-y-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
