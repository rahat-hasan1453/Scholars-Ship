'use client';

import React, { useState, useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Scholarship } from '@/types';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { ScholarshipRadarCard } from '@/components/ScholarshipRadarCard';
import { ShortsPager } from '@/components/opportunity-feed/ShortsPager';
import { OpportunityListBar, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import { useFeedGrid } from '@/hooks/useFeedGrid';

// Figma defaults (Scholarship Radar, node 233:8924)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Scholarships carry no acceptance-rate data yet, so the Figma range is shown as-is
const ACCEPTANCE_RANGE = '85% – 95%';

export const ScholarshipRadarFeed: React.FC = () => {
  const { scholarships, globalSearchQuery } = useApp();
  const grid = useFeedGrid();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useState<string[]>(DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
  }, [scholarships, globalSearchQuery, selectedDegrees, selectedCountries, selectedSubjects]);

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
            count={filteredScholarships.length}
            acceptanceRange={filteredScholarships.length > 0 ? ACCEPTANCE_RANGE : null}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {filteredScholarships.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching scholarships found</h3>
              <p className="text-xs text-[#667085] max-w-md">
                Try expanding your degree, country, or subject filters to discover more scholarship opportunities.
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
            <ShortsPager<Scholarship>
              key={resetKey}
              items={filteredScholarships}
              cols={cols}
              rows={grid.rows}
              getKey={(s) => s.id}
              renderItem={(s) => <ScholarshipRadarCard scholarship={s} />}
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
