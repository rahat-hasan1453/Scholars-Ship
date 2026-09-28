'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { OpportunityCard } from './OpportunityCard';
import { DegreeLevel, HiringOpportunity } from '@/types';
import { 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Check, 
  X, 
  Search,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const ALL_SUBJECTS = [
  'UX & Product Design',
  'HCI',
  'Human-Computer Interaction (HCI)',
  'Computer Science',
  'Artificial Intelligence',
  'Data Science & Analytics',
  'Machine Learning',
  'Biotechnology',
  'Biomedical Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Renewable Energy',
  'Physics & Quantum Computing',
  'Economics & Econometrics',
  'Public Health & Epidemiology',
  'Robotics & Autonomous Systems',
  'Software Engineering'
];

const ALL_COUNTRIES = [
  'USA',
  'Germany',
  'United Kingdom',
  'Canada',
  'Switzerland',
  'Australia',
  'Netherlands',
  'Sweden',
  'France',
  'Japan',
  'South Korea',
  'Singapore'
];

const ALL_DEGREES: DegreeLevel[] = ['Masters', 'PhD', 'Bachelors'];

const ALL_FUNDING_TYPES = [
  'Safe Regional',
  'Full Funding',
  'Tuition Waiver',
  'Graduate Assistantship (TA/RA)',
  'University Fellowship'
];

export const OpportunitiesFeed: React.FC = () => {
  const { 
    opportunities, 
    profile, 
    globalSearchQuery 
  } = useApp();

  // Multi-select Filter States initialized from Figma defaults / user profile
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['UX & Product Design', 'HCI']);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(['Masters', 'PhD']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['USA', 'Germany']);
  const [selectedFunding, setSelectedFunding] = useState<string[]>(['Safe Regional']);

  // Popover open states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isDegreeOpen, setIsDegreeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isFundingOpen, setIsFundingOpen] = useState(false);

  // Search inside popovers
  const [subjectSearch, setSubjectSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // View Mode: Grid or List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Refs for clicking outside
  const subjectRef = useRef<HTMLDivElement>(null);
  const degreeRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const fundingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (subjectRef.current && !subjectRef.current.contains(target)) setIsSubjectOpen(false);
      if (degreeRef.current && !degreeRef.current.contains(target)) setIsDegreeOpen(false);
      if (countryRef.current && !countryRef.current.contains(target)) setIsCountryOpen(false);
      if (fundingRef.current && !fundingRef.current.contains(target)) setIsFundingOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle helpers
  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const removeSubject = (s: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubjects(prev => prev.filter(x => x !== s));
  };

  const toggleDegree = (d: string) => {
    setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };
  const removeDegree = (d: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDegrees(prev => prev.filter(x => x !== d));
  };

  const toggleCountry = (c: string) => {
    setSelectedCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };
  const removeCountry = (c: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCountries(prev => prev.filter(x => x !== c));
  };

  const toggleFunding = (f: string) => {
    setSelectedFunding(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };
  const removeFunding = (f: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFunding(prev => prev.filter(x => x !== f));
  };

  const resetAllFilters = () => {
    setSelectedSubjects([]);
    setSelectedDegrees([]);
    setSelectedCountries([]);
    setSelectedFunding([]);
  };

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inTitle = opp.title.toLowerCase().includes(q);
        const inInst = opp.institution.toLowerCase().includes(q);
        const inAuthor = opp.authorName?.toLowerCase().includes(q);
        const inTags = opp.fieldTags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inInst && !inAuthor && !inTags) return false;
      }

      // 2. Degree filter
      if (selectedDegrees.length > 0) {
        const matchesDegree = opp.degrees.some(d => selectedDegrees.includes(d));
        if (!matchesDegree) return false;
      }

      // 3. Country filter
      if (selectedCountries.length > 0) {
        const oppCountry = opp.country.toLowerCase();
        const matchesCountry = selectedCountries.some(c => {
          const sc = c.toLowerCase();
          return oppCountry.includes(sc) || sc.includes(oppCountry);
        });
        if (!matchesCountry) return false;
      }

      // 4. Subject filter
      if (selectedSubjects.length > 0) {
        const matchesSubject = opp.fieldTags.some(tag => 
          selectedSubjects.some(sub => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('ux') && t.includes('design')) return true;
            if (s.includes('cs') && t.includes('computer')) return true;
            if (s.includes('hci') && (t.includes('interaction') || t.includes('human'))) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      return true;
    });
  }, [opportunities, globalSearchQuery, selectedDegrees, selectedCountries, selectedSubjects]);

  // Subject search filtered
  const filteredSubjectOptions = useMemo(() => {
    if (!subjectSearch.trim()) return ALL_SUBJECTS;
    return ALL_SUBJECTS.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()));
  }, [subjectSearch]);

  // Country search filtered
  const filteredCountryOptions = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  return (
    <div className="space-y-6">
      
      {/* Figma Top Intro (Node 116:3082) */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-[22px] font-bold text-[#101828] tracking-tight">
          Find Your Desired Scholarship, Lab & Safe Universities
        </h1>
        <p className="text-xs sm:text-sm text-[#475467] font-normal">
          A quick search links you to scholarships, expert professors, and trusted regional universities.
        </p>
      </div>

      {/* Figma 4-Column Floating-Label Filter Inputs (Node 116:2392) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-30">
        
        {/* 1. SUBJECT FILTER FIELD */}
        <div ref={subjectRef} className="relative">
          {/* Floating Label */}
          <span className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] italic font-normal text-[#90A0B9] z-10 pointer-events-none select-none">
            Subject
          </span>

          {/* Trigger Box */}
          <div 
            onClick={() => setIsSubjectOpen(prev => !prev)}
            className={`w-full h-12 bg-white rounded-xl border px-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
              isSubjectOpen ? 'border-[#7150E7] ring-2 ring-[#EDE9FC]' : 'border-[#E1E7F0] hover:border-[#CBD5E1]'
            }`}
          >
            {/* Chips Container */}
            <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
              {selectedSubjects.length === 0 ? (
                <span className="text-xs text-[#98A2B3] italic">Select Subjects...</span>
              ) : (
                <>
                  {selectedSubjects.slice(0, 2).map(sub => (
                    <span 
                      key={sub}
                      className="bg-[#F0F3F4] text-[#212B36] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                    >
                      <span className="max-w-[85px] truncate">{sub}</span>
                      <button 
                        type="button"
                        onClick={(e) => removeSubject(sub, e)}
                        className="text-[#98A2B3] hover:text-[#475467] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {selectedSubjects.length > 2 && (
                    <span className="bg-[#F0F3F4] text-[#212B36] text-[11px] italic font-medium px-1.5 py-0.5 rounded-full shrink-0">
                      +{selectedSubjects.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>

            <ChevronDown className={`w-4 h-4 text-[#98A2B3] shrink-0 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Popover Dropdown */}
          {isSubjectOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full sm:w-72 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#EAECF0] rounded-lg focus:outline-none focus:border-[#7150E7]"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filteredSubjectOptions.map(sub => {
                  const isChecked = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer"
                    >
                      <span className={isChecked ? 'font-semibold text-[#6941C6]' : 'text-[#344054]'}>
                        {sub}
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#6941C6]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. DEGREE FILTER FIELD */}
        <div ref={degreeRef} className="relative">
          <span className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] italic font-normal text-[#90A0B9] z-10 pointer-events-none select-none">
            Degree
          </span>

          <div 
            onClick={() => setIsDegreeOpen(prev => !prev)}
            className={`w-full h-12 bg-white rounded-xl border px-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
              isDegreeOpen ? 'border-[#7150E7] ring-2 ring-[#EDE9FC]' : 'border-[#E1E7F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
              {selectedDegrees.length === 0 ? (
                <span className="text-xs text-[#98A2B3] italic">Select Degrees...</span>
              ) : (
                <>
                  {selectedDegrees.slice(0, 2).map(deg => (
                    <span 
                      key={deg}
                      className="bg-[#F0F3F4] text-[#212B36] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                    >
                      <span>{deg}</span>
                      <button 
                        type="button"
                        onClick={(e) => removeDegree(deg, e)}
                        className="text-[#98A2B3] hover:text-[#475467] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {selectedDegrees.length > 2 && (
                    <span className="bg-[#F0F3F4] text-[#212B36] text-[11px] italic font-medium px-1.5 py-0.5 rounded-full shrink-0">
                      +{selectedDegrees.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>

            <ChevronDown className={`w-4 h-4 text-[#98A2B3] shrink-0 transition-transform ${isDegreeOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDegreeOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl border border-[#EAECF0] shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="space-y-0.5">
                {ALL_DEGREES.map(deg => {
                  const isChecked = selectedDegrees.includes(deg);
                  return (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => toggleDegree(deg)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer"
                    >
                      <span className={isChecked ? 'font-semibold text-[#6941C6]' : 'text-[#344054]'}>
                        {deg}
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#6941C6]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. COUNTRY FILTER FIELD */}
        <div ref={countryRef} className="relative">
          <span className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] italic font-normal text-[#90A0B9] z-10 pointer-events-none select-none">
            Country
          </span>

          <div 
            onClick={() => setIsCountryOpen(prev => !prev)}
            className={`w-full h-12 bg-white rounded-xl border px-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
              isCountryOpen ? 'border-[#7150E7] ring-2 ring-[#EDE9FC]' : 'border-[#E1E7F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
              {selectedCountries.length === 0 ? (
                <span className="text-xs text-[#98A2B3] italic">Select Country...</span>
              ) : (
                <>
                  {selectedCountries.slice(0, 2).map(c => (
                    <span 
                      key={c}
                      className="bg-[#F0F3F4] text-[#212B36] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                    >
                      <span>{c}</span>
                      <button 
                        type="button"
                        onClick={(e) => removeCountry(c, e)}
                        className="text-[#98A2B3] hover:text-[#475467] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {selectedCountries.length > 2 && (
                    <span className="bg-[#F0F3F4] text-[#212B36] text-[11px] italic font-medium px-1.5 py-0.5 rounded-full shrink-0">
                      +{selectedCountries.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>

            <ChevronDown className={`w-4 h-4 text-[#98A2B3] shrink-0 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
          </div>

          {isCountryOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full sm:w-64 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#EAECF0] rounded-lg focus:outline-none focus:border-[#7150E7]"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filteredCountryOptions.map(c => {
                  const isChecked = selectedCountries.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCountry(c)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer"
                    >
                      <span className={isChecked ? 'font-semibold text-[#6941C6]' : 'text-[#344054]'}>
                        {c}
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#6941C6]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. ACCEPTANCE & FUNDING FILTER FIELD */}
        <div ref={fundingRef} className="relative">
          <span className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] italic font-normal text-[#90A0B9] z-10 pointer-events-none select-none">
            Acceptance & Funding
          </span>

          <div 
            onClick={() => setIsFundingOpen(prev => !prev)}
            className={`w-full h-12 bg-white rounded-xl border px-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
              isFundingOpen ? 'border-[#7150E7] ring-2 ring-[#EDE9FC]' : 'border-[#E1E7F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
              {selectedFunding.length === 0 ? (
                <span className="text-xs text-[#98A2B3] italic">Select Criteria...</span>
              ) : (
                <>
                  {selectedFunding.slice(0, 1).map(f => (
                    <span 
                      key={f}
                      className="bg-[#F0F3F4] text-[#212B36] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                    >
                      <span className="max-w-[105px] truncate">{f}</span>
                      <button 
                        type="button"
                        onClick={(e) => removeFunding(f, e)}
                        className="text-[#98A2B3] hover:text-[#475467] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {selectedFunding.length > 1 && (
                    <span className="bg-[#F0F3F4] text-[#212B36] text-[11px] italic font-medium px-1.5 py-0.5 rounded-full shrink-0">
                      +{selectedFunding.length - 1}
                    </span>
                  )}
                </>
              )}
            </div>

            <ChevronDown className={`w-4 h-4 text-[#98A2B3] shrink-0 transition-transform ${isFundingOpen ? 'rotate-180' : ''}`} />
          </div>

          {isFundingOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full sm:w-64 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="space-y-0.5">
                {ALL_FUNDING_TYPES.map(f => {
                  const isChecked = selectedFunding.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFunding(f)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer"
                    >
                      <span className={isChecked ? 'font-semibold text-[#6941C6]' : 'text-[#344054]'}>
                        {f}
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#6941C6]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Figma Opportunity List Bar (Node 116:2391 / Section Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-[#101828]">
              Opportunity List
            </h2>
            <span className="text-xs italic text-[#98A2B3] font-normal">
              / {filteredOpportunities.length} Items
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Safe-Bet Universities with Guaranteed Funding & Assistantships
          </p>
        </div>

        {/* Right Controls: Acceptance Rate Badge & Grid/List View Mode */}
        <div className="flex items-center gap-3.5 self-end sm:self-center">
          {/* Acceptance Rate Badge (Figma Style) */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48] select-none">
            <span className="text-[#12B76A] font-bold text-sm">✓</span>
            <span>85% – 95% Acceptance Rate</span>
          </div>

          {/* Grid / List Switcher */}
          <div className="h-8 p-0.5 bg-white border border-[#E1E7F0] rounded-lg inline-flex items-center gap-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-[#EDE9FC] text-[#6941C6]' 
                  : 'text-[#98A2B3] hover:text-[#344054]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-[#EDE9FC] text-[#6941C6]' 
                  : 'text-[#98A2B3] hover:text-[#344054]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Tags Row (if any filter active) */}
      {(selectedSubjects.length > 0 || selectedDegrees.length > 0 || selectedCountries.length > 0 || selectedFunding.length > 0 || globalSearchQuery.trim()) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs text-[#667085] font-medium">Active Filters:</span>
          
          {selectedSubjects.map(s => (
            <span key={s} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span>{s}</span>
              <button type="button" onClick={(e) => removeSubject(s, e)} className="hover:text-red-500 cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {selectedDegrees.map(d => (
            <span key={d} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span>{d}</span>
              <button type="button" onClick={(e) => removeDegree(d, e)} className="hover:text-red-500 cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {selectedCountries.map(c => (
            <span key={c} className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span>{c}</span>
              <button type="button" onClick={(e) => removeCountry(c, e)} className="hover:text-red-500 cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {globalSearchQuery.trim() && (
            <span className="bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span>Search: &ldquo;{globalSearchQuery}&rdquo;</span>
            </span>
          )}

          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-[#6941C6] hover:underline font-semibold ml-1 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Grid or List of Opportunity Cards (Populated from System Data) */}
      {filteredOpportunities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#EDE9FE] text-[#6941C6] rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#101828]">No Matching Opportunities Found</h3>
          <p className="text-xs text-[#667085] max-w-md mx-auto">
            We couldn&apos;t find opportunities matching your selected combination of subjects, degrees, and countries. Try adjusting your filters.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="h-9 px-4 rounded-xl bg-[#6941C6] text-white text-xs font-semibold hover:bg-[#5925DC] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}

    </div>
  );
};
