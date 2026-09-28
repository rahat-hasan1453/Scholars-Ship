'use client';

import React from 'react';
import { HiringOpportunity } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Bookmark, 
  ArrowUpRight, 
  ChevronRight, 
  Check
} from 'lucide-react';

interface OpportunityCardProps {
  opportunity: HiringOpportunity;
}

const getCountryFlag = (country: string) => {
  switch (country?.toLowerCase()) {
    case 'germany':
      return { flag: '🇩🇪', label: 'Germany' };
    case 'usa':
    case 'united states':
      return { flag: '🇺🇸', label: 'United States' };
    case 'canada':
      return { flag: '🇨🇦', label: 'Canada' };
    case 'uk':
    case 'united kingdom':
      return { flag: '🇬🇧', label: 'United Kingdom' };
    case 'switzerland':
      return { flag: '🇨🇭', label: 'Switzerland' };
    case 'sweden':
      return { flag: '🇸🇪', label: 'Sweden' };
    case 'netherlands':
      return { flag: '🇳🇱', label: 'Netherlands' };
    case 'france':
      return { flag: '🇫🇷', label: 'France' };
    case 'japan':
      return { flag: '🇯🇵', label: 'Japan' };
    case 'south korea':
    case 'korea':
      return { flag: '🇰🇷', label: 'South Korea' };
    case 'singapore':
      return { flag: '🇸🇬', label: 'Singapore' };
    case 'australia':
      return { flag: '🇦🇺', label: 'Australia' };
    default:
      return { flag: '🇺🇸', label: 'United States' };
  }
};

const getLivingCostByCountry = (country: string) => {
  switch (country?.toLowerCase()) {
    case 'germany':
      return 'Zero Tuition Fees (€0) + Free Transit Ticket • €750-€850/mo';
    case 'uk':
    case 'united kingdom':
      return 'Affordable Living Outside London (£750-£900/mo)';
    case 'canada':
      return 'Low Cost University Town (CAD $800-$950/mo)';
    case 'switzerland':
      return 'Competitive Living Support (CHF 1,600/mo)';
    default:
      return 'Low Cost College Town ($650/mo)';
  }
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const { openColdEmailModal, saveOpportunityToOutreach, outreachRecords } = useApp();

  const isSaved = outreachRecords.some((r) => r.opportunityId === opportunity.id);
  const countryInfo = getCountryFlag(opportunity.country);

  // Dynamic values mapped from system data
  const universityName = opportunity.institution || 'Arkansas State University';
  const departmentSubtitle = opportunity.fieldTags?.length 
    ? opportunity.fieldTags.slice(0, 3).join(', ') 
    : 'UX Design, CS & Digital Media';

  const financialText = opportunity.funding || 'In-State Tuition Waiver + $1,400/mo Graduate Assistantship (TA/RA)';
  
  const admissionText = opportunity.minCgpa 
    ? `Accepts CGPA ${opportunity.minCgpa}+, No GRE required, 4+ Years Study Gap Accepted`
    : 'Accepts CGPA 2.65+, No GRE required, 4+ Years Study Gap Accepted';

  const livingText = getLivingCostByCountry(opportunity.country);

  // Dynamic ranking and acceptance banner
  const acceptancePercent = opportunity.matchType === 'exact' ? '88%' : '92%';
  const rankText = opportunity.matchType === 'exact' ? 'Rank 1,200 – 1,800' : 'Rank 1,800 – 2,400';

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveOpportunityToOutreach(opportunity);
  };

  const handleOfficialLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = opportunity.sourceUrl || opportunity.officialUrl || 'https://www.google.com/search?q=' + encodeURIComponent(universityName + ' graduate admissions');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSeeDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    openColdEmailModal(opportunity);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Top Header Row: University Name, Department, Flag */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-[#101828] leading-tight truncate group-hover:text-[#6941C6] transition-colors">
              {universityName}
            </h3>
            <p className="text-xs text-[#667085] font-normal leading-tight mt-1 truncate">
              {departmentSubtitle}
            </p>
          </div>

          {/* Country Flag Badge */}
          <span 
            className="text-xl leading-none inline-flex items-center justify-center shrink-0 filter drop-shadow-2xs select-none ml-2" 
            title={countryInfo.label}
          >
            {countryInfo.flag}
          </span>
        </div>

        {/* Separator Line */}
        <hr className="border-[#F2F4F7] my-3.5" />

        {/* Structured 3-Bullet Points (Figma Node 116:2525) */}
        <div className="space-y-2.5">
          {/* Financial Item */}
          <div className="text-xs text-[#344054] leading-relaxed flex items-start gap-2">
            <span className="shrink-0 text-sm select-none">💰</span>
            <div className="min-w-0">
              <strong className="font-semibold text-[#101828]">Financial: </strong>
              <span className="italic text-[#475467]">{financialText}</span>
            </div>
          </div>

          {/* Admission Item */}
          <div className="text-xs text-[#344054] leading-relaxed flex items-start gap-2">
            <span className="shrink-0 text-sm select-none">🎓</span>
            <div className="min-w-0">
              <strong className="font-semibold text-[#101828]">Admission: </strong>
              <span className="italic text-[#475467]">{admissionText}</span>
            </div>
          </div>

          {/* Living Item */}
          <div className="text-xs text-[#344054] leading-relaxed flex items-start gap-2">
            <span className="shrink-0 text-sm select-none">🏡</span>
            <div className="min-w-0">
              <strong className="font-semibold text-[#101828]">Living: </strong>
              <span className="italic text-[#475467]">{livingText}</span>
            </div>
          </div>
        </div>

        {/* Mint Green Acceptance Badge (Figma Node 116:2531) */}
        <div className="mt-3.5 mb-3.5 bg-[#ECFDF3] border border-[#D1FADF] rounded-lg py-1.5 px-3 text-center">
          <span className="text-xs font-semibold text-[#027A48] tracking-tight">
            {rankText} • High Acceptance ({acceptancePercent})
          </span>
        </div>
      </div>

      <div>
        {/* Bottom Separator Line */}
        <hr className="border-[#F2F4F7] mb-3" />

        {/* Footer Action Buttons Row (Figma Node 116:2535) */}
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isSaved 
                ? 'bg-[#EDE9FE] border-[#D6BBFB] text-[#6941C6]' 
                : 'bg-white hover:bg-slate-50 border-[#EAECF0] text-[#667085] hover:text-[#101828]'
            }`}
            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#6941C6] text-[#6941C6]' : ''}`} />
          </button>

          {/* Official Link Button */}
          <button
            type="button"
            onClick={handleOfficialLink}
            className="flex-1 h-9 px-3 rounded-xl border border-[#7150E7] text-[#7150E7] hover:bg-[#F9F5FF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Open official university / program link"
          >
            <span>Official Link</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#7150E7]" />
          </button>

          {/* See Details Button */}
          <button
            type="button"
            onClick={handleSeeDetails}
            className="flex-1 h-9 px-3 rounded-xl bg-[#6941C6] hover:bg-[#5925DC] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="See details & prepare outreach email"
          >
            <span>See Details</span>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
