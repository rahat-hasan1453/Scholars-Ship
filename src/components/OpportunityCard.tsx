'use client';

import React from 'react';
import { HiringOpportunity } from '@/types';
import { useApp } from '@/context/AppContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  SparklesIcon, 
  Bookmark01Icon, 
  Tick01Icon, 
  Building02Icon,
  ArrowUpRight01Icon,
  FlaskConicalIcon
} from '@hugeicons/core-free-icons';

interface OpportunityCardProps {
  opportunity: HiringOpportunity;
}

const getCountryFlag = (country: string) => {
  switch (country?.toLowerCase()) {
    case 'germany':
      return '🇩🇪';
    case 'usa':
    case 'united states':
      return '🇺🇸';
    case 'canada':
      return '🇨🇦';
    case 'uk':
    case 'united kingdom':
      return '🇬🇧';
    case 'switzerland':
      return '🇨🇭';
    case 'sweden':
      return '🇸🇪';
    case 'netherlands':
      return '🇳🇱';
    case 'france':
      return '🇫🇷';
    case 'japan':
      return '🇯🇵';
    case 'south korea':
    case 'korea':
      return '🇰🇷';
    case 'singapore':
      return '🇸🇬';
    case 'australia':
      return '🇦🇺';
    default:
      return '🇩🇪';
  }
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const { openColdEmailModal, saveOpportunityToOutreach, outreachRecords } = useApp();

  const isSaved = outreachRecords.some((r) => r.opportunityId === opportunity.id);

  // Match score calculation or display
  const matchPercentage = opportunity.matchType === 'exact' ? '98% Match' : '85% Match';
  const degreeLevel = opportunity.degrees[0] || 'Masters';
  const labOrGroup = opportunity.labName || (opportunity.institution ? `${opportunity.institution} Research Lab` : 'Fluid Interfaces Group, MIT Media Lab');

  return (
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Top Header Row: Lab Name & Badges */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          {/* Left: Flask Icon + Italic Lab / Group Name */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <HugeiconsIcon icon={FlaskConicalIcon} size={16} className="text-slate-400 shrink-0" />
            <span className="italic font-semibold text-sm text-[#101828] truncate">
              {labOrGroup}
            </span>
          </div>

          {/* Right: Degree Badge + Match Badge + Flag */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-3 py-1 rounded-full">
              {degreeLevel}
            </span>
            <span className="bg-[#DCFCE7] text-[#027A48] text-xs font-semibold px-3 py-1 rounded-full">
              {matchPercentage}
            </span>
            <span 
              className="text-lg leading-none inline-flex items-center justify-center filter drop-shadow-2xs select-none" 
              title={opportunity.country}
            >
              {getCountryFlag(opportunity.country)}
            </span>
          </div>
        </div>

        {/* Top Divider */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Opportunity Headline / Title */}
        <h3 className="font-bold italic text-[#101828] text-base leading-snug tracking-tight mb-2 group-hover:text-[#6941C6] transition-colors">
          {opportunity.title}
        </h3>

        {/* Abstract / Description */}
        <p className="italic text-xs text-[#475467] leading-relaxed line-clamp-3 mb-4">
          {opportunity.content}
        </p>

        {/* Author / Professor Info Row */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          {/* Professor details */}
          <div className="flex items-center gap-3 min-w-0">
            {opportunity.authorAvatar ? (
              <img
                src={opportunity.authorAvatar}
                alt={opportunity.authorName}
                className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                {opportunity.authorName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="font-bold text-sm text-[#101828] leading-tight truncate">
                {opportunity.authorName}
              </h4>
              <p className="text-xs text-[#475467] leading-tight truncate mt-0.5">
                {opportunity.authorTitle}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#667085] mt-1 truncate">
                <HugeiconsIcon icon={Building02Icon} size={14} className="text-[#667085] shrink-0" />
                <span className="truncate">{opportunity.institution}</span>
              </div>
            </div>
          </div>

          {/* Social / Source Link */}
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#0A66C2] text-xs font-semibold hover:underline shrink-0"
            title="Open original post"
          >
            <span className="w-4 h-4 bg-[#0A66C2] text-white rounded-xs flex items-center justify-center font-bold text-[10px] leading-none">
              in
            </span>
            <span className="hidden sm:inline">See Original Post</span>
          </a>
        </div>

        {/* Mid Divider */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Funding & Research Tags Row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Fully Funded Pill */}
          <span className="bg-[#DCFCE7] text-[#027A48] italic font-medium text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-xs not-italic">$</span>
            <span>{opportunity.funding || 'Fully Funded / University Fellowship'}</span>
          </span>

          {/* Vertical Separator */}
          <span className="h-4 w-[1px] bg-[#E4E7EC] mx-1 hidden sm:inline-block" />

          {/* Field Tags in Italic */}
          {opportunity.fieldTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="italic text-xs text-[#344054] bg-[#F2F4F7] hover:bg-[#E4E7EC] px-3 py-1 rounded-full font-normal transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center gap-2.5 pt-2">
        {/* Button 1: Track / Tracked */}
        <button
          onClick={() => saveOpportunityToOutreach(opportunity)}
          disabled={isSaved}
          className={`h-10 px-5 border rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 ${
            isSaved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-[#344054] border-[#D0D5DD]'
          }`}
          title={isSaved ? 'Saved to Pipeline' : 'Save to Pipeline'}
        >
          {isSaved ? (
            <>
              <HugeiconsIcon icon={Tick01Icon} size={15} className="text-emerald-600" />
              <span>Tracked</span>
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Bookmark01Icon} size={15} className="text-[#344054]" />
              <span>Track</span>
            </>
          )}
        </button>

        {/* Button 2: See Original Post */}
        <a
          href={opportunity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 bg-white border border-[#7150E7] hover:bg-[#F4F3FE] text-[#7150E7] font-semibold text-xs rounded-full inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <span>See Original Post</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} className="text-[#7150E7]" />
        </a>

        {/* Button 3: Draft AI Email */}
        <button
          onClick={() => openColdEmailModal(opportunity)}
          className="flex-1 h-10 bg-[#6941C6] hover:bg-[#5925DC] text-white font-semibold text-xs rounded-full inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <HugeiconsIcon icon={SparklesIcon} size={15} className="text-white" />
          <span>Draft AI Email</span>
        </button>
      </div>
    </div>
  );
};
