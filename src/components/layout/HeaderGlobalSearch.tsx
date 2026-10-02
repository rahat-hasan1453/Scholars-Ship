'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/shadcn/input';
import { useApp } from '@/context/AppContext';
import { parseNaturalLanguageQuery, matchItemSemantically } from '@/lib/semanticSearch';
import { Scholarship, Professor, HiringOpportunity } from '@/types';
import { 
  X, 
  Sparkles, 
  GraduationCap, 
  Award, 
  Building2, 
  Zap, 
  ArrowRight, 
  ArrowUpRight,
  ExternalLink,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface HeaderGlobalSearchProps {
  onSelectScholarship?: (sch: Scholarship) => void;
  onSelectProfessor?: (prof: Professor) => void;
  onNavigateToTab?: (tab: 'opportunities' | 'scholarships' | 'professors' | 'research') => void;
}

export const HeaderGlobalSearch: React.FC<HeaderGlobalSearchProps> = ({
  onSelectScholarship,
  onSelectProfessor,
  onNavigateToTab,
}) => {
  const { 
    scholarships, 
    professors, 
    opportunities, 
    globalSearchQuery, 
    setGlobalSearchQuery,
    setActiveNavTab,
    setSelectedScholarship,
    setSelectedProfessor,
    openColdEmailModal,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        const input = containerRef.current?.querySelector('input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse current query
  const parsedIntent = useMemo(() => {
    return parseNaturalLanguageQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  // Semantic search matching across all 4 categories
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) {
      return {
        scholarships: [],
        professors: [],
        opportunities: [],
        total: 0,
      };
    }

    // 1. Scholarships
    const matchedScholarships = scholarships
      .map((s) => {
        const text = `${s.title} ${s.provider} ${s.countries.join(' ')} ${s.fundingAmount} ${s.fundingType} ${s.specializations.join(' ')} ${s.tags.join(' ')} ${s.description}`;
        const { matches, score } = matchItemSemantically(text, s.countries, parsedIntent);
        return { item: s, matches, score };
      })
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((res) => res.item);

    // 2. Professors
    const matchedProfessors = professors
      .map((p) => {
        const text = `${p.name} ${p.university} ${p.department} ${p.labName || ''} ${p.country} ${p.researchTags.join(' ')} ${p.bio || ''}`;
        const { matches, score } = matchItemSemantically(text, p.country, parsedIntent);
        return { item: p, matches, score };
      })
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((res) => res.item);

    // 3. Lab Opportunities
    const matchedOpportunities = opportunities
      .map((opp) => {
        const text = `${opp.title} ${opp.institution} ${opp.country} ${opp.funding} ${opp.fieldTags.join(' ')} ${opp.content}`;
        const { matches, score } = matchItemSemantically(text, opp.country, parsedIntent);
        return { item: opp, matches, score };
      })
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((res) => res.item);

    return {
      scholarships: matchedScholarships,
      professors: matchedProfessors,
      opportunities: matchedOpportunities,
      total: matchedScholarships.length + matchedProfessors.length + matchedOpportunities.length,
    };
  }, [globalSearchQuery, scholarships, professors, opportunities, parsedIntent]);

  const handleApplyGlobalSearch = () => {
    setIsOpen(false);
    if (parsedIntent.detectedCategory === 'professors') {
      setActiveNavTab('professors');
      onNavigateToTab?.('professors');
    } else if (parsedIntent.detectedCategory === 'scholarships') {
      setActiveNavTab('scholarships');
      onNavigateToTab?.('scholarships');
    } else if (parsedIntent.detectedCategory === 'opportunities') {
      setActiveNavTab('opportunities');
      onNavigateToTab?.('opportunities');
    } else if (parsedIntent.detectedCategory === 'research') {
      setActiveNavTab('research');
      onNavigateToTab?.('research');
    } else {
      // Default to scholarships or opportunities
      if (searchResults.scholarships.length > 0) {
        setActiveNavTab('scholarships');
        onNavigateToTab?.('scholarships');
      } else if (searchResults.professors.length > 0) {
        setActiveNavTab('professors');
        onNavigateToTab?.('professors');
      } else {
        setActiveNavTab('opportunities');
        onNavigateToTab?.('opportunities');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyGlobalSearch();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input (Figma 212:6324) */}
      <div 
        className={`w-full h-11 bg-[#F7F7F7] rounded-lg transition-all flex items-center justify-between pl-2 pr-4 ${
          isOpen ? 'ring-2 ring-[#7150E7]/20 bg-white border border-[#7150E7]' : 'border-none'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <img src="/header/search.svg" alt="" width={16} height={16} className="shrink-0" />
          <Input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            aria-label="Search scholarships, professors and opportunities"
            placeholder="Search scholarships by title, provider, or topic (e.g. Fulbright, AI, Germany)..."
            className="h-4 w-full min-w-0 rounded-none border-0 bg-transparent p-0 text-[12px] leading-4 tracking-[-0.192px] text-text-primary shadow-none placeholder:italic placeholder:text-[#90A1B9] focus-visible:ring-0 md:text-[12px]"
          />
        </div>

        {globalSearchQuery && (
          <button
            type="button"
            onClick={() => {
              setGlobalSearchQuery('');
              setIsOpen(false);
            }}
            className="p-1 text-[#90A1B9] hover:text-[#475467] cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Intelligent Semantic Autocomplete Dropdown Modal */}
      {isOpen && globalSearchQuery.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-13 z-[100] bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
          
          {/* Top Bar: Detected Semantic Intent Filter Pills */}
          {(parsedIntent.detectedCountry || parsedIntent.detectedFunding || parsedIntent.detectedDegree || parsedIntent.detectedCategory) && (
            <div className="px-4 py-2.5 bg-[#F9F5FF] border-b border-[#F4EBFF] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#7150E7] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#7150E7]" /> Detected Filters:
              </span>
              {parsedIntent.detectedCountry && (
                <span className="bg-white text-[#6941C6] border border-[#D6BBFB] px-2.5 py-0.5 rounded-full font-semibold text-[11px] shadow-2xs">
                  📍 {parsedIntent.detectedCountry}
                </span>
              )}
              {parsedIntent.detectedFunding && (
                <span className="bg-white text-[#027A48] border border-[#A6F4C5] px-2.5 py-0.5 rounded-full font-semibold text-[11px] shadow-2xs">
                  💰 {parsedIntent.detectedFunding === 'FREE' ? 'Free Tuition' : 'Full Funded'}
                </span>
              )}
              {parsedIntent.detectedDegree && (
                <span className="bg-white text-[#B54708] border border-[#FEDF89] px-2.5 py-0.5 rounded-full font-semibold text-[11px] shadow-2xs">
                  🎓 {parsedIntent.detectedDegree}
                </span>
              )}
              {parsedIntent.detectedCategory && (
                <span className="bg-white text-[#344054] border border-[#D0D5DD] px-2.5 py-0.5 rounded-full font-semibold text-[11px] shadow-2xs">
                  🎯 {parsedIntent.detectedCategory}
                </span>
              )}
            </div>
          )}

          {/* Results Scroll Container */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2 space-y-3">
            {searchResults.total === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <p>No exact results found for "{globalSearchQuery}".</p>
                <p className="mt-1 text-slate-400">Try searching "Full funded Scholarship in germany" or "Robotics in USA".</p>
              </div>
            ) : (
              <>
                {/* 1. Matching Scholarships */}
                {searchResults.scholarships.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="px-3 pt-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6941C6]">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#6941C6]" />
                        Matching Scholarships ({searchResults.scholarships.length})
                      </span>
                    </div>
                    {searchResults.scholarships.map((sch) => (
                      <div
                        key={sch.id}
                        onClick={() => {
                          setIsOpen(false);
                          setGlobalSearchQuery(sch.title);
                          setSelectedScholarship(sch);
                          onSelectScholarship?.(sch);
                        }}
                        className="p-3 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#101828] group-hover:text-[#6941C6] truncate">
                            {sch.title}
                          </h4>
                          <p className="text-[11px] text-[#475467] truncate mt-0.5">
                            {sch.provider} • {sch.countries.join(', ')}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {sch.fundingAmount.split('+')[0]}
                          </span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6941C6] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Matching Professors & Research Labs */}
                {searchResults.professors.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="px-3 pt-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-700">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                        Professors &amp; Labs ({searchResults.professors.length})
                      </span>
                    </div>
                    {searchResults.professors.map((prof) => (
                      <div
                        key={prof.id}
                        onClick={() => {
                          setIsOpen(false);
                          setGlobalSearchQuery(prof.name);
                          setSelectedProfessor(prof);
                          onSelectProfessor?.(prof);
                          setActiveNavTab('professors');
                          onNavigateToTab?.('professors');
                        }}
                        className="p-3 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#101828] group-hover:text-purple-700 truncate">
                              {prof.name}
                            </h4>
                            <p className="text-[11px] text-[#475467] truncate">
                              {prof.university} • {prof.country}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {prof.labName || prof.researchTags.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Matching Live Opportunities */}
                {searchResults.opportunities.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="px-3 pt-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                        Funded Lab Openings ({searchResults.opportunities.length})
                      </span>
                    </div>
                    {searchResults.opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => {
                          setIsOpen(false);
                          setGlobalSearchQuery(opp.title);
                          openColdEmailModal(opp);
                          setActiveNavTab('opportunities');
                          onNavigateToTab?.('opportunities');
                        }}
                        className="p-3 rounded-xl hover:bg-indigo-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#101828] group-hover:text-indigo-700 truncate">
                            {opp.title}
                          </h4>
                          <p className="text-[11px] text-[#475467] truncate mt-0.5">
                            {opp.institution} ({opp.country}) • {opp.funding.split('+')[0]}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Action Button */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Enter ↵</kbd> to view all results
            </span>
            <button
              type="button"
              onClick={handleApplyGlobalSearch}
              className="px-3 py-1.5 rounded-full bg-[#7150E7] hover:bg-[#5E3CD4] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span>Explore All Results</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
