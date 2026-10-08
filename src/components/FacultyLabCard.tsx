'use client';

import React from 'react';
import Link from 'next/link';
import { Professor } from '@/types';
import { FEED_CARD_HEIGHT } from '@/components/opportunity-feed/FeedGrid';

interface FacultyLabCardProps {
  professor: Professor;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

// Figma: "Faculty or Researchlab" card (node 251:22151)
export const FacultyLabCard: React.FC<FacultyLabCardProps> = ({ professor }) => {
  const searchName = encodeURIComponent(`${professor.name} ${professor.university}`);
  const linkedInUrl =
    professor.linkedInUrl || `https://www.linkedin.com/search/results/all/?keywords=${searchName}`;
  const scholarUrl = professor.googleScholar || `https://scholar.google.com/scholar?q=${searchName}`;
  const officialUrl = professor.labWebsite || professor.googleScholar || `https://www.google.com/search?q=${searchName}`;

  const degree = professor.degreeLevels?.[0] || 'Masters';
  const fundingLabel = professor.fundingType === 'PARTIAL' ? 'Partial Funding' : 'Fully Funded';
  const terms = professor.acceptingTerms?.length ? professor.acceptingTerms.join(', ') : 'Not specified';

  const chipClass =
    'flex items-center h-6 px-2 rounded-full bg-[#f0f3f4] font-[family-name:var(--font-figtree)] text-[12px] leading-[18px] font-medium italic text-[#212b36] whitespace-nowrap';

  return (
    <article
      className="flex flex-col w-full min-w-0 rounded-[16px] border-[0.5px] border-[#f1f1f1] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d9d0fa] hover:shadow-[0_10px_24px_-12px_rgba(113,80,231,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ height: FEED_CARD_HEIGHT }}
    >
      {/* Header: professor + open-positions chip */}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-white border-b-[0.5px] border-[#f1f1f1] overflow-hidden shrink-0">
        <div aria-hidden className="absolute -right-[3.5px] -top-[0.5px] h-[83px] w-[151px] pointer-events-none overflow-hidden">
          <img
            src="/opportunity-feed/card-deco.png"
            alt=""
            className="absolute max-w-none left-[-0.36%] top-[1.45%] w-[100.73%] h-[98.55%]"
          />
        </div>
        <div className="relative flex flex-1 min-w-0 items-start gap-3">
          <div className="flex flex-1 min-w-0 items-start gap-3">
            <img
              src={professor.avatarUrl || FALLBACK_AVATAR}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full border-2 border-white object-cover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
            />
            <div className="flex flex-col gap-[2px] min-w-0">
              <h3 className="truncate text-[14px] leading-[20px] font-semibold tracking-[-0.3424px] text-[#101828]">
                {professor.name}
              </h3>
              <div className="flex flex-col gap-[2px] min-w-0 text-[12px] leading-[16.5px] font-medium tracking-[-0.1275px] text-[#627181]">
                <p className="truncate">{professor.title}</p>
                <p className="truncate">{professor.university}</p>
              </div>
            </div>
          </div>
          {professor.openPositions && (
            <span className="flex items-center h-6 px-2 shrink-0 rounded-full bg-[#e7fdeb] font-[family-name:var(--font-figtree)] text-[12px] leading-[18px] font-medium text-[#36b37e] whitespace-nowrap">
              Open Positions
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 min-h-0 flex-col gap-2 px-4 py-3 bg-white overflow-hidden">
        <div className="flex items-center w-full shrink-0">
          <span className="flex items-center justify-center h-7 w-6 shrink-0 rounded-l-[4px] bg-[#7050e6]">
            <img src="/faculty-labs/test-tube.svg" alt="" width={9.00011} height={11} />
          </span>
          <p className="flex flex-1 min-w-0 items-center h-7 px-2 rounded-r-[4px] bg-[#f4f2fd] text-[14px] leading-[18px] text-[#101828]">
            <span className="truncate">{professor.labName || professor.department}</span>
          </p>
        </div>

        <div className="w-full p-3 rounded-[4px] bg-[#fafafa] shrink-0">
          <dl className="flex flex-col gap-1 break-words text-[14px] leading-[20px]">
            <div className="flex items-start gap-[6px]">
              <dt className="w-[120px] shrink-0 font-medium text-[#627181]">💰 Financial</dt>
              <dd className="flex-1 min-w-0 line-clamp-2 italic font-medium text-[#101828]">
                {professor.fundingSummary || professor.recentGrants || 'Contact lab for funding details'}
              </dd>
            </div>
            <div className="flex items-start gap-[6px]">
              <dt className="w-[120px] shrink-0 font-medium text-[#627181]">📅 Target Terms</dt>
              <dd className="flex-1 min-w-0 truncate italic font-medium text-[#101828]">{terms}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className={chipClass}>{degree}</span>
          <span className={chipClass}>$ {fundingLabel}</span>
          {professor.fundingSource && (
            <span className={chipClass} title={professor.fundingSource}>
              <span className="block w-[79px] truncate">#{professor.fundingSource}</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-t-[0.5px] border-[#f1f1f1] shrink-0">
        <div className="flex items-center gap-4 shrink-0">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${professor.name} on LinkedIn`}
            className="block size-5 hover:opacity-80 transition-opacity"
          >
            <img src="/faculty-labs/linkedin.svg" alt="" width={20} height={20} />
          </a>
          <a
            href={scholarUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${professor.name} on Google Scholar`}
            className="block size-5 hover:opacity-80 transition-opacity"
          >
            <img src="/faculty-labs/google-scholar.png" alt="" width={20} height={20} className="size-5 object-cover" />
          </a>
        </div>
        <img src="/opportunity-feed/divider.svg" alt="" width={1} height={15.5} className="shrink-0" />
        <div className="flex flex-1 min-w-0 gap-4">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] border border-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#7150e7] hover:bg-[#f4f2fd] transition-colors"
          >
            <span className="truncate">Official Link</span>
            <img src="/opportunity-feed/external-link.svg" alt="" width={12} height={12} className="shrink-0" />
          </a>
          <Link
            href={`/professors/${professor.id}`}
            className="flex flex-1 min-w-0 items-center justify-center gap-1 h-8 px-2 rounded-[6px] bg-[#7150e7] font-[family-name:var(--font-inter)] text-[12px] leading-[16px] font-medium text-[#fafafa] cursor-pointer hover:bg-[#5f3fd6] transition-colors"
          >
            <span className="truncate">Explore More</span>
            <img src="/opportunity-feed/arrow-right.svg" alt="" width={12} height={12} className="shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
};
