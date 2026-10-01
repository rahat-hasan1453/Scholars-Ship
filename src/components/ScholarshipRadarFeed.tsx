'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { ScholarshipRadarCard } from '@/components/ScholarshipRadarCard';
import { LayoutGrid, List } from 'lucide-react';
import { FilterIcon } from 'lucide-react';

export const ScholarshipRadarFeed: React.FC = () => {
  const { scholarships, globalSearchQuery } = useApp();

  // Multi-select Filter States matching Figma defaults
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'UX & Product Design', 
    'HCI', 
    'Computer Science', 
    'Artificial Intelligence'
  ]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(['Masters', 'PhD']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    'USA', 
    'Germany', 
    'United Kingdom', 
    'Canada'
  ]);
  const [selectedFunding, setSelectedFunding] = useState<string[]>([
    'Safe Regional', 
    'Tuition Waiver', 
    'Full Funding'
  ]);

  // View Mode: Grid or List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtered Scholarships
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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      {/* Reusable Unified Header (Node 122:3164) */}
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

      {/* Body Area with white background matching Figma */}
      <div className="bg-white flex-1">
        <div className="p-5 max-w-[1172px] mx-auto w-full space-y-5">
          {/* Sub-bar matching Figma Frame 2147226741 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <h2 className="text-base font-semibold text-[#101828] leading-tight">
                  Opportunity List
                </h2>
                <span className="text-xs font-normal text-[#919EAB]">
                  / {filteredScholarships.length} Items
                </span>
              </div>
              <p className="text-xs text-[#90A1B9] mt-0.5">
                Safe-Bet Universities with Guaranteed Funding &amp; Assistantships
              </p>
            </div>

            {/* Right: Acceptance Rate + Toggle Switcher */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#009966] select-none">
                ✓ 85% – 95% Acceptance Rate
              </span>

              <div className="bg-white border border-[#D0D5DD] rounded-[20px] p-0.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-2xl transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'text-[#7050E6] bg-[#F4F3FE] shadow-xs'
                      : 'text-[#667085] hover:text-[#475467]'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-2xl transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'text-[#7050E6] bg-[#F4F3FE] shadow-xs'
                      : 'text-[#667085] hover:text-[#475467]'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredScholarships.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center mx-auto">
                <FilterIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching scholarships found</h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto">
                Try expanding your degree, country, or subject filters to discover more scholarship opportunities.
              </p>
              <button
                onClick={() => {
                  setSelectedSubjects(['UX & Product Design', 'HCI']);
                  setSelectedDegrees(['Masters', 'PhD']);
                  setSelectedCountries(['USA', 'Germany']);
                  setSelectedFunding(['Safe Regional']);
                }}
                className="px-4 py-2 bg-[#7050E6] text-white text-xs font-semibold rounded-full hover:bg-[#5D3FD3] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            }>
              {filteredScholarships.map((sch) => (
                <ScholarshipRadarCard key={sch.id} scholarship={sch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
