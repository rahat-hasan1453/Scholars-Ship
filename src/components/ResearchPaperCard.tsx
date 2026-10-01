'use client';

import React, { useState } from 'react';
import { ResearchPaper } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Bookmark, 
  Download, 
  GraduationCap, 
  BarChart2, 
  ChevronRight,
  ExternalLink 
} from 'lucide-react';

interface ResearchPaperCardProps {
  paper: ResearchPaper;
  onOpenDetail?: (paper: ResearchPaper) => void;
}

export const ResearchPaperCard: React.FC<ResearchPaperCardProps> = ({ 
  paper,
  onOpenDetail 
}) => {
  const { toggleSavePaper, isPaperSaved } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const isSaved = isPaperSaved ? isPaperSaved(paper.id) : false;

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleSavePaper) {
      toggleSavePaper(paper.id);
    }
  };

  const handleGoogleScholar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = paper.googleScholarUrl || 'https://scholar.google.com/scholar?q=' + encodeURIComponent(paper.title);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = paper.pdfUrl || paper.semanticScholarUrl || paper.googleScholarUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const authorsText = paper.authors?.map(a => a.name).join(' • ') || 'Dr. Sarah Jenkins • Alex Mercer • Prof. Hiroshi Tanaka';

  return (
    <div className="group bg-white rounded-2xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between">
      <div>
        {/* Paper Title (Figma Node 122:8982: Bold Italic) */}
        <h3 className="font-bold italic text-sm sm:text-base text-[#101828] leading-tight mb-2.5 group-hover:text-[#7050E6] transition-colors">
          {paper.title}
        </h3>

        {/* Abstract Preview with Read Full Abstract */}
        <div className="text-xs text-[#475467] leading-relaxed mb-3">
          <span className="italic">
            {isExpanded 
              ? paper.abstract 
              : `${paper.abstract.slice(0, 140)}...`}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            className="text-[#7050E6] font-semibold hover:underline ml-1 inline cursor-pointer select-none"
          >
            {isExpanded ? 'Show less' : 'Read full abstract'}
          </button>
        </div>

        {/* Authors Row */}
        <div className="text-xs text-[#667085] leading-normal mb-3">
          <span className="text-text-secondary">Authors: </span>
          <span className="font-semibold text-[#344054]">{authorsText}</span>
        </div>

        {/* Tags & Citations Row */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {paper.fieldsOfStudy?.slice(0, 3).map((field) => (
              <span key={field} className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md truncate max-w-[130px]">
                #{field}
              </span>
            ))}
          </div>

          {/* Citations Badge matching Figma Node 122:8982 */}
          <span className="bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708] text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
            <span className="text-[11px]">📊</span>
            <span>{paper.citationCount || 142} Citations</span>
          </span>
        </div>
      </div>

      <div>
        {/* Bottom Separator Line */}
        <hr className="border-[#F2F4F7] mb-3.5" />

        {/* Footer Action Buttons Row matching Figma Frame 122:8982 */}
        <div className="flex items-center gap-2.5">
          {/* Circular Bookmark Button */}
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

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Google Scholar Button */}
            <button
              type="button"
              onClick={handleGoogleScholar}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#F8FAFC] border border-[#7050E6] hover:bg-[#EDE9FE] text-[#7050E6] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Open in Google Scholar"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#7050E6]" />
              <span>Google Scholar</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 h-10 px-3 rounded-[20px] bg-[#7050E6] hover:bg-[#5D3FD3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Download or view paper PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
