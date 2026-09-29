'use client';

import React from 'react';
import { Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateMatchScore } from '@/lib/utils';
import { 
  Bookmark, 
  ArrowUpRight, 
  ChevronRight,
} from 'lucide-react';

interface ScholarshipRadarCardProps {
  scholarship: Scholarship;
  onOpenDetail?: (sch: Scholarship) => void;
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

export const ScholarshipRadarCard: React.FC<ScholarshipRadarCardProps> = ({ 
  scholarship,
  onOpenDetail 
}) => {
  const { profile, saveScholarshipToTracker, applications, setSelectedScholarship } = useApp();

  const isTracked = applications.some((app) => app.scholarshipId === scholarship.id);

  const providerName = scholarship.provider || 'UK Government';
  const degreeText = scholarship.degreeLevels?.[0] || 'Masters';
  const matchScore = calculateMatchScore(scholarship, profile) || 85;
  const primaryCountry = scholarship.countries?.[0] || 'United Kingdom';

  const handleTrackToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveScholarshipToTracker(scholarship);
  };

  const handleOfficialLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = scholarship.officialUrl || 'https://www.google.com/search?q=' + encodeURIComponent(scholarship.title);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSeeDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetail) {
      onOpenDetail(scholarship);
    } else {
      setSelectedScholarship(scholarship);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between">
      <div>
        {/* Top Header Row: Provider, Degree, Match, Flag (Figma Node 122:3864) */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-[#344054] font-medium italic flex items-center gap-1 truncate">
              <span>🎓</span>
              <span>{providerName}</span>
            </span>
            <span className="bg-[#F2F4F7] text-[#344054] text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0">
              {degreeText}
            </span>
            <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#009966] text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              {matchScore}% Match
            </span>
          </div>

          {/* Crisp 28x18 SVG Flag */}
          <div className="shrink-0" title={primaryCountry}>
            {renderCountryFlag(primaryCountry)}
          </div>
        </div>

        {/* Scholarship Title & Subtitle */}
        <div className="space-y-0.5 mb-2.5">
          <h3 className="font-bold text-sm sm:text-base text-[#101828] leading-tight truncate group-hover:text-[#7050E6] transition-colors">
            {scholarship.title}
          </h3>
          <p className="text-xs text-[#919EAB] font-normal leading-tight truncate">
            {scholarship.provider || 'Foreign, Commonwealth & Development Office (FCDO)'}
          </p>
        </div>

        {/* Funding Value Container matching Figma */}
        <div className="bg-[#F8FAFC] rounded-lg p-3 my-2.5 space-y-1">
          <span className="text-[11px] font-medium text-[#919EAB] block leading-none">
            Funding Value
          </span>
          <p className="text-xs font-bold text-[#101828] leading-snug">
            {scholarship.fundingAmount || 'Full Tuition + £1,438/mo Stipend (London) + Return Flights + Visa'}
          </p>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="bg-[#ECFDF5] text-[#027A48] text-xs font-medium px-2.5 py-0.5 rounded-full">
            $ {scholarship.fundingType === 'FULL' ? 'Fully Funded' : 'Tuition Waiver'}
          </span>

          <span className="bg-[#F8FAFC] border border-[#F1F5F9] text-[#475467] text-xs px-2 py-0.5 rounded-md truncate max-w-[120px]">
            #{providerName}
          </span>

          <span className="bg-[#F8FAFC] border border-[#F1F5F9] text-[#475467] text-xs px-2 py-0.5 rounded-md">
            #Full Ride
          </span>

          {scholarship.specializations?.slice(0, 1).map((tag: string) => (
            <span key={tag} className="bg-[#F8FAFC] border border-[#F1F5F9] text-[#475467] text-xs px-2 py-0.5 rounded-md truncate max-w-[120px]">
              #{tag} Eligible
            </span>
          ))}
        </div>
      </div>

      <div>
        {/* Bottom Separator Line */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Footer Action Buttons Row matching Figma Frame 122:3864 */}
        <div className="flex items-center gap-2.5">
          {/* Track Button with Icon */}
          <button
            type="button"
            onClick={handleTrackToggle}
            className={`h-10 px-3.5 rounded-[20px] border flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs font-semibold ${
              isTracked 
                ? 'bg-[#EDE9FE] border-[#D6BBFB] text-[#7050E6]' 
                : 'bg-white hover:bg-slate-50 border-[#EAECF0] text-[#344054] hover:text-[#7050E6]'
            }`}
            title={isTracked ? 'Tracked in Pipeline' : 'Track in Pipeline'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isTracked ? 'fill-[#7050E6] text-[#7050E6]' : ''}`} />
            <span>Track</span>
          </button>

          {/* Vertical Divider */}
          <div className="h-4 w-[1px] bg-[#EAECF0] shrink-0 mx-0.5" />

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Official Link Button */}
            <button
              type="button"
              onClick={handleOfficialLink}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#F8FAFC] border border-[#7050E6] hover:bg-[#EDE9FE] text-[#7050E6] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Open official scholarship link"
            >
              <span>Official Link</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#7050E6]" />
            </button>

            {/* See Details Button */}
            <button
              type="button"
              onClick={handleSeeDetails}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#7050E6] hover:bg-[#5D3FD3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="See details & requirements"
            >
              <span>See Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
