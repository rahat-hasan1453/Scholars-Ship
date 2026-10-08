'use client';

import React, { useMemo } from 'react';
import { useSessionState } from '@/hooks/useSessionState';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { FacultyLabCard } from '@/components/FacultyLabCard';
import { FeedShell } from '@/components/opportunity-feed/FeedShell';
import { FacultyTable } from '@/components/feed/FeedTables';
import { FeedGrid } from '@/components/opportunity-feed/FeedGrid';
import { OpportunityListBar, MatchMode, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import { isProfessorEligible } from '@/lib/eligibility';
import { matchScore } from '@/lib/professorDetails';
import { formatPercentRange } from '@/lib/utils';

// Figma defaults (Faculty & Research Labs, node 251:22127)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Labs carry no acceptance-rate data yet, so the Figma range is shown as-is

export const FacultyLabsFeed: React.FC = () => {
  const { professors, globalSearchQuery, profile } = useApp();

  // Kept in sessionStorage so "Back to Faculty & Research Labs" returns to the same filters
  const [selectedSubjects, setSelectedSubjects] = useSessionState<string[]>('faculty:subjects', DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useSessionState<string[]>('faculty:degrees', DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useSessionState<string[]>('faculty:countries', DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useSessionState<string[]>('faculty:funding', DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useSessionState<ViewMode>('faculty:view', 'grid');
  const [matchMode, setMatchMode] = useSessionState<MatchMode>('faculty:match', 'all');

  const filteredProfessors = useMemo(() => {
    return professors.filter((prof) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inName = prof.name?.toLowerCase().includes(q);
        const inUni = prof.university?.toLowerCase().includes(q);
        const inDept = prof.department?.toLowerCase().includes(q);
        const inLab = prof.labName?.toLowerCase().includes(q);
        const inTags = prof.researchTags?.some(t => t.toLowerCase().includes(q));
        if (!inName && !inUni && !inDept && !inLab && !inTags) return false;
      }

      // Eligible Now: the lab takes the student's degree level and its stated minimums are met
      if (matchMode === 'eligible' && !isProfessorEligible(prof, profile)) return false;

      // 2. Degree filter
      if (selectedDegrees.length > 0 && prof.degreeLevels?.length) {
        if (!prof.degreeLevels.some(d => selectedDegrees.includes(d))) return false;
      }

      // 3. Country filter
      if (selectedCountries.length > 0 && prof.country) {
        const profCountry = prof.country.toLowerCase();
        const matchesCountry = selectedCountries.some(c => {
          const sc = c.toLowerCase();
          return profCountry.includes(sc) || sc.includes(profCountry);
        });
        if (!matchesCountry) return false;
      }

      // 4. Subject filter
      if (selectedSubjects.length > 0 && prof.researchTags?.length) {
        const matchesSubject = prof.researchTags.some(tag =>
          selectedSubjects.some(sub => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('ux') && (t.includes('design') || t.includes('ux') || t.includes('hci'))) return true;
            if (s.includes('hci') && (t.includes('hci') || t.includes('interaction') || t.includes('human'))) return true;
            if (s.includes('computer') && (t.includes('cs') || t.includes('computer'))) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      return true;
    });
  }, [professors, globalSearchQuery, matchMode, profile, selectedDegrees, selectedCountries, selectedSubjects]);

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
          title="Faculty & Lab List"
          count={filteredProfessors.length}
          rangeLabel="Match"
          acceptanceRange={formatPercentRange(filteredProfessors.map((p) => matchScore(p, profile)))}
          acceptanceColor="#36b37e"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          matchMode={matchMode}
          onMatchModeChange={setMatchMode}
        />
      }
    >
      {filteredProfessors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
            <FilterIcon size={24} />
          </div>
          <h3 className="text-base font-semibold text-[#101828]">No faculty or research labs found</h3>
          <p className="text-xs text-[#667085] max-w-md">
            {matchMode === 'eligible'
              ? 'None of these match your current profile. Switch to "All" to see every listing.'
              : 'Try removing some filters to discover faculty members and funded research laboratories worldwide.'}
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
          <FacultyTable rows={filteredProfessors} />
        ) : (
          <FeedGrid viewMode={viewMode}>
            {filteredProfessors.map((p) => (
              <FacultyLabCard key={p.id} professor={p} />
            ))}
          </FeedGrid>
        )
      )}
    </FeedShell>
  );
};
