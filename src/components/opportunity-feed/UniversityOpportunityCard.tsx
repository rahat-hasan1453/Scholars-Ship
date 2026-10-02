'use client';

import React from 'react';
import type { UniversityProgram } from '@/data/universityPrograms';
import { FEED_CARD_HEIGHT } from '@/hooks/useFeedGrid';

interface UniversityOpportunityCardProps {
  program: UniversityProgram;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

// Figma: "Opportunity card" (node 212:6186)
export const UniversityOpportunityCard: React.FC<UniversityOpportunityCardProps> = ({
  program,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <article
      className="flex flex-col w-full min-w-0 rounded-[16px] border-[0.5px] border-[#f1f1f1] overflow-hidden"
      style={{ height: FEED_CARD_HEIGHT }}
    >
      {/* Title row */}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-white border-b-[0.5px] border-[#f1f1f1] overflow-hidden shrink-0">
        <div aria-hidden className="absolute -right-[0.5px] -top-[0.5px] h-[69px] w-[151px] pointer-events-none overflow-hidden">
          <img
            src="/opportunity-feed/card-deco.png"
            alt=""
            className="absolute max-w-none left-[-0.36%] top-[1.45%] w-[100.73%] h-[98.55%]"
          />
        </div>
        <div className="relative flex flex-1 min-w-0 items-center justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="truncate text-[16px] leading-[24px] font-semibold text-[#101828]">
              {program.university}
            </h3>
            <p className="truncate text-[12px] leading-[16px] text-[#627181]">{program.subjects}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <img
              src={`/flags/${program.countryCode}.svg`}
              alt=""
              width={20}
              height={20}
              className="size-5 rounded-full"
            />
            <span className="text-[12px] leading-[18px] italic font-medium text-[#627181]">
              {program.countryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 min-h-0 flex-col gap-[10px] px-4 py-3 bg-white overflow-hidden">
        <div className="w-full p-3 rounded-[4px] bg-[#fafafa]">
          <dl className="flex flex-col gap-1 break-words">
            <div className="flex items-start gap-[6px]">
              <dt className="w-[100px] shrink-0 text-[14px] leading-[20px] font-medium text-[#101828]">💰 Financial:</dt>
              <dd className="flex-1 min-w-0 text-[14px] leading-[20px] italic font-medium text-[#627181]">
                {program.financial}
              </dd>
            </div>
            <div className="flex items-start gap-[6px] text-[14px]">
              <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#101828]">🎓 Admission:</dt>
              <dd className="flex-1 min-w-0 leading-[18px] text-[#627181]">{program.admission}</dd>
            </div>
            <div className="flex items-start gap-[6px] text-[14px]">
              <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#101828]">🏡 Living:</dt>
              <dd className="flex-1 min-w-0 leading-[18px] text-[#627181]">{program.living}</dd>
            </div>
          </dl>
        </div>
        <div className="flex items-center h-6 w-full px-2 rounded-[4px] border-l-2 border-[#1b806a] bg-[#ebfdef] shrink-0">
          <p className="truncate text-[14px] leading-[18px] text-[#1b806a]">
            Rank {program.rankRange} • Acceptance Rate ({program.acceptanceRate}%)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-t-[0.5px] border-[#f1f1f1] shrink-0">
        <button
          type="button"
          onClick={() => onToggleBookmark(program.id)}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? `Remove ${program.university} from saved` : `Save ${program.university}`}
          className="flex items-center justify-center size-8 shrink-0 rounded-[6px] bg-[#fafafa] cursor-pointer hover:bg-[#f1f1f1] transition-colors"
        >
          {isBookmarked ? (
            <span
              aria-hidden
              className="size-5 bg-[#7150e7]"
              style={{ mask: 'url(/opportunity-feed/bookmark.svg) center / contain no-repeat' }}
            />
          ) : (
            <img src="/opportunity-feed/bookmark.svg" alt="" width={20} height={20} />
          )}
        </button>
        <img src="/opportunity-feed/divider.svg" alt="" width={1} height={15.5} className="shrink-0" />
        <div className="flex flex-1 min-w-0 gap-4">
          <a
            href={program.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors"
          >
            <span className="truncate">Official Link</span>
            <img src="/opportunity-feed/external-link.svg" alt="" width={16} height={16} className="shrink-0" />
          </a>
          <button
            type="button"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] bg-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#fafafa] cursor-pointer hover:bg-[#5f3fd6] transition-colors"
          >
            <span className="truncate">{program.ctaLabel}</span>
            <img src="/opportunity-feed/arrow-right.svg" alt="" width={20} height={20} className="shrink-0" />
          </button>
        </div>
      </div>
    </article>
  );
};
