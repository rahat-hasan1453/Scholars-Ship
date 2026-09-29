'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { OpportunityCard } from '@/components/OpportunityCard';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { LayoutGrid, List } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FilterIcon } from '@hugeicons/core-free-icons';

export const OpportunitiesFeed: React.FC = () => {
  const { 
    opportunities, 
    globalSearchQuery,
  } = useApp();

  // Multi-select Filter States initialized from Figma Node 122:3164 defaults
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

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inTitle = opp.title?.toLowerCase().includes(q);
        const inInst = opp.institution?.toLowerCase().includes(q);
        const inAuthor = opp.authorName?.toLowerCase().includes(q);
        const inTags = opp.fieldTags?.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inInst && !inAuthor && !inTags) return false;
      }

      // 2. Degree filter
      if (selectedDegrees.length > 0) {
        const matchesDegree = opp.degrees?.some(d => selectedDegrees.includes(d));
        if (!matchesDegree) return false;
      }

      // 3. Country filter
      if (selectedCountries.length > 0) {
        const oppCountry = opp.country?.toLowerCase() || '';
        const matchesCountry = selectedCountries.some(c => {
          const sc = c.toLowerCase();
          return oppCountry.includes(sc) || sc.includes(oppCountry);
        });
        if (!matchesCountry) return false;
      }

      // 4. Subject filter
      if (selectedSubjects.length > 0) {
        const matchesSubject = opp.fieldTags?.some(tag => 
          selectedSubjects.some(sub => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('ux') && (t.includes('design') || t.includes('ux'))) return true;
            if (s.includes('hci') && (t.includes('hci') || t.includes('interaction'))) return true;
            if (s.includes('computer') && t.includes('cs')) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      return true;
    });
  }, [opportunities, globalSearchQuery, selectedDegrees, selectedCountries, selectedSubjects]);

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
                  / {filteredOpportunities.length} Items
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
          {filteredOpportunities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center mx-auto">
                <HugeiconsIcon icon={FilterIcon} size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching opportunities found</h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto">
                Try removing some subject or country filters to view more scholarship and funding opportunities.
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
                Reset to Default Filters
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            }>
              {filteredOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
