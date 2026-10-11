'use client';

import React from 'react';
import Link from 'next/link';
import { CardHeader } from '@/components/opportunity-feed/CardHeader';
import type { Opportunity } from '@/types';
import { INSTITUTION_NOT_STATED, countryFlagSrc, countryShortLabel, sourceLabel } from '@/lib/opportunityDetails';
import { formatDeadline } from '@/lib/scholarshipDetails';
import { FEED_CARD_HEIGHT } from '@/components/opportunity-feed/FeedGrid';

interface UniversityOpportunityCardProps {
  opportunity: Opportunity;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

// Figma: "Opportunity card" (node 212:6186)
export const UniversityOpportunityCard: React.FC<UniversityOpportunityCardProps> = ({
  opportunity: o,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <article
      className="flex flex-col w-full min-w-0 rounded-[16px] border-[0.5px] border-[#f1f1f1] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d9d0fa] hover:shadow-[0_10px_24px_-12px_rgba(113,80,231,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ height: FEED_CARD_HEIGHT }}
    >
      <CardHeader
        title={o.institution === INSTITUTION_NOT_STATED ? o.title : o.institution}
        subtitle={o.fieldTags.slice(0, 2).join(', ') || o.degreeLevels.join(' & ')}
        flagSrc={countryFlagSrc(o.country) ?? undefined}
        countryLabel={countryShortLabel(o.country)}
      />

      {/* Details */}
      <div className="flex flex-1 min-h-0 flex-col gap-[10px] px-4 py-3 bg-white overflow-hidden">
        <div className="w-full p-3 rounded-[4px] bg-[#fafafa]">
          <dl className="flex flex-col gap-1 break-words">
            <div className="flex items-start gap-[6px]">
              <dt className="w-[100px] shrink-0 text-[14px] leading-[20px] font-medium text-[#101828]">💰 Financial:</dt>
              <dd className="flex-1 min-w-0 text-[14px] leading-[20px] italic font-medium text-[#627181]">
                {o.funding}
              </dd>
            </div>
            {o.admission ? (
              <div className="flex items-start gap-[6px] text-[14px]">
                <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#101828]">🎓 Admission:</dt>
                <dd className="flex-1 min-w-0 leading-[18px] text-[#627181]">{o.admission}</dd>
              </div>
            ) : (
              <div className="flex items-start gap-[6px] text-[14px]">
                <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#101828]">🎓 Position:</dt>
                <dd className="flex-1 min-w-0 leading-[18px] text-[#627181] line-clamp-2">{o.title}</dd>
              </div>
            )}
            {o.livingCost && (
              <div className="flex items-start gap-[6px] text-[14px]">
                <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#101828]">🏡 Living:</dt>
                <dd className="flex-1 min-w-0 leading-[18px] text-[#627181]">{o.livingCost}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="flex items-center h-6 w-full px-2 rounded-[4px] border-l-2 border-[#1b806a] bg-[#ebfdef] shrink-0">
          <p className="truncate text-[14px] leading-[18px] text-[#1b806a]">
            {o.rankRange && o.acceptanceRate !== undefined
              ? `Rank ${o.rankRange} • Acceptance Rate (${o.acceptanceRate}%)`
              : o.deadline
                ? `Apply by ${formatDeadline(o.deadline)}`
                : o.source === 'university'
                  ? `Programme listing • Checked ${formatDeadline(o.postedAt)}`
                  : `Posted ${formatDeadline(o.postedAt)} on ${sourceLabel(o.source)}`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-t-[0.5px] border-[#f1f1f1] shrink-0">
        <button
          type="button"
          onClick={() => onToggleBookmark(o.id)}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? `Remove ${o.institution} from saved` : `Save ${o.institution}`}
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
            href={o.officialUrl ?? o.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors"
          >
            <span className="truncate">Official Link</span>
            <img src="/opportunity-feed/external-link.svg" alt="" width={16} height={16} className="shrink-0" />
          </a>
          <Link
            href={`/opportunities/${o.id}`}
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] bg-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#fafafa] cursor-pointer hover:bg-[#5f3fd6] transition-colors"
          >
            <span className="truncate">Explore More</span>
            <img src="/opportunity-feed/arrow-right.svg" alt="" width={20} height={20} className="shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
};
