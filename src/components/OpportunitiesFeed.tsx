'use client';

import { formatPercentRange } from '@/lib/utils';
import React, { useEffect, useState, useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { UniversityOpportunityCard } from '@/components/opportunity-feed/UniversityOpportunityCard';
import { FeedShell } from '@/components/opportunity-feed/FeedShell';
import { OpportunityTable } from '@/components/feed/FeedTables';
import { FeedGrid, FeedSkeleton } from '@/components/opportunity-feed/FeedGrid';
import { OpportunityListBar, MatchMode, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import type { Opportunity } from '@/types';
import { useSessionState } from '@/hooks/useSessionState';
import { useSearchMissLog } from '@/hooks/useSearchMissLog';
import { profileFilterDefaults, useProfileFilterDefaults } from '@/hooks/useProfileFilterDefaults';
import { useOpportunityBookmarks } from '@/hooks/useOpportunityBookmarks';
import { isOpportunityEligible } from '@/lib/eligibility';

// Defaults: degree preset as in Figma (node 183:4449). Subject and country start open, because real posts
// cover every field and many don't name a country; a preset would hide most of them.
const DEFAULT_SUBJECTS: string[] = [];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES: string[] = [];
// Real posts carry no acceptance-rate data, so no funding filter is preset
const DEFAULT_FUNDING: string[] = [];

// Empty selection = no restriction. Inside one filter: OR. Across filters: AND.
const matchesAny = (selected: string[], values: string[]) =>
  selected.length === 0 || values.some((v) => selected.includes(v));

export const OpportunitiesFeed: React.FC = () => {
  const { globalSearchQuery, profile } = useApp();

  // Kept in sessionStorage so list → details → back returns to the same list
  const [selectedSubjects, setSelectedSubjects] = useSessionState<string[]>('feed:subjects', DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useSessionState<string[]>('feed:degrees', DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useSessionState<string[]>('feed:countries', DEFAULT_COUNTRIES);
  useProfileFilterDefaults('feed', { setSubjects: setSelectedSubjects, setDegrees: setSelectedDegrees, setCountries: setSelectedCountries });
  const [selectedFunding, setSelectedFunding] = useSessionState<string[]>('feed:funding', DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useSessionState<ViewMode>('feed:view', 'grid');
  const [matchMode, setMatchMode] = useSessionState<MatchMode>('feed:match', 'all');
  const [listings, setListings] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/opportunities')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body) => !cancelled && setListings(body.data))
      .catch((error) => {
        console.error('Failed to load opportunities', error);
        if (!cancelled) setListings([]);
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
      if (matchMode === 'eligible' && !isOpportunityEligible(p, profile)) return false;
      return (
        matchesAny(selectedSubjects, p.subjectTags) &&
        matchesAny(selectedDegrees, p.degreeLevels) &&
        matchesAny(selectedCountries, [p.country]) &&
        matchesAny(selectedFunding, p.fundingTags)
      );
    });
  }, [listings, globalSearchQuery, matchMode, profile, selectedSubjects, selectedDegrees, selectedCountries, selectedFunding]);

  const acceptanceRange = useMemo(() => {
    return formatPercentRange(filteredListings.flatMap((p) => (p.acceptanceRate === undefined ? [] : [p.acceptanceRate])));
  }, [filteredListings]);

  // Any filter, search or mode change scrolls the cards back to the top
  const scrollResetKey = JSON.stringify([
    globalSearchQuery,
    selectedSubjects,
    selectedDegrees,
    selectedCountries,
    selectedFunding,
    matchMode,
    viewMode,
  ]);

  useSearchMissLog(
    {
      page: 'opportunities',
      query: globalSearchQuery,
      subjects: selectedSubjects,
      degrees: selectedDegrees,
      countries: selectedCountries,
      funding: selectedFunding,
      matchMode,
    },
    listings?.length ?? 0,
    filteredListings.length,
  );

  const resetFilters = () => {
    const d = profileFilterDefaults(profile);
    setSelectedSubjects(d.subjects.length ? d.subjects : DEFAULT_SUBJECTS);
    setSelectedDegrees(d.degrees.length ? d.degrees : DEFAULT_DEGREES);
    setSelectedCountries(d.countries.length ? d.countries : DEFAULT_COUNTRIES);
    setSelectedFunding(DEFAULT_FUNDING);
  };

  return (
    <FeedShell
      scrollResetKey={scrollResetKey}
        header={
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
        }
      listBar={
        <OpportunityListBar
          count={filteredListings.length}
          acceptanceRange={acceptanceRange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          matchMode={matchMode}
          onMatchModeChange={setMatchMode}
        />
      }
    >
      {listings === null ? (
        <FeedSkeleton viewMode={viewMode} label="Loading opportunities" />
      ) : filteredListings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-semibold text-[#101828]">No matching opportunities found</h3>
              <p className="text-xs text-[#667085] max-w-md">
                {matchMode === 'eligible'
                  ? 'None of these match your current profile. Switch to "All" to see every listing.'
                  : 'Try removing some subject or country filters to see more opportunities.'}
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
        viewMode === 'list' ? (
          <OpportunityTable rows={filteredListings} />
        ) : (
          <FeedGrid viewMode={viewMode}>
            {filteredListings.map((p) => (
              <UniversityOpportunityCard
                key={p.id}
                opportunity={p}
                isBookmarked={bookmarks.has(p.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </FeedGrid>
        )
      )}
    </FeedShell>
  );
};
