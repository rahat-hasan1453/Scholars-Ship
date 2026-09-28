'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { OpportunityCard } from '@/components/OpportunityCard';
import { HeaderGlobalSearch } from '@/components/layout/HeaderGlobalSearch';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Menu01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  FilterIcon,
} from '@hugeicons/core-free-icons';
import { 
  LayoutGrid, 
  List, 
  User, 
  Settings, 
  LogOut,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const ALL_SUBJECTS = [
  'UX & Product Design',
  'HCI',
  'Computer Science',
  'Artificial Intelligence',
  'Data Science',
  'Machine Learning',
  'Human Factors',
  'Robotics',
  'Information Systems',
  'Cybersecurity',
  'Biomedical Informatics',
  'Electrical Engineering'
];

const ALL_DEGREES = [
  'Masters',
  'PhD',
  'Bachelors',
  'Postdoc'
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
  'Singapore'
];

const ALL_FUNDING = [
  'Safe Regional',
  'Tuition Waiver',
  'Full Funding',
  'Graduate Assistantship (TA/RA)',
  'Stipend / Living Allowance',
  'High Acceptance (85%+)',
  'University Fellowship'
];

export const OpportunitiesFeed: React.FC = () => {
  const { 
    opportunities, 
    profile, 
    globalSearchQuery,
    setActiveNavTab,
    setIsOnboardingOpen,
  } = useApp();

  // Multi-select Filter States initialized from Figma Node 122:3164 defaults
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'UX & Product Design', 
    'HCI', 
    'Computer Science', 
    'Artificial Intelligence'
  ]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(['Masters', 'PhD']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    'USA', 
    'Germany', 
    'United Kingdom', 
    'Canada'
  ]);
  const [selectedFunding, setSelectedFunding] = useState<string[]>([
    'Safe Regional', 
    'Tuition Waiver', 
    'Full Funding'
  ]);

  // Popover open states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isDegreeOpen, setIsDegreeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isFundingOpen, setIsFundingOpen] = useState(false);

  // Profile Menu Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (subjectRef.current && !subjectRef.current.contains(target)) setIsSubjectOpen(false);
      if (degreeRef.current && !degreeRef.current.contains(target)) setIsDegreeOpen(false);
      if (countryRef.current && !countryRef.current.contains(target)) setIsCountryOpen(false);
      if (fundingRef.current && !fundingRef.current.contains(target)) setIsFundingOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) setIsProfileMenuOpen(false);
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

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const inTitle = opp.title?.toLowerCase().includes(q);
        const inInst = opp.institution?.toLowerCase().includes(q);
        const inAuthor = opp.authorName?.toLowerCase().includes(q);
        const inTags = opp.fieldTags?.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inInst && !inAuthor && !inTags) return false;
      }

      // 2. Degree filter
      if (selectedDegrees.length > 0) {
        const matchesDegree = opp.degrees?.some(d => selectedDegrees.includes(d));
        if (!matchesDegree) return false;
      }

      // 3. Country filter
      if (selectedCountries.length > 0) {
        const oppCountry = opp.country?.toLowerCase() || '';
        const matchesCountry = selectedCountries.some(c => {
          const sc = c.toLowerCase();
          return oppCountry.includes(sc) || sc.includes(oppCountry);
        });
        if (!matchesCountry) return false;
      }

      // 4. Subject filter
      if (selectedSubjects.length > 0) {
        const matchesSubject = opp.fieldTags?.some(tag => 
          selectedSubjects.some(sub => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('ux') && (t.includes('design') || t.includes('ux'))) return true;
            if (s.includes('hci') && (t.includes('hci') || t.includes('interaction'))) return true;
            if (s.includes('computer') && t.includes('cs')) return true;
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
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      
      {/* 
        ========================================================================
        FIGMA NODE 122:3164: SINGLE UNIFIED HEADER CONTAINER
        "Header (HighScholar | Global Scholarship & Professor Finder Portal)"
        - Fills: Solid White (#FFFFFF) 95% opacity with backdrop-blur
        - Padding: 16px vertical, 20px-32px horizontal
        - Spacing: 16px between children
        - Bottom Border: #EAECF0
        ========================================================================
      */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#EAECF0] px-4 sm:px-6 lg:px-8 py-4 space-y-4 shrink-0 shadow-2xs">
        
        {/* ROW 1: Omnisearch Input + User Profile (Figma Frame 2147226771) */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Mobile Menu Toggle button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
            title="Open navigation menu"
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </button>

          {/* Omnisearch Box (Figma Node 122:3166) */}
          <div className="flex-1 min-w-0">
            <HeaderGlobalSearch onNavigateToTab={(tab) => setActiveNavTab(tab)} />
          </div>

          {/* User Profile Badge (Figma Node 122:3174 Frame 2147226782) */}
          <div ref={profileMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
              title="User Profile"
            >
              {/* 32x32 Avatar with Green Online Status Dot (Figma 122:3175) */}
              <div className="relative shrink-0">
                <img
                  src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                  alt={profile.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-[#F4F6F8]"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#36B37E] ring-1.5 ring-white" />
              </div>

              {/* User Name & Degree Subtitle matching Figma Node 122:3181 */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#101828] leading-tight">
                  {profile.name || 'Ingrid Bergman'}
                </span>
                <span className="text-xs italic text-[#90A1B9] leading-tight mt-0.5">
                  {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu (Figma Node 49:648) */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-white rounded-2xl border border-[#EAECF0] shadow-xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Header Row */}
                <div className="flex items-center gap-3 pb-1">
                  <div className="relative shrink-0">
                    <img
                      src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                      alt={profile.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EAECF0]"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] rounded-full border-2 border-white" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#101828] leading-tight truncate">
                      {profile.name || 'Ingrid Bergman'}
                    </div>
                    <div className="text-xs text-[#667085] font-normal leading-tight mt-0.5 truncate">
                      {profile.email || 'ingrid.bergman@example.com'}
                    </div>
                  </div>
                </div>

                <hr className="border-[#F2F4F7] my-2" />

                {/* Menu Items */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab('profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#F8FAFC] group-hover:bg-[#EDE9FE] flex items-center justify-center text-[#344054] group-hover:text-[#6941C6] transition-colors">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[#101828] group-hover:text-[#6941C6] transition-colors">
                      Profile
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboardingOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#F8FAFC] group-hover:bg-[#EDE9FE] flex items-center justify-center text-[#344054] group-hover:text-[#6941C6] transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[#101828] group-hover:text-[#6941C6] transition-colors">
                      Settings
                    </span>
                  </button>
                </div>

                <hr className="border-[#F2F4F7] my-2" />

                {/* Logout Button */}
                <Link
                  href="/login"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                  }}
                  className="w-full h-8 sm:h-8.5 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#F04438] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#F04438]" />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Title + Subtitle (Figma Frame 2147226783 Node 122:3185) */}
        <div className="space-y-0.5">
          <h1 className="text-base font-semibold text-[#101828] tracking-tight leading-6">
            Find Your Desired Scholarship, Lab &amp; Safe Universities
          </h1>
          <p className="text-sm text-[#475467] font-normal leading-5">
            A quick search links you to scholarships, expert professors, and trusted regional universities.
          </p>
        </div>

        {/* ROW 3: 4 Selection/Filter Fields (Figma Frame 2147226775 Node 122:3188) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          
          {/* 1. SUBJECT SELECTION (Figma Group 3 Node 122:3191) */}
          <div className="relative" ref={subjectRef}>
            {/* Floating Label */}
            <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
              <span>Subject</span>
            </div>

            {/* Selection Trigger Box */}
            <div 
              onClick={() => setIsSubjectOpen(prev => !prev)}
              className="h-12 border border-[#EAECF0] hover:border-[#D0D5DD] rounded-xl px-3 flex items-center justify-between bg-white cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
                {selectedSubjects.length === 0 ? (
                  <span className="text-xs text-[#98A2B3]">Select subjects...</span>
                ) : (
                  <>
                    {selectedSubjects.slice(0, 2).map((s) => (
                      <span 
                        key={s} 
                        className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <span className="whitespace-nowrap">{s}</span>
                        <span 
                          onClick={(e) => removeSubject(s, e)}
                          className="p-0.5 hover:text-red-500 rounded-xs cursor-pointer"
                          title={`Remove ${s}`}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={11} />
                        </span>
                      </span>
                    ))}
                    {selectedSubjects.length > 2 && (
                      <span className="bg-[#F2F4F7] text-[#344054] text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                        +{selectedSubjects.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>

              <HugeiconsIcon 
                icon={ArrowDown01Icon} 
                size={16} 
                className={`text-[#667085] shrink-0 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} 
              />
            </div>

            {/* Subject Popover Dropdown */}
            {isSubjectOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                {/* Search */}
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Search subject..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#EAECF0] rounded-lg focus:outline-hidden focus:border-[#7150E7]"
                    autoFocus
                  />
                </div>

                {/* Options List */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredSubjectOptions.map((s) => {
                    const isChecked = selectedSubjects.includes(s);
                    return (
                      <div
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#EDE9FE] text-[#7150E7] font-semibold' : 'hover:bg-slate-50 text-[#344054]'
                        }`}
                      >
                        <span>{s}</span>
                        {isChecked && (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-[#7150E7]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. DEGREE SELECTION (Figma Group 4 Node 122:3209) */}
          <div className="relative" ref={degreeRef}>
            {/* Floating Label */}
            <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
              <span>Degree</span>
            </div>

            {/* Selection Trigger Box */}
            <div 
              onClick={() => setIsDegreeOpen(prev => !prev)}
              className="h-12 border border-[#EAECF0] hover:border-[#D0D5DD] rounded-xl px-3 flex items-center justify-between bg-white cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
                {selectedDegrees.length === 0 ? (
                  <span className="text-xs text-[#98A2B3]">Select degrees...</span>
                ) : (
                  <>
                    {selectedDegrees.slice(0, 2).map((d) => (
                      <span 
                        key={d} 
                        className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <span>{d}</span>
                        <span 
                          onClick={(e) => removeDegree(d, e)}
                          className="p-0.5 hover:text-red-500 rounded-xs cursor-pointer"
                          title={`Remove ${d}`}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={11} />
                        </span>
                      </span>
                    ))}
                    {selectedDegrees.length > 2 && (
                      <span className="bg-[#F2F4F7] text-[#344054] text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                        +{selectedDegrees.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>

              <HugeiconsIcon 
                icon={ArrowDown01Icon} 
                size={16} 
                className={`text-[#667085] shrink-0 transition-transform ${isDegreeOpen ? 'rotate-180' : ''}`} 
              />
            </div>

            {/* Degree Popover Dropdown */}
            {isDegreeOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-1 animate-in fade-in slide-in-from-top-1">
                {ALL_DEGREES.map((d) => {
                  const isChecked = selectedDegrees.includes(d);
                  return (
                    <div
                      key={d}
                      onClick={() => toggleDegree(d)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#EDE9FE] text-[#7150E7] font-semibold' : 'hover:bg-slate-50 text-[#344054]'
                      }`}
                    >
                      <span>{d}</span>
                      {isChecked && (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-[#7150E7]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. COUNTRY SELECTION (Figma Group 5 Node 122:3229) */}
          <div className="relative" ref={countryRef}>
            {/* Floating Label */}
            <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
              <span>Country</span>
            </div>

            {/* Selection Trigger Box */}
            <div 
              onClick={() => setIsCountryOpen(prev => !prev)}
              className="h-12 border border-[#EAECF0] hover:border-[#D0D5DD] rounded-xl px-3 flex items-center justify-between bg-white cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
                {selectedCountries.length === 0 ? (
                  <span className="text-xs text-[#98A2B3]">Select countries...</span>
                ) : (
                  <>
                    {selectedCountries.slice(0, 2).map((c) => (
                      <span 
                        key={c} 
                        className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <span>{c}</span>
                        <span 
                          onClick={(e) => removeCountry(c, e)}
                          className="p-0.5 hover:text-red-500 rounded-xs cursor-pointer"
                          title={`Remove ${c}`}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={11} />
                        </span>
                      </span>
                    ))}
                    {selectedCountries.length > 2 && (
                      <span className="bg-[#F2F4F7] text-[#344054] text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                        +{selectedCountries.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>

              <HugeiconsIcon 
                icon={ArrowDown01Icon} 
                size={16} 
                className={`text-[#667085] shrink-0 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} 
              />
            </div>

            {/* Country Popover Dropdown */}
            {isCountryOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                {/* Search */}
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#EAECF0] rounded-lg focus:outline-hidden focus:border-[#7150E7]"
                    autoFocus
                  />
                </div>

                {/* Options List */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredCountryOptions.map((c) => {
                    const isChecked = selectedCountries.includes(c);
                    return (
                      <div
                        key={c}
                        onClick={() => toggleCountry(c)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#EDE9FE] text-[#7150E7] font-semibold' : 'hover:bg-slate-50 text-[#344054]'
                        }`}
                      >
                        <span>{c}</span>
                        {isChecked && (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-[#7150E7]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. ACCEPTANCE & FUNDING SELECTION (Figma Group 6 Node 122:3251) */}
          <div className="relative" ref={fundingRef}>
            {/* Floating Label */}
            <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
              <span>Acceptance &amp; Funding</span>
            </div>

            {/* Selection Trigger Box */}
            <div 
              onClick={() => setIsFundingOpen(prev => !prev)}
              className="h-12 border border-[#EAECF0] hover:border-[#D0D5DD] rounded-xl px-3 flex items-center justify-between bg-white cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
                {selectedFunding.length === 0 ? (
                  <span className="text-xs text-[#98A2B3]">Select funding...</span>
                ) : (
                  <>
                    {selectedFunding.slice(0, 1).map((f) => (
                      <span 
                        key={f} 
                        className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <span className="whitespace-nowrap">{f}</span>
                        <span 
                          onClick={(e) => removeFunding(f, e)}
                          className="p-0.5 hover:text-red-500 rounded-xs cursor-pointer"
                          title={`Remove ${f}`}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={11} />
                        </span>
                      </span>
                    ))}
                    {selectedFunding.length > 1 && (
                      <span className="bg-[#F2F4F7] text-[#344054] text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                        +{selectedFunding.length - 1}
                      </span>
                    )}
                  </>
                )}
              </div>

              <HugeiconsIcon 
                icon={ArrowDown01Icon} 
                size={16} 
                className={`text-[#667085] shrink-0 transition-transform ${isFundingOpen ? 'rotate-180' : ''}`} 
              />
            </div>

            {/* Funding Popover Dropdown */}
            {isFundingOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-1 animate-in fade-in slide-in-from-top-1">
                {ALL_FUNDING.map((f) => {
                  const isChecked = selectedFunding.includes(f);
                  return (
                    <div
                      key={f}
                      onClick={() => toggleFunding(f)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#EDE9FE] text-[#7150E7] font-semibold' : 'hover:bg-slate-50 text-[#344054]'
                      }`}
                    >
                      <span className="truncate">{f}</span>
                      {isChecked && (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-[#7150E7] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 
        ========================================================================
        BODY CONTENT AREA BELOW UNIFIED HEADER:
        Figma Node 116:1921 Frame 2147226743
        - Opportunity List Bar (48 items, acceptance rate badge, view toggle)
        - 3-Column Opportunity Cards Grid
        ========================================================================
      {/* Fix #9: Body white background wrapper matching Figma Node 116:1921 (fills: white, padding: 20px) */}
      <div className="bg-white flex-1">
        <div className="p-5 max-w-[1172px] mx-auto w-full space-y-5">
        
          {/* Opportunity List Sub-Bar (Figma Frame 2147226741 Node 116:1923) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left Title & Subtitle */}
            <div>
              <div className="flex items-baseline gap-1">
                {/* Fix #8: Figma fontSize:16, fontWeight:590 → text-base font-semibold */}
                <h2 className="text-base font-semibold text-[#101828] leading-tight">
                  Opportunity List
                </h2>
                {/* Figma: fontSize:12, fontWeight:400, color: rgb(145,158,171) */}
                <span className="text-xs font-normal text-[#919EAB]">
                  / {filteredOpportunities.length} Items
                </span>
              </div>
              {/* Figma: fontSize:12, fontWeight:400, color: rgb(144,161,185) */}
              <p className="text-xs text-[#90A1B9] mt-0.5">
                Safe-Bet Universities with Guaranteed Funding &amp; Assistantships
              </p>
            </div>

            {/* Right: Acceptance Rate Text + Grid/List View Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Figma: plain text, fontSize:12, fontWeight:700, color: rgb(0,153,102) — no pill/bg */}
              <span className="text-xs font-bold text-[#009966] select-none">
                ✓ 85% – 95% Acceptance Rate
              </span>

              {/* Fix #6: View Mode Switcher Container (Figma 116:2372) 
                   bg=white, border=rgb(208,213,221), cornerRadius=20, padding=2px
                   Active button: bg=#F4F3FE (lavender), icon #7150E7
                   Inactive button: no bg, icon #667085 */}
              <div className="bg-white border border-[#D0D5DD] rounded-[20px] p-0.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-2xl transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'text-[#7050E6] bg-[#F4F3FE] shadow-xs'
                      : 'text-[#667085] hover:text-[#475467]'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-2xl transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'text-[#7050E6] bg-[#F4F3FE] shadow-xs'
                      : 'text-[#667085] hover:text-[#475467]'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Opportunities Grid / List (Figma Frame 2147226740 Node 116:1930) */}
          {filteredOpportunities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7150E7] flex items-center justify-center mx-auto">
                <HugeiconsIcon icon={FilterIcon} size={24} />
              </div>
              <h3 className="text-base font-bold text-[#101828]">No matching opportunities found</h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto">
                Try removing some subject or country filters to view more scholarship and funding opportunities.
              </p>
              <button
                onClick={() => {
                  setSelectedSubjects(['UX & Product Design', 'HCI']);
                  setSelectedDegrees(['Masters', 'PhD']);
                  setSelectedCountries(['USA', 'Germany']);
                  setSelectedFunding(['Safe Regional']);
                }}
                className="px-4 py-2 bg-[#7050E6] text-white text-xs font-semibold rounded-full hover:bg-[#5D3FD3] transition-colors cursor-pointer"
              >
                Reset to Default Filters
              </button>
            </div>
          ) : (
            /* Fix #3: grid gap-5 → gap-4 (Figma itemSpacing:16) */
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            }>
              {filteredOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
