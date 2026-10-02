'use client';

import { useEffect, useState } from 'react';

// Card height stays fixed (Figma: 330px); width stretches to fill its column.
export const FEED_CARD_HEIGHT = 330;
export const FEED_CARD_GAP = 16;

// Large screens (≥ 2200px wide) fit 4 columns; ≥ 1440px tall also fits a 3rd row.
const WIDE_SCREEN = 2200;
const TALL_SCREEN = 1440;
// Laptops/PCs (≥ 1024px) always get 3+ columns × 2+ rows (the shell scales down to fit).
// Below that the shell is not scaled: tablets get 2 × 2, phones a single card.
const TABLET = 1024;
const PHONE = 640;

export interface FeedGrid {
  cols: number;
  rows: number;
  perPage: number;
}

function computeGrid(): FeedGrid {
  const { innerWidth: w, innerHeight: h } = window;
  if (w < PHONE) return { cols: 1, rows: 1, perPage: 1 };
  if (w < TABLET) return { cols: 2, rows: 2, perPage: 4 };
  const cols = w >= WIDE_SCREEN ? 4 : 3;
  const rows = cols === 4 && h >= TALL_SCREEN ? 3 : 2;
  return { cols, rows, perPage: cols * rows };
}

// Columns/rows of one Shorts-style feed page, based on screen size.
export function useFeedGrid(): FeedGrid {
  const [grid, setGrid] = useState<FeedGrid>({ cols: 3, rows: 2, perPage: 6 });

  useEffect(() => {
    const update = () =>
      setGrid((prev) => {
        const next = computeGrid();
        return prev.cols === next.cols && prev.rows === next.rows ? prev : next;
      });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return grid;
}
