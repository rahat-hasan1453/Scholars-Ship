'use client';

import React, { useState, useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ResearchPaper } from '@/types';
import { initialResearchPapers } from '@/data/researchPapers';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { ResearchPaperCard } from '@/components/ResearchPaperCard';
import { ShortsPager } from '@/components/opportunity-feed/ShortsPager';
import { OpportunityListBar, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import { useFeedGrid } from '@/hooks/useFeedGrid';

// Figma defaults (Research Paper, node 251:27009)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Papers carry no acceptance-rate data, so the Figma range is shown as-is
const ACCEPTANCE_RANGE = '85% – 95%';

export const ResearchPapersFeed: React.FC = () => {
  const { globalSearchQuery } = useApp();
  const grid = useFeedGrid();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useState<string[]>(DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Papers have no degree/country/funding data; those filters only matter on the other tabs
  const filteredPapers = useMemo(() => {
    return initialResearchPapers.filter((paper) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inTitle = paper.title?.toLowerCase().includes(q);
        const inAbstract = paper.abstract?.toLowerCase().includes(q);
        const inVenue = paper.venue?.toLowerCase().includes(q);
        const inAuthors = paper.authors?.some(a => a.name.toLowerCase().includes(q));
        const inFields = paper.fieldsOfStudy?.some(f => f.toLowerCase().includes(q));
        const inTags = paper.tags?.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inAbstract && !inVenue && !inAuthors && !inFields && !inTags) return false;
      }

      // 2. Subject filter
      if (selectedSubjects.length > 0) {
        const paperFields = [...(paper.fieldsOfStudy || []), ...(paper.tags || [])];
        const matchesSubject = paperFields.some(field =>
          selectedSubjects.some(sub => {
            const f = field.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (f.includes(s) || s.includes(f)) return true;
            if (s.includes('ux') && (f.includes('ux') || f.includes('design') || f.includes('interaction'))) return true;
            if (s.includes('hci') && (f.includes('hci') || f.includes('human') || f.includes('interaction'))) return true;
            if (s.includes('computer') && (f.includes('cs') || f.includes('computer'))) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      return true;
    });
  }, [globalSearchQuery, selectedSubjects]);

  // Any filter/search change sends the pager back to page 1
  const resetKey = JSON.stringify([globalSearchQuery, selectedSubjects, viewMode]);

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
            count={filteredPapers.length}
            acceptanceRange={filteredPapers.length > 0 ? ACCEPTANCE_RANGE : null}
            acceptanceColor="#36b37e"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {filteredPapers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching research papers found</h3>
              <p className="text-xs text-[#667085] max-w-md">
                Try broadening your subject filter or search query to explore trending academic publications.
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
            <ShortsPager<ResearchPaper>
              key={resetKey}
              items={filteredPapers}
              cols={cols}
              rows={grid.rows}
              getKey={(p) => p.id}
              renderItem={(p) => <ResearchPaperCard paper={p} />}
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
