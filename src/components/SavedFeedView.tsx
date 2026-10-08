'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Opportunity, ResearchPaper } from '@/types';
import { useApp } from '@/context/AppContext';
import { useOpportunityBookmarks, useProfessorBookmarks } from '@/hooks/useOpportunityBookmarks';
import { useSessionState } from '@/hooks/useSessionState';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';
import { initialResearchPapers } from '@/data/researchPapers';
import { SegmentedToggle } from '@/components/feed/SegmentedToggle';
import { FeedGrid } from '@/components/opportunity-feed/FeedGrid';
import { UniversityOpportunityCard } from '@/components/opportunity-feed/UniversityOpportunityCard';
import { ScholarshipRadarCard } from '@/components/ScholarshipRadarCard';
import { FacultyLabCard } from '@/components/FacultyLabCard';
import { ResearchPaperCard } from '@/components/ResearchPaperCard';
import { ResearchPaperDetailsModal } from '@/components/research-paper-details/ResearchPaperDetailsModal';

// Saved Feed (sidebar "Others" → Saved Feed; layout from Figma Profile B2):
// everything the student bookmarked across the four feeds, filterable by type, shown with the feeds' own cards.

type Kind = 'all' | 'scholarships' | 'opportunities' | 'professors' | 'papers';

function useFetched<T>(url: string, fallback: T[]): T[] {
  const [data, setData] = useState<T[]>(fallback);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body) => !cancelled && Array.isArray(body.data) && setData(body.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);
  return data;
}

export function SavedFeedView() {
  const { scholarships, applications, professors, savedPaperIds } = useApp();
  const { bookmarks: savedOpps, toggleBookmark } = useOpportunityBookmarks();
  const { bookmarks: savedProfs } = useProfessorBookmarks();
  const opportunities = useFetched<Opportunity>('/api/opportunities', OPPORTUNITY_LISTINGS);
  const papers = useFetched<ResearchPaper>('/api/research/papers', initialResearchPapers);
  const [kind, setKind] = useSessionState<Kind>('saved:kind', 'all');
  const [openPaper, setOpenPaper] = useState<ResearchPaper | null>(null);

  // Saving a scholarship adds it to the Pipeline, so saved scholarships = the ones being tracked
  const saved = useMemo(() => {
    const trackedIds = new Set(applications.map((a) => a.scholarshipId));
    return {
      scholarships: scholarships.filter((s) => trackedIds.has(s.id)),
      opportunities: opportunities.filter((o) => savedOpps.has(o.id)),
      professors: professors.filter((p) => savedProfs.has(p.id)),
      papers: papers.filter((p) => savedPaperIds.includes(p.id)),
    };
  }, [scholarships, applications, opportunities, savedOpps, professors, savedProfs, papers, savedPaperIds]);

  const total = saved.scholarships.length + saved.opportunities.length + saved.professors.length + saved.papers.length;
  const options: { value: Kind; label: string }[] = [
    { value: 'all', label: `All ${total}` },
    { value: 'scholarships', label: `Scholarships ${saved.scholarships.length}` },
    { value: 'opportunities', label: `Opportunities ${saved.opportunities.length}` },
    { value: 'professors', label: `Faculty & Labs ${saved.professors.length}` },
    { value: 'papers', label: `Research Papers ${saved.papers.length}` },
  ];
  const show = (k: Exclude<Kind, 'all'>) => kind === 'all' || kind === k;

  const cards = [
    ...(show('scholarships') ? saved.scholarships.map((s) => <ScholarshipRadarCard key={`s-${s.id}`} scholarship={s} />) : []),
    ...(show('opportunities')
      ? saved.opportunities.map((o) => (
          <UniversityOpportunityCard key={`o-${o.id}`} opportunity={o} isBookmarked onToggleBookmark={toggleBookmark} />
        ))
      : []),
    ...(show('professors') ? saved.professors.map((p) => <FacultyLabCard key={`p-${p.id}`} professor={p} />) : []),
    ...(show('papers') ? saved.papers.map((p) => <ResearchPaperCard key={`r-${p.id}`} paper={p} onOpen={setOpenPaper} />) : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] leading-7 font-semibold text-[#101828]">
          Saved Feed <span className="text-[14px] font-normal text-[#627181]">/ {total} Items</span>
        </h1>
        <p className="text-[14px] leading-5 text-[#627181]">Everything you bookmarked across scholarships, opportunities, labs and papers.</p>
      </div>
      <SegmentedToggle label="Saved item type" value={kind} onValueChange={setKind} options={options} className="flex-wrap" />
      {cards.length > 0 ? (
        <FeedGrid viewMode="grid">{cards}</FeedGrid>
      ) : (
        <div className="rounded-[16px] border border-dashed border-[#d0d5dd] bg-white p-10 text-center">
          <p className="text-[16px] font-medium text-[#101828]">Nothing saved here yet</p>
          <p className="mt-1 text-[14px] text-[#627181]">Tap the bookmark on any card to keep it in your Saved Feed.</p>
        </div>
      )}
      <ResearchPaperDetailsModal paper={openPaper} onClose={() => setOpenPaper(null)} />
    </div>
  );
}
