'use client';

import React from 'react';
import { Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateMatchScore, formatFunding, calculateCountdown } from '@/lib/utils';
import { ArrowUpRightIcon, AwardIcon, BookmarkIcon, CalendarIcon, CheckIcon, ChevronRightIcon } from 'lucide-react';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  onSelect: (scholarship: Scholarship) => void;
}

const getCountryFlag = (country?: string) => {
  if (!country || country === 'Any country') return '🌐';
  const c = country.toLowerCase();
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain')) return '🇬🇧';
  if (c.includes('united states') || c.includes('usa') || c.includes('us')) return '🇺🇸';
  if (c.includes('germany') || c.includes('deutschland')) return '🇩🇪';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('sweden')) return '🇸🇪';
  if (c.includes('singapore')) return '🇸🇬';
  if (c.includes('south korea') || c.includes('korea')) return '🇰🇷';
  if (c.includes('japan')) return '🇯🇵';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('switzerland')) return '🇨🇭';
  if (c.includes('australia')) return '🇦🇺';
  if (c.includes('ireland')) return '🇮🇪';
  if (c.includes('italy')) return '🇮🇹';
  if (c.includes('turkey') || c.includes('türkiye')) return '🇹🇷';
  return '🌐';
};

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship, onSelect }) => {
  const { profile, applications, saveScholarshipToTracker } = useApp();

  const matchScore = calculateMatchScore(scholarship, profile);
  const isSaved = applications.some((app) => app.scholarshipId === scholarship.id);
  const countdown = calculateCountdown(scholarship.deadline);

  return (
    <div className="bg-white border border-[#EAECF0] hover:border-[#D0D5DD] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header Row (Provider, Degree, Match %, Flag) */}
        <div className="flex items-center justify-between gap-2">
          {/* Provider in Italics */}
          <div 
            className="flex items-center gap-1.5 text-xs text-[#344054] italic font-medium truncate max-w-[200px]" 
            title={scholarship.provider}
          >
            <AwardIcon size={15} className="text-[#6941C6] shrink-0 not-italic" />
            <span className="truncate">{scholarship.provider}</span>
          </div>

          {/* Right Badges: Degree, Match Score, Flag */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-[#F2F4F7] text-[#344054] text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              {scholarship.degreeLevels[0] || 'Masters'}
            </span>
            <span className="bg-[#ECFDF3] text-[#027A48] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {matchScore}% Match
            </span>
            <span className="text-sm leading-none select-none ml-0.5" title={scholarship.countries.join(', ')}>
              {getCountryFlag(scholarship.countries[0])}
            </span>
          </div>
        </div>

        {/* Scholarship Title & Subtitle */}
        <div className="mt-3">
          <h3 
            onClick={() => onSelect(scholarship)}
            className="text-base font-semibold text-[#101828] hover:text-[#6941C6] transition-colors cursor-pointer line-clamp-1 leading-snug"
            title={scholarship.title}
          >
            {scholarship.title}
          </h3>
          <p 
            className="text-xs text-[#475467] mt-1 line-clamp-1" 
            title={scholarship.description || scholarship.provider}
          >
            {scholarship.description ? scholarship.description : scholarship.provider}
          </p>
        </div>

        {/* Funding Value Callout Box */}
        <div className="mt-3 p-3.5 bg-[#F9FAFB] rounded-xl border border-transparent">
          <div className="text-[10px] text-[#667085] font-semibold leading-none mb-1.5">
            Funding Value
          </div>
          <div className="text-xs font-semibold text-[#101828] leading-snug line-clamp-2">
            {scholarship.fundingAmount}
          </div>
        </div>

        {/* Tags Row: Funding Pill + Italic Hashtags */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {/* Green Pill: $ Fully Funded */}
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] border border-[#A6F4C5] px-2.5 py-1 rounded-full shrink-0">
            <span>$</span>
            <span>{formatFunding(scholarship.fundingType)}</span>
          </span>

          {/* Italic Hashtags */}
          {scholarship.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="italic text-xs text-[#344054] bg-[#F2F4F7] hover:bg-[#E4E7EC] px-2.5 py-1 rounded-full font-normal transition-colors shrink-0"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Deadline Information */}
        <div className="mt-3 flex items-center justify-between text-xs" suppressHydrationWarning>
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarIcon size={14} className="text-[#6941C6] shrink-0" />
            <span className="text-[#667085] font-medium">Deadline:</span>
            <span className="font-semibold text-[#101828] truncate">
              {new Date(scholarship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            countdown.isExpired
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : countdown.urgency === 'urgent'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : countdown.urgency === 'warning'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-[#F2F4F7] text-[#475467]'
          }`}>
            {countdown.formatted}
          </span>
        </div>
      </div>

      {/* Bottom Action Footer Row */}
      <div className="flex items-center gap-2.5 pt-4 border-t border-[#F2F4F7] mt-4">
        {/* Button 1: Track / In Tracker */}
        <button
          type="button"
          onClick={() => saveScholarshipToTracker(scholarship)}
          disabled={isSaved}
          className={`h-10 px-4.5 border rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 ${
            isSaved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-[#344054] border-[#D0D5DD]'
          }`}
          title={isSaved ? 'In Tracker' : 'Save to Tracker'}
        >
          {isSaved ? (
            <>
              <CheckIcon size={15} className="text-emerald-600" />
              <span>Tracked</span>
            </>
          ) : (
            <>
              <BookmarkIcon size={15} className="text-[#344054]" />
              <span>Track</span>
            </>
          )}
        </button>

        {/* Vertical Separator */}
        <span className="h-6 w-[1px] bg-[#E4E7EC] shrink-0 mx-1" />

        {/* Button 2: Official Link */}
        <a
          href={scholarship.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 bg-white border border-[#7150E7] hover:bg-[#F4F3FE] text-[#7150E7] font-semibold text-xs rounded-full inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <span>Official Link</span>
          <ArrowUpRightIcon size={15} className="text-[#7150E7]" />
        </a>

        {/* Button 3: See Details */}
        <button
          type="button"
          onClick={() => onSelect(scholarship)}
          className="flex-1 h-10 bg-[#6941C6] hover:bg-[#5925DC] text-white font-semibold text-xs rounded-full inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <span>See Details</span>
          <ChevronRightIcon size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
};
