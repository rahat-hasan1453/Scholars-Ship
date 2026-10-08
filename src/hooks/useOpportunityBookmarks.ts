'use client';

import { useCallback, useMemo } from 'react';
import { useApp, type BookmarkKind } from '@/context/AppContext';

// Bookmarks are saved to the signed-in user's account (/api/bookmarks); the state lives in AppContext,
// so the feed cards and the details pages always show the same thing.
function useBookmarks(kind: Exclude<BookmarkKind, 'papers'>) {
  const { savedOpportunityIds, savedProfessorIds, setBookmark } = useApp();
  const ids = kind === 'opportunities' ? savedOpportunityIds : savedProfessorIds;
  const bookmarks = useMemo(() => new Set(ids), [ids]);

  const toggleBookmark = useCallback((id: string) => setBookmark(kind, id, !bookmarks.has(id)), [bookmarks, kind, setBookmark]);

  return { bookmarks, toggleBookmark };
}

export const useOpportunityBookmarks = () => useBookmarks('opportunities');
export const useProfessorBookmarks = () => useBookmarks('professors');
