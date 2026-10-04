'use client';

import { formatPercentRange } from '@/lib/utils';
import React, { useEffect, useState, useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { UniversityOpportunityCard } from '@/components/opportunity-feed/UniversityOpportunityCard';
import { ShortsPager } from '@/components/opportunity-feed/ShortsPager';
import { OpportunityListBar, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import type { Opportunity } from '@/types';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';
import { useSessionState } from '@/hooks/useSessionState';
import { useOpportunityBookmarks } from '@/hooks/useOpportunityBookmarks';
import { FEED_CARD_GAP, FEED_CARD_HEIGHT, useFeedGrid } from '@/hooks/useFeedGrid';

// Figma defaults (Opportunity Feed, node 183:4449)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Empty selection = no restriction. Inside one filter: OR. Across filters: AND.
const matchesAny = (selected: string[], values: string[]) =>
  selected.length === 0 || values.some((v) => selected.includes(v));

export const OpportunitiesFeed: React.FC = () => {
  const { globalSearchQuery } = useApp();
  const grid = useFeedGrid();

  // Kept in sessionStorage so list → details → back returns to the same list
  const [selectedSubjects, setSelectedSubjects] = useSessionState<string[]>('feed:subjects', DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useSessionState<string[]>('feed:degrees', DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useSessionState<string[]>('feed:countries', DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useSessionState<string[]>('feed:funding', DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useSessionState<ViewMode>('feed:view', 'grid');
  const [listings, setListings] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/opportunities')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body) => !cancelled && setListings(body.data))
      .catch((error) => {
        console.error('Failed to load opportunities, using bundled list', error);
        if (!cancelled) setListings(OPPORTUNITY_LISTINGS);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const { bookmarks, toggleBookmark } = useOpportunityBookmarks();

  const filteredListings = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    return (listings ?? []).filter((p) => {
      if (q) {
        const haystack = [p.title, p.institution, p.authorName, p.labName ?? '', p.country, p.funding, ...p.fieldTags, ...p.subjectTags]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return (
        matchesAny(selectedSubjects, p.subjectTags) &&
        matchesAny(selectedDegrees, p.degreeLevels) &&
        matchesAny(selectedCountries, [p.country]) &&
        matchesAny(selectedFunding, p.fundingTags)
      );
    });
  }, [listings, globalSearchQuery, selectedSubjects, selectedDegrees, selectedCountries, selectedFunding]);

  const acceptanceRange = useMemo(() => {
    return formatPercentRange(filteredListings.map((p) => p.acceptanceRate));
  }, [filteredListings]);

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
          <OpportunityListBar
            count={filteredListings.length}
            acceptanceRange={acceptanceRange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {listings === null ? (
            <div
              role="status"
              aria-busy
              aria-label="Loading opportunities"
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: FEED_CARD_GAP }}
            >
              {Array.from({ length: cols * grid.rows }, (_, i) => (
                <div
                  key={i}
                  className="rounded-[16px] border-[0.5px] border-[#f1f1f1] bg-[#fafafa] animate-pulse motion-reduce:animate-none"
                  style={{ height: FEED_CARD_HEIGHT }}
                />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching opportunities found</h3>
              <p className="text-xs text-[#667085] max-w-md">
                Try removing some subject or country filters to see more opportunities.
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
            <ShortsPager<Opportunity>
              key={resetKey}
              items={filteredListings}
              cols={cols}
              rows={grid.rows}
              getKey={(p) => p.id}
              renderItem={(p) => (
                <UniversityOpportunityCard
                  opportunity={p}
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
