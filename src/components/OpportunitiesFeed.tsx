'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { UniversityOpportunityCard } from '@/components/opportunity-feed/UniversityOpportunityCard';
import { ShortsPager } from '@/components/opportunity-feed/ShortsPager';
import { UNIVERSITY_PROGRAMS, UniversityProgram } from '@/data/universityPrograms';
import { useFeedGrid } from '@/hooks/useFeedGrid';

const BOOKMARKS_KEY = 'highscholar_bookmarked_programs';

// Figma defaults (Opportunity Feed, node 183:4449)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Empty selection = no restriction. Inside one filter: OR. Across filters: AND.
const matchesAny = (selected: string[], values: string[]) =>
  selected.length === 0 || values.some((v) => selected.includes(v));

// Bookmarks live in localStorage until a saved-items table exists
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

function ViewToggleIcon({ src, size, active }: { src: string; size: number; active: boolean }) {
  return (
    <span
      aria-hidden
      className={active ? 'bg-[#7150e7]' : 'bg-[#627181]'}
      style={{ width: size, height: size, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

export const OpportunitiesFeed: React.FC = () => {
  const { globalSearchQuery } = useApp();
  const grid = useFeedGrid();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useState<string[]>(DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const bookmarksRaw = useSyncExternalStore(subscribeBookmarks, readBookmarksRaw, () => '[]');
  const bookmarks = useMemo(() => parseBookmarks(bookmarksRaw), [bookmarksRaw]);

  const toggleBookmark = useCallback((id: string) => {
    const next = parseBookmarks(readBookmarksRaw());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
    } catch {}
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  }, []);

  const filteredPrograms = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    return UNIVERSITY_PROGRAMS.filter((p) => {
      if (q) {
        const haystack = [p.university, p.subjects, p.country, p.financial, ...p.subjectTags]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return (
        matchesAny(selectedSubjects, p.subjectTags) &&
        matchesAny(selectedDegrees, p.degrees) &&
        matchesAny(selectedCountries, [p.country]) &&
        matchesAny(selectedFunding, p.fundingTags)
      );
    });
  }, [globalSearchQuery, selectedSubjects, selectedDegrees, selectedCountries, selectedFunding]);

  const acceptanceRange = useMemo(() => {
    if (filteredPrograms.length === 0) return null;
    const rates = filteredPrograms.map((p) => p.acceptanceRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    return min === max ? `${min}%` : `${min}% – ${max}%`;
  }, [filteredPrograms]);

  // Any filter/search change sends the pager back to page 1
  const resetKey = JSON.stringify([
    globalSearchQuery,
    selectedSubjects,
    selectedDegrees,
    selectedCountries,
    selectedFunding,
    viewMode,
  ]);

  const resetFilters = () => {
    setSelectedSubjects(DEFAULT_SUBJECTS);
    setSelectedDegrees(DEFAULT_DEGREES);
    setSelectedCountries(DEFAULT_COUNTRIES);
    setSelectedFunding(DEFAULT_FUNDING);
  };

  const cols = viewMode === 'list' ? 1 : grid.cols;

  return (
    // Fixed-height shell: only the card area moves, header + list bar stay put
    <div className="relative h-scaled-screen flex flex-col min-w-0 lg:py-5 lg:pl-5 lg:pr-[30px]">
      <div className="flex-1 min-h-0 flex flex-col bg-white lg:rounded-[16px] overflow-hidden">
        <UnifiedDiscoveryHeader
          selectedSubjects={selectedSubjects}
          setSelectedSubjects={setSelectedSubjects}
          selectedDegrees={selectedDegrees}
          setSelectedDegrees={setSelectedDegrees}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedFunding={selectedFunding}
          setSelectedFunding={setSelectedFunding}
        />

        <section className="flex-1 min-h-0 flex flex-col gap-5 p-5">
          {/* List bar (Figma 183:4558) */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="text-[16px] leading-[24px] font-medium text-[#101828] whitespace-nowrap">
                  Opportunity List
                </h2>
                <span className="flex items-center h-[25px] text-[12px] leading-[14px] italic tracking-[-0.6412px] text-[#627181] whitespace-nowrap">
                  / {filteredPrograms.length} Items
                </span>
              </div>
              {acceptanceRange && (
                <p className="text-[12px] leading-[16px] text-[#627181] truncate">
                  <span className="font-bold italic text-[#1b806a]">✓ {acceptanceRange}</span> Acceptance Rate
                  on your customise filter
                </p>
              )}
            </div>

            <div className="flex items-center shrink-0" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
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
                onClick={() => setViewMode('list')}
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

          {filteredPrograms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching opportunities found</h3>
              <p className="text-xs text-[#667085] max-w-md">
                Try removing some subject or country filters to see more universities.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-[#7150E7] text-white text-xs font-semibold rounded-full hover:bg-[#5f3fd6] transition-colors cursor-pointer"
              >
                Reset to Default Filters
              </button>
            </div>
          ) : (
            <ShortsPager<UniversityProgram>
              key={resetKey}
              items={filteredPrograms}
              cols={cols}
              rows={grid.rows}
              getKey={(p) => p.id}
              renderItem={(p) => (
                <UniversityOpportunityCard
                  program={p}
                  isBookmarked={bookmarks.has(p.id)}
                  onToggleBookmark={toggleBookmark}
                />
              )}
              renderIndicator={(indicator) =>
                indicator && (
                  <div className="absolute right-[9px] top-1/2 -translate-y-1/2 z-10 hidden lg:block">
                    {indicator}
                  </div>
                )
              }
            />
          )}
        </section>
      </div>
    </div>
  );
};
