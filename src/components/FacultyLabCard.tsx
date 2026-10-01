'use client';

import React from 'react';
import { Professor } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Building2, 
  FlaskConical, 
  ArrowUpRight, 
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface FacultyLabCardProps {
  professor: Professor;
  onOpenDetail?: (prof: Professor) => void;
}

export const FacultyLabCard: React.FC<FacultyLabCardProps> = ({ 
  professor,
  onOpenDetail 
}) => {
  const { setSelectedProfessor } = useApp();

  const handleOriginalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = professor.labWebsite || professor.googleScholar || 'https://www.google.com/search?q=' + encodeURIComponent(professor.name + ' ' + professor.university);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = professor.linkedInUrl || 'https://www.linkedin.com/search/results/all/?keywords=' + encodeURIComponent(professor.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGoogleScholar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = professor.googleScholar || 'https://scholar.google.com/scholar?q=' + encodeURIComponent(professor.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSeeDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetail) {
      onOpenDetail(professor);
    } else {
      setSelectedProfessor(professor);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between">
      <div>
        {/* Top Header Row: Avatar + Name + Open Positions Badge + Title (Figma Node 122:5197) */}
        <div className="flex items-start gap-3 mb-2.5">
          <img
            src={professor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={professor.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#EAECF0]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="font-bold text-sm sm:text-base text-[#101828] leading-tight truncate group-hover:text-[#7050E6] transition-colors">
                {professor.name}
              </h3>
              {professor.openPositions && (
                <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#009966] text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                  Open Positions
                </span>
              )}
            </div>
            <p className="text-xs text-[#667085] font-normal leading-tight mt-0.5 truncate">
              {professor.title || 'Professor of Computer Science'}
            </p>
          </div>
        </div>

        {/* Institution & Lab Subtitle */}
        <div className="space-y-0.5 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#475467]">
            <Building2 className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
            <span className="truncate">{professor.university}</span>
          </div>
          <p className="text-[11px] italic text-text-secondary truncate pl-5">
            {professor.labName ? `${professor.labName}, ${professor.country}` : `${professor.department}, ${professor.country}`}
          </p>
        </div>

        {/* Lab Name Box matching Figma */}
        <div className="bg-[#F8FAFC] rounded-lg p-2.5 my-2 flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-[#7050E6] shrink-0" />
          <span className="text-xs font-semibold text-[#101828] truncate">
            {professor.labName || 'Human-Computer Interaction Group'}
          </span>
        </div>

        {/* Active Funding Box matching Figma */}
        <div className="bg-[#FEF6EE] rounded-lg p-2.5 border border-[#FEE4E2]/60 my-2 flex items-start gap-2">
          <span className="text-xs font-bold text-[#B54708] shrink-0 leading-none mt-0.5">$</span>
          <div className="min-w-0 text-xs leading-snug">
            <span className="font-bold text-[#B54708]">Active Funding: </span>
            <span className="italic text-[#B54708] font-medium">
              {professor.recentGrants || '$3.8M Stanford HAI Human-AI Interaction & Foundational Interfaces Grant'}
            </span>
          </div>
        </div>

        {/* Topic Tags */}
        <div className="flex flex-wrap items-center gap-1.5 my-2">
          {professor.researchTags?.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md truncate max-w-[130px]">
              {tag}
            </span>
          ))}
        </div>

        {/* Target Terms */}
        <div className="text-[11px] text-[#667085] mt-1 mb-2">
          <span>Target Terms: </span>
          <span className="italic font-medium text-[#344054]">
            {professor.acceptingTerms?.length ? professor.acceptingTerms.join(', ') : 'Fall 2026, Spring 2027'}
          </span>
        </div>
      </div>

      <div>
        {/* Bottom Separator Line */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Footer Action Buttons Row matching Figma Frame 122:5197 */}
        <div className="flex items-center gap-2">
          {/* LinkedIn Icon Button */}
          <button
            type="button"
            onClick={handleLinkedIn}
            className="w-8 h-8 rounded-lg border border-[#EAECF0] hover:bg-slate-50 flex items-center justify-center text-[#0A66C2] transition-colors cursor-pointer shrink-0"
            title="LinkedIn Profile"
          >
            <span className="text-xs font-bold">in</span>
          </button>

          {/* Google Scholar Icon Button */}
          <button
            type="button"
            onClick={handleGoogleScholar}
            className="w-8 h-8 rounded-lg border border-[#EAECF0] hover:bg-slate-50 flex items-center justify-center text-[#4285F4] transition-colors cursor-pointer shrink-0"
            title="Google Scholar Profile"
          >
            <GraduationCap className="w-4 h-4 text-[#4285F4]" />
          </button>

          {/* Vertical Divider */}
          <div className="h-4 w-[1px] bg-[#EAECF0] shrink-0 mx-0.5" />

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Original Link Button */}
            <button
              type="button"
              onClick={handleOriginalLink}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#F8FAFC] border border-[#7050E6] hover:bg-[#EDE9FE] text-[#7050E6] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Open faculty lab website"
            >
              <span>Original Link</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#7050E6]" />
            </button>

            {/* See Details Button */}
            <button
              type="button"
              onClick={handleSeeDetails}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#7050E6] hover:bg-[#5D3FD3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="See details & prepare outreach email"
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
