'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FEED_CARD_GAP } from '@/hooks/useFeedGrid';

const SLIDE_MS = 450;
// Wheel distance needed before flipping a page (filters out tiny trackpad nudges)
const WHEEL_THRESHOLD = 40;
// A wheel gesture is over once no event arrives for this long (ends trackpad inertia)
const WHEEL_QUIET_MS = 160;
const SWIPE_THRESHOLD = 50;
const MAX_VISIBLE_DOTS = 7;

interface ShortsPagerProps<T> {
  items: T[];
  cols: number;
  rows: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  /** Where the page indicator is rendered (outside the clipped card area) */
  renderIndicator: (indicator: React.ReactNode) => React.ReactNode;
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

// One "page" of cards fills the viewport; wheel / swipe / arrow keys move a whole
// page at a time, YouTube-Shorts style. Remount it (via `key`) to jump back to page 1.
export function ShortsPager<T>({
  items,
  cols,
  rows,
  getKey,
  renderItem,
  renderIndicator,
}: ShortsPagerProps<T>) {
  const perPage = cols * rows;
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const [rawPage, setPage] = useState(0);
  // Stay in range when the grid size or result count shrinks
  const page = Math.min(rawPage, pageCount - 1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const pageCountRef = useRef(pageCount);
  useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);


  const goTo = useCallback(
    (next: number) => setPage(Math.max(0, Math.min(pageCountRef.current - 1, next))),
    []
  );
  const step = useCallback(
    (dir: 1 | -1) =>
      setPage((p) => {
        const last = pageCountRef.current - 1;
        return Math.max(0, Math.min(last, Math.min(p, last) + dir));
      }),
    []
  );

  // Wheel / trackpad: one page per gesture
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let locked = false;
    let animating = false;
    let delta = 0;
    let lastWheel = 0;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let slideTimer: ReturnType<typeof setTimeout> | undefined;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      lastWheel = Date.now();
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        delta = 0;
        if (!animating) locked = false;
      }, WHEEL_QUIET_MS);
      if (locked) return;

      delta += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(delta) < WHEEL_THRESHOLD) return;

      step(delta > 0 ? 1 : -1);
      delta = 0;
      locked = true;
      animating = true;
      clearTimeout(slideTimer);
      slideTimer = setTimeout(() => {
        animating = false;
        if (Date.now() - lastWheel >= WHEEL_QUIET_MS) locked = false;
      }, SLIDE_MS);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(quietTimer);
      clearTimeout(slideTimer);
    };
  }, [step]);

  // Touch swipe
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let startY: number | null = null;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null;
    };
    const onEnd = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = startY - (e.changedTouches[0]?.clientY ?? startY);
      startY = null;
      if (Math.abs(dy) >= SWIPE_THRESHOLD) step(dy > 0 ? 1 : -1);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [step]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const pages: T[][] = [];
  for (let i = 0; i < pageCount; i++) pages.push(items.slice(i * perPage, (i + 1) * perPage));

  // Indicator: active bar + dots, windowed when there are many pages
  const visible = Math.min(pageCount, MAX_VISIBLE_DOTS);
  const first = Math.max(0, Math.min(page - Math.floor(visible / 2), pageCount - visible));
  const indicator =
    pageCount > 1 ? (
      <nav aria-label="Opportunity pages" className="flex flex-col items-center gap-1">
        {Array.from({ length: visible }, (_, i) => {
          const p = first + i;
          const active = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-label={`Page ${p + 1} of ${pageCount}`}
              aria-current={active ? 'page' : undefined}
              className={`relative w-1 rounded-[16px] cursor-pointer transition-all duration-300 before:absolute before:-inset-x-2 before:-inset-y-0.5 before:content-[''] ${
                active ? 'h-8 bg-[#7150e7]' : 'h-1 bg-[#c4b8f5] hover:bg-[#9f8cee]'
              }`}
            />
          );
        })}
      </nav>
    ) : null;

  return (
    <>
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Opportunity list"
        className="relative -m-1.5 flex-1 min-h-0 overflow-hidden touch-none"
      >
        <div
          className="h-full flex flex-col transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateY(${-page * 100}%)`, transitionDuration: `${SLIDE_MS}ms` }}
        >
          {pages.map((pageItems, i) => (
            <div
              key={i}
              aria-hidden={i !== page}
              inert={i !== page}
              className="h-full shrink-0 grid content-start p-1.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: FEED_CARD_GAP,
              }}
            >
              {pageItems.map((item) => (
                <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>
              ))}
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Page {page + 1} of {pageCount}
        </p>
      </div>
      {renderIndicator(indicator)}
    </>
  );
}
