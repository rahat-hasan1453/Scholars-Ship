'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Opportunity bookmarks live in localStorage until a saved-items table exists.
// Shared by the feed cards and the details page so both show the same state.
const BOOKMARKS_KEY = 'highscholar_bookmarked_programs';
const BOOKMARKS_EVENT = 'highscholar-bookmarks-change';

function readBookmarksRaw(): string {
  try {
    return localStorage.getItem(BOOKMARKS_KEY) ?? '[]';
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

export function useOpportunityBookmarks() {
  const raw = useSyncExternalStore(subscribeBookmarks, readBookmarksRaw, () => '[]');
  const bookmarks = useMemo(() => parseBookmarks(raw), [raw]);

  const toggleBookmark = useCallback((id: string) => {
    const next = parseBookmarks(readBookmarksRaw());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
    } catch {}
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  }, []);

  return { bookmarks, toggleBookmark };
}
