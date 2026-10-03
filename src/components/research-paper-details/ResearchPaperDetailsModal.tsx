'use client';

import React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Dialog, DialogClose, DialogContent } from '@/components/shadcn/dialog';
import {
  CheckList,
  ChipList,
  DetailHeader,
  DetailSection,
  DetailText,
  ExpandableText,
  FactsGrid,
  TopBarIcon,
  ValueRows,
  topBarButtonClass,
  useShareLink,
  type ChipTone,
  type Fact,
} from '@/components/details/DetailParts';
import { PaperLinks } from '@/components/ResearchPaperCard';
import { useApp } from '@/context/AppContext';
import type { ResearchPaper } from '@/types';
import {
  authorsSummary,
  leadInstitution,
  metaLine,
  publishedLabel,
  relevance,
  topicChips,
  venueLine,
  whyItMatters,
} from '@/lib/researchPapers';

interface ResearchPaperDetailsModalProps {
  paper: ResearchPaper | null;
  onClose: () => void;
}

/** Link the Share button copies: the list with this paper open */
const shareUrl = (id: string) => `${window.location.origin}/?tab=research&paper=${encodeURIComponent(id)}`;

// Figma: "Research Paper — Details modal" (node 261:3390) over the Research Paper list (261:3308)
export function ResearchPaperDetailsModal({ paper, onClose }: ResearchPaperDetailsModalProps) {
  return (
    <Dialog open={!!paper} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        // Focus the modal itself, not the Save button, so no focus ring shows until the user tabs
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        overlayClassName="bg-[#0f1729]/45"
        className="flex flex-col gap-6 w-[calc(100%-2rem)] max-w-[1008px] sm:max-w-[1008px] max-h-[calc(100dvh-2rem)] overflow-hidden px-4 pt-6 pb-8 sm:px-8 rounded-[24px] border-0 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,41,0.18)]"
      >
        {paper && <PaperDetails paper={paper} />}
      </DialogContent>
    </Dialog>
  );
}

function PaperDetails({ paper }: { paper: ResearchPaper }) {
  const { profile: userProfile, toggleSavePaper, isPaperSaved } = useApp();
  const { copied, share } = useShareLink();
  const saved = isPaperSaved(paper.id);

  const match = relevance(paper, userProfile);
  const chips: { label: string; tone?: ChipTone }[] = [
    ...(match !== null ? [{ label: `${match}% Relevance`, tone: 'success' as const }] : []),
    ...(paper.peerReviewed ? [{ label: 'Peer-reviewed' }] : []),
    { label: `📊 ${paper.citationCount.toLocaleString('en-US')} Citations` },
    ...(paper.isOpenAccess ? [{ label: '🔓 Open Access', tone: 'warning' as const }] : []),
  ];

  const published = publishedLabel(paper);
  const institution = leadInstitution(paper);
  const authors = authorsSummary(paper);
  const facts: Fact[] = [
    authors && { icon: '👥', label: 'Authors', value: authors },
    { icon: '🏛', label: 'Venue', value: paper.venueShort ?? paper.venue },
    institution && { icon: '🏫', label: 'Institution', value: institution },
    published && { icon: '📅', label: 'Published', value: published },
    paper.doi && { icon: '🔗', label: 'DOI', value: paper.doi, href: `https://doi.org/${paper.doi}` },
    { icon: '📊', label: 'Citations', value: paper.citationCount.toLocaleString('en-US') },
  ].filter((f): f is Fact => !!f && !!f.value);

  const authorRows = [
    ...paper.authors.map((a) => ({
      label: a.name,
      value: a.institution ?? '',
      href: a.professorId ? `/professors/${a.professorId}` : undefined,
    })),
    ...(paper.funding ? [{ label: 'Funded by', value: paper.funding }] : []),
  ];
  const why = whyItMatters(paper, userProfile);

  return (
    <>
      {/* Top bar stays put; only the paper body scrolls (Figma 270:3942) */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <p className="text-[14px] leading-5 font-medium text-[#64748b]">📄 Research Paper</p>
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => toggleSavePaper(paper.id)} aria-pressed={saved} className={topBarButtonClass}>
            {saved ? 'Saved' : 'Save'}
            <TopBarIcon src="/details/bookmark.svg" width={11.6667} height={14.3333} />
          </button>
          <button type="button" onClick={() => share(shareUrl(paper.id))} className={topBarButtonClass}>
            <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
            <TopBarIcon src="/details/share.svg" width={16} height={16} />
          </button>
          <DialogClose className={topBarButtonClass}>
            Close
            <TopBarIcon src="/details/close.svg" width={16} height={16} />
          </DialogClose>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 min-w-0">
        <DetailHeader
          eyebrow={venueLine(paper)}
          meta={metaLine(paper)}
          title={paper.title}
          chips={chips}
          wrapTitle={(h) => <DialogPrimitive.Title asChild>{h}</DialogPrimitive.Title>}
        />
        <FactsGrid facts={facts} />

        {paper.fieldsOfStudy.length + paper.tags.length > 0 && (
          <DetailSection label="Topics">
            <ChipList items={topicChips(paper)} />
          </DetailSection>
        )}
        <DetailSection label="Abstract">
          <ExpandableText text={paper.abstract} />
        </DetailSection>
        {authorRows.length > 0 && (
          <DetailSection label="Authors">
            <ValueRows rows={authorRows} />
          </DetailSection>
        )}
        {paper.keyFindings?.length ? (
          <DetailSection label="Key Findings">
            <CheckList
              srLabels={['Finding:', 'Caveat:']}
              compactValues
              rows={paper.keyFindings.map((f) => ({ label: f.label, requirement: f.text, you: f.value, met: f.met }))}
            />
          </DetailSection>
        ) : null}
        {why && (
          <DetailSection label="Why It Matters">
            <DetailText>{why}</DetailText>
          </DetailSection>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex justify-end pt-5 border-t border-[#e4e7ec]">
        <div className="flex w-full sm:w-[416px]">
          <PaperLinks paper={paper} />
        </div>
      </div>
    </>
  );
}
