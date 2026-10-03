'use client';

import React from 'react';
import { HiringOpportunity } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Bookmark, 
  ArrowUpRight, 
  ArrowRight
} from 'lucide-react';

interface OpportunityCardProps {
  opportunity: HiringOpportunity;
}

// Crisp 28x18 SVG country flags matching Figma
const renderCountryFlag = (country: string) => {
  const c = country?.toLowerCase() || '';
  if (c.includes('germany') || c === 'de') {
    return (
      <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="6" fill="#000000" />
        <rect y="6" width="28" height="6" fill="#DD0000" />
        <rect y="12" width="28" height="6" fill="#FFCE00" />
      </svg>
    );
  }
  if (c.includes('uk') || c.includes('united kingdom') || c === 'gb') {
    return (
      <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" fill="#012169" />
        <path d="M0 0 L28 18 M28 0 L0 18" stroke="white" strokeWidth="3" />
        <path d="M0 0 L28 18" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M28 0 L0 18" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M14 0 V18 M0 9 H28" stroke="white" strokeWidth="5" />
        <path d="M14 0 V18 M0 9 H28" stroke="#C8102E" strokeWidth="3" />
      </svg>
    );
  }
  if (c.includes('canada') || c === 'ca') {
    return (
      <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" fill="#FF0000" />
        <rect x="7" width="14" height="18" fill="white" />
        <path d="M14 4 L15 7.5 L17 6.5 L16.5 9 L19 9.5 L17.5 11 L18 12.5 L15 12 L14.5 14.5 H13.5 L13 12 L10 12.5 L10.5 11 L9 9.5 L11.5 9 L11 6.5 L13 7.5 Z" fill="#FF0000" />
      </svg>
    );
  }
  if (c.includes('switzerland') || c === 'ch') {
    return (
      <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" fill="#D52B1E" />
        <rect x="11.5" y="4" width="5" height="10" fill="white" />
        <rect x="7.5" y="6.5" width="13" height="5" fill="white" />
      </svg>
    );
  }
  if (c.includes('australia') || c === 'au') {
    return (
      <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" fill="#00008B" />
        <rect width="14" height="9" fill="#012169" />
        <path d="M0 0 L14 9 M14 0 L0 9" stroke="white" strokeWidth="1.5" />
        <path d="M0 0 L14 9" stroke="#C8102E" strokeWidth="0.8" />
        <path d="M14 0 L0 9" stroke="#C8102E" strokeWidth="0.8" />
        <path d="M7 0 V9 M0 4.5 H14" stroke="white" strokeWidth="2.5" />
        <path d="M7 0 V9 M0 4.5 H14" stroke="#C8102E" strokeWidth="1.5" />
        <circle cx="21" cy="4" r="0.8" fill="white" />
        <circle cx="23" cy="7" r="0.8" fill="white" />
        <circle cx="19" cy="8" r="0.8" fill="white" />
        <circle cx="21" cy="11" r="0.8" fill="white" />
      </svg>
    );
  }
  // Default: USA Flag
  return (
    <svg className="w-7 h-[18px] rounded-[3px] shadow-2xs shrink-0 overflow-hidden border border-black/10 select-none" viewBox="0 0 28 18" fill="none">
      <rect width="28" height="18" fill="#B22234" />
      <rect y="1.38" width="28" height="1.38" fill="white" />
      <rect y="4.15" width="28" height="1.38" fill="white" />
      <rect y="6.92" width="28" height="1.38" fill="white" />
      <rect y="9.69" width="28" height="1.38" fill="white" />
      <rect y="12.46" width="28" height="1.38" fill="white" />
      <rect y="15.23" width="28" height="1.38" fill="white" />
      <rect width="11.2" height="9.69" fill="#3C3B6E" />
      <circle cx="2.5" cy="2" r="0.6" fill="white" />
      <circle cx="5.5" cy="2" r="0.6" fill="white" />
      <circle cx="8.5" cy="2" r="0.6" fill="white" />
      <circle cx="4" cy="4" r="0.6" fill="white" />
      <circle cx="7" cy="4" r="0.6" fill="white" />
      <circle cx="2.5" cy="6" r="0.6" fill="white" />
      <circle cx="5.5" cy="6" r="0.6" fill="white" />
      <circle cx="8.5" cy="6" r="0.6" fill="white" />
      <circle cx="4" cy="8" r="0.6" fill="white" />
      <circle cx="7" cy="8" r="0.6" fill="white" />
    </svg>
  );
};

