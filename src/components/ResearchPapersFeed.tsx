'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { FilterIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useSessionState } from '@/hooks/useSessionState';
import { ResearchPaper } from '@/types';
import { UnifiedDiscoveryHeader } from '@/components/layout/UnifiedDiscoveryHeader';
import { ResearchPaperCard } from '@/components/ResearchPaperCard';
import { ResearchPaperDetailsModal } from '@/components/research-paper-details/ResearchPaperDetailsModal';
import { FeedShell } from '@/components/opportunity-feed/FeedShell';
import { ResearchPaperTable } from '@/components/feed/FeedTables';
import { FeedGrid, FeedSkeleton } from '@/components/opportunity-feed/FeedGrid';
import { OpportunityListBar, MatchMode, ViewMode } from '@/components/opportunity-feed/OpportunityListBar';
import { isPaperEligible } from '@/lib/eligibility';
import { relevance } from '@/lib/researchPapers';
import { formatPercentRange } from '@/lib/utils';

// Figma defaults (Research Paper, node 251:27009)
const DEFAULT_SUBJECTS = ['UX & Product Design', 'HCI', 'Computer Science', 'Artificial Intelligence'];
const DEFAULT_DEGREES = ['Masters', 'PhD'];
const DEFAULT_COUNTRIES = ['USA', 'Germany', 'Norway', 'United Kingdom', 'Canada'];
const DEFAULT_FUNDING = ['Safe Regional'];

// Papers carry no acceptance-rate data, so the Figma range is shown as-is

export const ResearchPapersFeed: React.FC = () => {
  const { globalSearchQuery, profile } = useApp();

  const [selectedSubjects, setSelectedSubjects] = useSessionState<string[]>('research:subjects', DEFAULT_SUBJECTS);
  const [selectedDegrees, setSelectedDegrees] = useSessionState<string[]>('research:degrees', DEFAULT_DEGREES);
  const [selectedCountries, setSelectedCountries] = useSessionState<string[]>('research:countries', DEFAULT_COUNTRIES);
  const [selectedFunding, setSelectedFunding] = useSessionState<string[]>('research:funding', DEFAULT_FUNDING);
  const [viewMode, setViewMode] = useSessionState<ViewMode>('research:view', 'grid');
  const [matchMode, setMatchMode] = useSessionState<MatchMode>('research:match', 'all');
  const [papers, setPapers] = useState<ResearchPaper[] | null>(null);

  // Open paper lives in the URL (?tab=research&paper=<id>) so it can be shared and Back closes it.
  // Read after hydration, like page.tsx does for ?tab= (BUG-18).
  const [openPaperId, setOpenPaperId] = useState<string | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get('paper');
      setOpenPaperId(id);
      if (!id) pushedRef.current = false;
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const urlWithPaper = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'research');
    if (id) params.set('paper', id);
    else params.delete('paper');
    return `${window.location.pathname}?${params}`;
  };

  const openPaper = useCallback((paper: ResearchPaper) => {
    window.history.pushState(null, '', urlWithPaper(paper.id));
    pushedRef.current = true;
    setOpenPaperId(paper.id);
  }, []);

  const closePaper = useCallback(() => {
    setOpenPaperId(null);
    // Opened from a card: step back so Back doesn't reopen it. Opened from a shared link: just drop the param.
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, '', urlWithPaper(null));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/research/papers')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body) => !cancelled && setPapers(body.data))
      .catch((error) => {
        console.error('Failed to load research papers', error);
        if (!cancelled) setPapers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Papers have no degree/country/funding data; those filters only matter on the other tabs
  const filteredPapers = useMemo(() => {
    return (papers ?? []).filter((paper) => {
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

      // Eligible Now: papers have no admission rules, so this keeps the ones relevant to the student's interests
      if (matchMode === 'eligible' && !isPaperEligible(paper, profile)) return false;

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
  }, [papers, globalSearchQuery, matchMode, profile, selectedSubjects]);

  // Any filter, search or mode change scrolls the cards back to the top
  const scrollResetKey = JSON.stringify([globalSearchQuery, selectedSubjects, matchMode, viewMode]);

  const resetFilters = () => {
    setSelectedSubjects(DEFAULT_SUBJECTS);
    setSelectedDegrees(DEFAULT_DEGREES);
    setSelectedCountries(DEFAULT_COUNTRIES);
    setSelectedFunding(DEFAULT_FUNDING);
  };

  // Search the full list so a deep link works even when filters hide that paper
  const openPaperData = useMemo(
    () => (openPaperId ? papers?.find((p) => p.id === openPaperId) ?? null : null),
    [papers, openPaperId],
  );

  // Unknown id in the URL: drop it once the list has loaded
  useEffect(() => {
    if (papers && openPaperId && !openPaperData) {
      window.history.replaceState(null, '', urlWithPaper(null));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the URL we just changed
      setOpenPaperId(null);
    }
  }, [papers, openPaperId, openPaperData]);

  return (
    <>
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
            title="Research Paper List"
            count={filteredPapers.length}
            rangeLabel="Match"
            acceptanceRange={formatPercentRange(
              filteredPapers.map((p) => relevance(p, profile)).filter((v): v is number => v !== null),
            )}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            matchMode={matchMode}
            onMatchModeChange={setMatchMode}
          />
        }
      >
        {papers === null ? (
          <FeedSkeleton viewMode={viewMode} label="Loading research papers" />
        ) : filteredPapers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center">
              <FilterIcon size={24} />
            </div>
            <h3 className="text-base font-semibold text-[#101828]">No matching research papers found</h3>
            <p className="text-xs text-[#667085] max-w-md">
              {matchMode === 'eligible'
                ? 'None of these match your current interests. Switch to "All" to see every paper.'
                : 'Try broadening your subject filter or search query to explore trending academic publications.'}
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
            <ResearchPaperTable rows={filteredPapers} onOpen={openPaper} />
          ) : (
            <FeedGrid viewMode={viewMode}>
              {filteredPapers.map((p) => (
                <ResearchPaperCard key={p.id} paper={p} onOpen={openPaper} />
              ))}
            </FeedGrid>
          )
        )}
      </FeedShell>

      <ResearchPaperDetailsModal paper={openPaperData} onClose={closePaper} />
    </>
  );
};
