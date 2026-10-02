'use client';

import React from 'react';
import { CardHeader } from '@/components/opportunity-feed/CardHeader';
import { Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateMatchScore } from '@/lib/utils';
import { COUNTRY_FLAGS } from '@/components/layout/UnifiedDiscoveryHeader';
import { FEED_CARD_HEIGHT } from '@/hooks/useFeedGrid';

interface ScholarshipRadarCardProps {
  scholarship: Scholarship;
  onOpenDetail?: (sch: Scholarship) => void;
}

// Figma: "Scholarship Radar" card (node 239:10612)
export const ScholarshipRadarCard: React.FC<ScholarshipRadarCardProps> = ({
  scholarship,
  onOpenDetail,
}) => {
  const { profile, saveScholarshipToTracker, applications, setSelectedScholarship } = useApp();

  const isTracked = applications.some((app) => app.scholarshipId === scholarship.id);
  const matchScore = calculateMatchScore(scholarship, profile) || 85;
  const country = scholarship.countries?.[0] || 'Global';
  const flagSrc = COUNTRY_FLAGS[country];
  const countryLabel = country === 'United Kingdom' ? 'UK' : country;
  const degree = scholarship.degreeLevels?.[0] || 'Masters';
  const fundingLabel = scholarship.fundingType === 'FULL' ? 'Fully Funded' : 'Partial Funding';

  const handleExplore = () => {
    if (onOpenDetail) onOpenDetail(scholarship);
    else setSelectedScholarship(scholarship);
  };

  const chipClass =
    'flex items-center h-6 px-2 rounded-full bg-[#f0f3f4] font-[family-name:var(--font-figtree)] text-[12px] leading-[18px] font-medium italic text-[#212b36] whitespace-nowrap';

  return (
    <article
      className="flex flex-col w-full min-w-0 rounded-[16px] border-[0.5px] border-[#f1f1f1] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d9d0fa] hover:shadow-[0_10px_24px_-12px_rgba(113,80,231,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ height: FEED_CARD_HEIGHT }}
    >
      <CardHeader
        title={scholarship.title}
        subtitle={scholarship.provider}
        flagSrc={flagSrc}
        countryLabel={countryLabel}
      />

      {/* Details */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 py-3 bg-white overflow-hidden">
        <div className="w-full p-3 rounded-[4px] bg-[#fafafa]">
          <dl className="flex flex-col gap-1 break-words text-[14px]">
            <div className="flex items-start gap-[6px]">
              <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#627181]">💰 Financial:</dt>
              <dd className="flex-1 min-w-0 line-clamp-2 leading-[20px] italic font-medium text-[#101828]">
                {scholarship.fundingAmount}
              </dd>
            </div>
            <div className="flex items-start gap-[6px]">
              <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#627181]">🎓 Admission:</dt>
              <dd className="flex-1 min-w-0 line-clamp-2 leading-[18px] text-[#101828]">
                {scholarship.admissionSummary || 'See official requirements'}
              </dd>
            </div>
            <div className="flex items-start gap-[6px]">
              <dt className="w-[100px] shrink-0 leading-[20px] font-medium text-[#627181]">🏡 Living:</dt>
              <dd className="flex-1 min-w-0 truncate leading-[18px] text-[#101828]">
                {scholarship.livingCost || 'Not specified'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className="flex items-center h-6 px-[14px] rounded-full bg-[#ebfdef] text-[12px] leading-4 font-medium italic tracking-[-0.192px] text-[#1b806a] whitespace-nowrap">
            {matchScore}% Match
          </span>
          <img src="/opportunity-feed/divider.svg" alt="" width={1} height={15.5} className="shrink-0" />
          <span className={chipClass}>{degree}</span>
          <span className={chipClass}>$ {fundingLabel}</span>
          <span className={chipClass}>
            <span className="block w-[79px] truncate">#{scholarship.provider}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-t-[0.5px] border-[#f1f1f1] shrink-0">
        <button
          type="button"
          onClick={() => saveScholarshipToTracker(scholarship)}
          aria-pressed={isTracked}
          aria-label={isTracked ? `${scholarship.title} is saved` : `Save ${scholarship.title}`}
          className="flex items-center justify-center size-8 shrink-0 rounded-[6px] bg-[#fafafa] cursor-pointer hover:bg-[#f1f1f1] transition-colors"
        >
          {isTracked ? (
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
            href={scholarship.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors"
          >
            <span className="truncate">Official Link</span>
            <img src="/opportunity-feed/external-link.svg" alt="" width={12} height={12} className="shrink-0" />
          </a>
          <button
            type="button"
            onClick={handleExplore}
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] bg-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#fafafa] cursor-pointer hover:bg-[#5f3fd6] transition-colors"
          >
            <span className="truncate">Explore More</span>
            <img src="/opportunity-feed/arrow-right.svg" alt="" width={12} height={12} className="shrink-0" />
          </button>
        </div>
      </div>
    </article>
  );
};
