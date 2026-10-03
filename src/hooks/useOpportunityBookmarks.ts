'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Bookmarks live in localStorage until a saved-items table exists.
// Shared by the feed cards and the details pages so both show the same state.
const OPPORTUNITY_KEY = 'highscholar_bookmarked_programs';
const PROFESSOR_KEY = 'highscholar_bookmarked_professors';
const BOOKMARKS_EVENT = 'highscholar-bookmarks-change';

function readBookmarksRaw(key: string): string {
  try {
    return localStorage.getItem(key) ?? '[]';
  } catch {
    return '[]';
  }
}

function subscribeBookmarks(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(BOOKMARKS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(BOOKMARKS_EVENT, onChange);
  };
}

function parseBookmarks(raw: string): Set<string> {
  try {
    const ids: unknown = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function useBookmarks(key: string) {
  const read = useCallback(() => readBookmarksRaw(key), [key]);
  const raw = useSyncExternalStore(subscribeBookmarks, read, () => '[]');
  const bookmarks = useMemo(() => parseBookmarks(raw), [raw]);

  const toggleBookmark = useCallback(
    (id: string) => {
      const next = parseBookmarks(readBookmarksRaw(key));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {}
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    },
    [key],
  );

  return { bookmarks, toggleBookmark };
}

export const useOpportunityBookmarks = () => useBookmarks(OPPORTUNITY_KEY);
export const useProfessorBookmarks = () => useBookmarks(PROFESSOR_KEY);
