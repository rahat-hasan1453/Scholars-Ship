'use client';

import React from 'react';
import { Professor } from '@/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Building02Icon, 
  FlaskConicalIcon, 
  ChevronRightIcon, 
  ArrowUpRight01Icon 
} from '@hugeicons/core-free-icons';

interface ProfessorCardProps {
  professor: Professor;
}

export const ProfessorCard: React.FC<ProfessorCardProps> = ({ professor }) => {
  return (
    <div className="bg-white border border-[#EAECF0] hover:border-[#D0D5DD] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header Row (Avatar, Name, Title, University & Open Positions Badge) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={professor.avatarUrl}
              alt={professor.name}
              className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
            />

            <div className="min-w-0">
              <h3 
                className="text-base font-bold text-[#101828] leading-tight truncate"
                title={professor.name}
              >
                {professor.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#475467] font-normal truncate mt-0.5" title={professor.title}>
                {professor.title}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#344054] font-medium truncate mt-1">
                <HugeiconsIcon icon={Building02Icon} size={14} className="text-[#667085] shrink-0" />
                <span className="truncate">{professor.university}</span>
              </div>
              <p className="text-[11px] text-[#475467] italic truncate mt-0.5" title={`${professor.department}, ${professor.country}`}>
                {professor.department}, {professor.country}
              </p>
            </div>
          </div>

          {/* Open Positions & Live Index Badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {professor.openPositions && (
              <span className="bg-[#E8FAF0] text-[#12B76A] border border-[#A6F4C5] text-[11px] font-semibold px-2.5 py-0.5 rounded-full select-none">
                Open Positions
              </span>
            )}
            {professor.id?.startsWith('openalex_') && (
              <span className="bg-[#F9F5FF] text-[#7150E7] border border-[#D6BBFB] text-[10px] font-semibold px-2 py-0.5 rounded-full select-none flex items-center gap-1">
                <span>🌐</span> OpenAlex Verified
              </span>
            )}
          </div>
        </div>

        {/* Full-width Stacked Information Boxes (Figma Node 26-5404) */}
        <div className="mt-4 space-y-2.5">
          {/* Box 1: Lab Information */}
          <div className="p-3 bg-[#F8F9FC] border border-[#EAECF0] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#101828]">
              <HugeiconsIcon icon={FlaskConicalIcon} size={15} className="text-[#667085] shrink-0" />
              <span className="truncate">{professor.labName || 'Research Laboratory'}</span>
            </div>
          </div>

          {/* Box 2: Active Funding */}
          {professor.recentGrants && (
            <div className="p-3 bg-[#FEF6EE] border border-[#FEE4E2]/60 rounded-xl">
              <div className="flex items-start gap-2 text-xs">
                <span className="font-extrabold text-[#93370D] shrink-0 leading-none mt-0.5">$</span>
                <div className="text-[#93370D] leading-tight min-w-0">
                  <span className="font-bold">Active Funding: </span>
                  <span className="italic font-medium">{professor.recentGrants}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Specialization Tags (Grey pill tags matching Figma) */}
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          {professor.researchTags.map((interest) => (
            <span
              key={interest}
              className="text-[11px] font-medium bg-[#F2F4F7] text-[#344054] px-2.5 py-0.5 rounded-full"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Target Terms */}
        <div className="text-[11px] text-[#475467] mt-3">
          <span>Target Terms: </span>
          <span className="italic font-medium text-[#344054]">
            {professor.acceptingTerms?.join(', ') || 'Fall 2026, Spring 2027'}
          </span>
        </div>
      </div>

      {/* Bottom Action Footer Row (Matching user uploaded footer image & assets) */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#F2F4F7] mt-4">
        {/* Left Side: Provided Icon Assets */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* LinkedIn Asset */}
          <a
            href={professor.linkedInUrl || 'https://linkedin.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity cursor-pointer shrink-0 block"
            title="LinkedIn Profile"
          >
            <img
              src="/icons/linkedin.png"
              alt="LinkedIn"
              className="w-6 h-6 object-contain rounded-[4px]"
            />
          </a>

          {/* Google Scholar Asset */}
          <a
            href={professor.googleScholar || 'https://scholar.google.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity cursor-pointer shrink-0 block"
            title="Google Scholar Citations"
          >
            <img
              src="/icons/google-scholar.png"
              alt="Google Scholar"
              className="w-6 h-6 object-contain rounded-[4px]"
            />
          </a>
        </div>

        {/* Vertical Separator Divider */}
        <span className="h-5 w-[1.5px] bg-[#D0D5DD] shrink-0 mx-2" />

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Button 1: Original Link */}
          <a
            href={professor.labWebsite || professor.googleScholar || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4.5 bg-white border border-[#7150E7] hover:bg-[#F9F5FF] text-[#7150E7] font-semibold text-xs rounded-full inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <span>Original Link</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} className="text-[#7150E7]" />
          </a>

          {/* Button 2: See Details */}
          <a
            href={
              professor.email 
                ? `mailto:${professor.email}?subject=Inquiry regarding Graduate Research Position (Fall 2026)` 
                : professor.labWebsite || '#'
            }
            className="h-10 px-4.5 bg-[#6941C6] hover:bg-[#5925DC] text-white font-semibold text-xs rounded-full inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <span>See Details</span>
            <HugeiconsIcon icon={ChevronRightIcon} size={15} className="text-white" />
          </a>
        </div>
      </div>
    </div>
  );
};