const getLivingCostByCountry = (country: string) => {
  const c = country?.toLowerCase() || '';
  if (c.includes('germany')) {
    return 'Zero Tuition Fees (€0) + Free Transit Ticket • €750-€850/mo';
  }
  if (c.includes('uk') || c.includes('united kingdom')) {
    return 'Affordable Living Outside London (£750-£900/mo)';
  }
  if (c.includes('canada')) {
    return 'Low Cost University Town (CAD $800-$950/mo)';
  }
  if (c.includes('switzerland')) {
    return 'Competitive Living Support (CHF 1,600/mo)';
  }
  return 'Low Cost College Town ($650/mo)';
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const { openColdEmailModal, saveOpportunityToOutreach, outreachRecords } = useApp();

  const isSaved = outreachRecords.some((r) => r.opportunityId === opportunity.id);

  // Dynamic values mapped from data matching Figma Card 4
  const universityName = opportunity.institution || 'Arkansas State University';
  const departmentSubtitle = opportunity.fieldTags?.length 
    ? opportunity.fieldTags.slice(0, 3).join(', ') 
    : 'UX Design, CS & Digital Media';

  const financialText = opportunity.funding || 'In-State Tuition Waiver + $1,400/mo Graduate Assistantship (TA/RA)';
  
  const admissionText = opportunity.minCgpa 
    ? `Accepts CGPA ${opportunity.minCgpa}+, No GRE required, 4+ Years Study Gap Accepted`
    : 'Accepts CGPA 2.65+, No GRE required, 4+ Years Study Gap Accepted';

  const livingText = getLivingCostByCountry(opportunity.country);

  // Dynamic ranking and acceptance badge matching Figma
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
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between">
      <div>
        {/* Top Header Row: University Name, Subtitle, Crisp SVG Flag */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-[#101828] leading-tight truncate group-hover:text-[#7050E6] transition-colors">
              {universityName}
            </h3>
            <p className="text-xs text-text-secondary font-normal leading-tight mt-1 truncate">
              {departmentSubtitle}
            </p>
          </div>

          {/* Crisp 28x18 SVG Flag */}
          <div className="shrink-0 mt-0.5" title={opportunity.country}>
            {renderCountryFlag(opportunity.country)}
          </div>
        </div>

        {/* Separator Line */}
        <hr className="border-[#F2F4F7] my-3" />

        {/* Middle Structured 3-Bullet Points enclosed in Container bg-[#F8FAFC] matching Figma Frame 2147226738 */}
        <div className="bg-[#F8FAFC] rounded-lg p-3 text-xs space-y-2 my-2">
          {/* Financial Item — Figma: 'Financial:' weight=700, amounts weight=700 italic, rest weight=400 */}
          <div className="leading-snug flex items-start gap-1.5">
            <span className="shrink-0 text-xs select-none">💰</span>
            <div className="min-w-0">
              <span className="font-bold text-[#101828]">Financial: </span>
              <span className="text-[#101828]">{financialText.split('+').map((part, i) => {
                const trimmed = part.trim();
                // Dollar amounts and key figures in bold italic
                if (trimmed.match(/\$[\d,]+/) || trimmed.match(/€[\d,]+/)) {
                  return <span key={i}>{i > 0 ? '+ ' : ''}<strong className="font-bold italic">{trimmed}</strong> </span>;
                }
                return <span key={i}>{i > 0 ? '+ ' : ''}{trimmed} </span>;
              })}</span>
            </div>
          </div>

          {/* Admission Item */}
          <div className="leading-snug flex items-start gap-1.5">
            <span className="shrink-0 text-xs select-none">🎓</span>
            <div className="min-w-0">
              <span className="font-semibold text-[#475467]">Admission: </span>
              <span className="text-text-secondary font-normal">{admissionText}</span>
            </div>
          </div>

          {/* Living Item */}
          <div className="leading-snug flex items-start gap-1.5">
            <span className="shrink-0 text-xs select-none">🏡</span>
            <div className="min-w-0">
              <span className="font-semibold text-[#475467]">Living: </span>
              <span className="text-text-secondary font-normal">{livingText}</span>
            </div>
          </div>
        </div>

        {/* Mint Green Acceptance Badge matching Figma Frame 2147226703 */}
        <div className="mt-3 mb-2">
          <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-semibold px-3 py-1 rounded-full inline-block select-none">
            {rankText} • High Acceptance ({acceptancePercent})
          </span>
        </div>
      </div>

      <div>
        {/* Bottom Separator Line */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Footer Action Buttons Row matching Figma Frame 2147226704 */}
        <div className="flex items-center gap-2.5">
          {/* Circular Bookmark Button — Figma: 42×40, cornerRadius 20, no visible border in default */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            className={`w-[42px] h-10 rounded-[20px] flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isSaved 
                ? 'bg-[#EDE9FE] border border-[#D6BBFB] text-[#7050E6]' 
                : 'bg-white hover:bg-slate-50 text-[#667085] hover:text-[#7050E6]'
            }`}
            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#7050E6] text-[#7050E6]' : ''}`} />
          </button>

          {/* Vertical Divider */}
          <div className="h-4 w-[1px] bg-[#EAECF0] shrink-0 mx-0.5" />

          {/* Action Buttons Group — Figma itemSpacing: 16 */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Official Link Button — Figma: bg=#F8FAFC, border=#7050E6, radius=20 */}
            <button
              type="button"
              onClick={handleOfficialLink}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#F8FAFC] border border-[#7050E6] hover:bg-[#EDE9FE] text-[#7050E6] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Open official university link"
            >
              <span>Official Link</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#7050E6]" />
            </button>

            {/* See Details Button */}
            <button
              type="button"
              onClick={handleSeeDetails}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#7050E6] hover:bg-[#5D3FD3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="See details & outreach"
            >
              <span>See Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
