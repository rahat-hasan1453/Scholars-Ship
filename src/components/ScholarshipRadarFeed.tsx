'use client';

import React, { useMemo } from 'react';
import { useSessionState } from '@/hooks/useSessionState';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { ScholarshipRadarCard } from '@/components/ScholarshipRadarCard';
import { FeedShell } from '@/components/opportunity-feed/FeedShell';
import { ScholarshipTable } from '@/components/feed/FeedTables';
import { FeedGrid } from '@/components/opportunity-feed/FeedGrid';
import { OpportunityListBar, MatchMode, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import { isScholarshipEligible } from '@/lib/eligibility';
import { calculateMatchScore, formatPercentRange } from '@/lib/utils';

// Figma defaults (Scholarship Radar, node 233:8924)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Scholarships carry no acceptance-rate data yet, so the Figma range is shown as-is

export const ScholarshipRadarFeed: React.FC = () => {
  const { scholarships, globalSearchQuery, profile } = useApp();

  // Kept in sessionStorage so "Back to Scholarship Radar" returns to the same filters
  const [selectedSubjects, setSelectedSubjects] = useSessionState<string[]>('radar:subjects', DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useSessionState<string[]>('radar:degrees', DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useSessionState<string[]>('radar:countries', DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useSessionState<string[]>('radar:funding', DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useSessionState<ViewMode>('radar:view', 'grid');
  const [matchMode, setMatchMode] = useSessionState<MatchMode>('radar:match', 'all');

  const filteredScholarships = useMemo(() => {
    return scholarships.filter((sch) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inTitle = sch.title?.toLowerCase().includes(q);
        const inProvider = sch.provider?.toLowerCase().includes(q);
        const inDesc = sch.description?.toLowerCase().includes(q);
        const inTags = sch.tags?.some(t => t.toLowerCase().includes(q));
        const inSpecs = sch.specializations?.some(s => s.toLowerCase().includes(q));
        if (!inTitle && !inProvider && !inDesc && !inTags && !inSpecs) return false;
      }

      // Eligible Now: degree level and every stated minimum score met with the current profile
      if (matchMode === 'eligible' && !isScholarshipEligible(sch, profile)) return false;

      // 2. Degree filter
      if (selectedDegrees.length > 0 && sch.degreeLevels?.length) {
        const matchesDegree = sch.degreeLevels.some(d => selectedDegrees.includes(d));
        if (!matchesDegree) return false;
      }

      // 3. Country filter
      if (selectedCountries.length > 0 && sch.countries?.length) {
        const matchesCountry = sch.countries.some(c => {
          const sc = c.toLowerCase();
          return selectedCountries.some(userCountry => {
            const uc = userCountry.toLowerCase();
            return sc.includes(uc) || uc.includes(sc);
          });
        });
        if (!matchesCountry) return false;
      }

      // 4. Subject filter
      if (selectedSubjects.length > 0) {
        const allTags = [...(sch.specializations || []), ...(sch.tags || [])];
        const matchesSubject = allTags.some(tag =>
          selectedSubjects.some(sub => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('ux') && (t.includes('design') || t.includes('ux') || t.includes('hci'))) return true;
            if (s.includes('hci') && (t.includes('hci') || t.includes('interaction'))) return true;
            if (s.includes('computer') && (t.includes('cs') || t.includes('computer'))) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      return true;
    });
  }, [scholarships, globalSearchQuery, matchMode, profile, selectedDegrees, selectedCountries, selectedSubjects]);

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

  const resetFilters = () => {
    setSelectedSubjects(DEFAULT_SUBJECTS);
    setSelectedDegrees(DEFAULT_DEGREES);
    setSelectedCountries(DEFAULT_COUNTRIES);
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
          title="Scholarship List"
          count={filteredScholarships.length}
          rangeLabel="Match"
          acceptanceRange={formatPercentRange(filteredScholarships.map((s) => calculateMatchScore(s, profile)))}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          matchMode={matchMode}
          onMatchModeChange={setMatchMode}
        />
      }
    >
      {filteredScholarships.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
            <FilterIcon size={24} />
          </div>
          <h3 className="text-base font-bold text-[#101828]">No matching scholarships found</h3>
          <p className="text-xs text-[#667085] max-w-md">
            {matchMode === 'eligible'
              ? 'None of these match your current profile. Switch to "All" to see every listing.'
              : 'Try expanding your degree, country, or subject filters to discover more scholarship opportunities.'}
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
          <ScholarshipTable rows={filteredScholarships} />
        ) : (
          <FeedGrid viewMode={viewMode}>
            {filteredScholarships.map((s) => (
              <ScholarshipRadarCard key={s.id} scholarship={s} />
            ))}
          </FeedGrid>
        )
      )}
    </FeedShell>
  );
};
