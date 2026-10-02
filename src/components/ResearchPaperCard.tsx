'use client';

import React, { useState } from 'react';
import { ResearchPaper } from '@/types';
import { useApp } from '@/context/AppContext';
import { FEED_CARD_HEIGHT } from '@/hooks/useFeedGrid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';

interface ResearchPaperCardProps {
  paper: ResearchPaper;
}

// Roughly three lines of the 14px abstract at card width, as in Figma
const ABSTRACT_PREVIEW_CHARS = 140;

function MaskIcon({ src, size, color }: { src: string; size: number; color: string }) {
  return (
    <span
      aria-hidden
      className="block shrink-0"
      style={{ width: size, height: size, backgroundColor: color, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

// Figma: "Research Paper" card (node 251:23294)
export const ResearchPaperCard: React.FC<ResearchPaperCardProps> = ({ paper }) => {
  const { toggleSavePaper, isPaperSaved } = useApp();
  const [abstractOpen, setAbstractOpen] = useState(false);

  const isSaved = isPaperSaved(paper.id);
  const authorsText = paper.authors.map((a) => a.name).join(' • ');
  const scholarUrl =
    paper.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`;
  const pdfUrl = paper.pdfUrl || paper.semanticScholarUrl || scholarUrl;
  const preview =
    paper.abstract.length > ABSTRACT_PREVIEW_CHARS
      ? `${paper.abstract.slice(0, ABSTRACT_PREVIEW_CHARS).trimEnd()}...`
      : paper.abstract;

  const chipClass =
    'flex items-center h-6 max-w-full px-2 rounded-full bg-[#f0f3f4] font-[family-name:var(--font-figtree)] text-[12px] leading-[18px] font-medium italic text-[#212b36] whitespace-nowrap';

  return (
    <article
      className="flex flex-col w-full min-w-0 rounded-[16px] border-[0.5px] border-[#f1f1f1] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d9d0fa] hover:shadow-[0_10px_24px_-12px_rgba(113,80,231,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ height: FEED_CARD_HEIGHT }}
    >
      {/* Title */}
      <div className="px-4 py-3 bg-white shrink-0">
        <h3 className="line-clamp-2 text-[16px] leading-[24px] font-semibold text-[#101828]" title={paper.title}>
          {paper.title}
        </h3>
      </div>

      {/* Details */}
      <div className="flex flex-1 min-h-0 flex-col gap-2 px-4 pb-3 bg-white overflow-hidden">
        <p className="text-[14px] leading-[18px] text-[#475467] break-words">
          {preview}{' '}
          <button
            type="button"
            onClick={() => setAbstractOpen(true)}
            className="inline text-[12px] leading-none font-semibold text-[#7050e6] hover:underline cursor-pointer"
          >
            Read full abstract
          </button>
        </p>

        <div className="w-full p-3 rounded-[4px] bg-[#fafafa] shrink-0">
          <dl className="flex items-start gap-[6px] break-words text-[14px] leading-[20px]">
            <dt className="w-[95px] shrink-0 font-medium text-[#627181]">👩‍🏫 Authors</dt>
            <dd className="flex-1 min-w-0 line-clamp-2 italic font-medium text-[#101828]" title={authorsText}>
              {authorsText}
            </dd>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className="flex items-center gap-1 h-6 px-2 shrink-0 rounded-full bg-[#fffae5] whitespace-nowrap">
            <span aria-hidden className="text-[11px] leading-[14.667px] font-bold">📊</span>
            <span className="text-[12px] leading-[16px] font-medium italic tracking-[-0.192px] text-[#b76e00]">
              {paper.citationCount.toLocaleString('en-US')} Citations
            </span>
          </span>
          <img src="/opportunity-feed/divider.svg" alt="" width={1} height={15.5} className="shrink-0" />
          {paper.fieldsOfStudy.slice(0, 3).map((field) => (
            <span key={field} className={chipClass} title={field}>
              <span className="truncate">#{field}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-t-[0.5px] border-[#f1f1f1] shrink-0">
        <button
          type="button"
          onClick={() => toggleSavePaper(paper.id)}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved papers' : 'Save paper'}
          className={`flex items-center justify-center size-8 shrink-0 rounded-[6px] cursor-pointer transition-colors ${
            isSaved ? 'bg-[#ede9fc]' : 'bg-[#fafafa] hover:bg-[#f4f2fd]'
          }`}
        >
          <MaskIcon src="/research-papers/bookmark.svg" size={20} color={isSaved ? '#7150e7' : '#627181'} />
        </button>
        <img src="/opportunity-feed/divider.svg" alt="" width={1} height={15.5} className="shrink-0" />
        <div className="flex flex-1 min-w-0 gap-4">
          <a
            href={scholarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors"
          >
            <span className="truncate">Google Scholar</span>
            <img src="/opportunity-feed/external-link.svg" alt="" width={12} height={12} className="shrink-0" />
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] bg-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#fafafa] hover:bg-[#5f3fd6] transition-colors"
          >
            <span className="truncate">Download PDF</span>
            <img src="/research-papers/download.svg" alt="" width={12} height={12} className="shrink-0" />
          </a>
        </div>
      </div>

      <Dialog open={abstractOpen} onOpenChange={setAbstractOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] leading-[24px] font-semibold text-[#101828]">{paper.title}</DialogTitle>
            <DialogDescription className="text-[12px] leading-[16.5px] text-[#627181]">
              {[paper.venue, paper.year].filter(Boolean).join(' · ')}
            </DialogDescription>
          </DialogHeader>
          <p className="text-[14px] leading-[20px] italic font-medium text-[#101828]">{authorsText}</p>
          <p className="max-h-[50vh] overflow-y-auto text-[14px] leading-[20px] text-[#475467]">{paper.abstract}</p>
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-[#7050e6] hover:underline"
            >
              DOI: {paper.doi}
            </a>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
};
