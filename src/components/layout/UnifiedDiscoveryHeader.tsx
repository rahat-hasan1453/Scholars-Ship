'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { HeaderGlobalSearch } from '@/components/layout/HeaderGlobalSearch';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Menu01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { User, Settings, LogOut } from 'lucide-react';

export const ALL_SUBJECTS = [
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

export const ALL_DEGREES = [
  'Masters',
  'PhD',
  'Bachelors',
  'Postdoc'
];

export const ALL_COUNTRIES = [
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

export const ALL_FUNDING = [
  'Safe Regional',
  'Tuition Waiver',
  'Full Funding',
  'Graduate Assistantship (TA/RA)',
  'Stipend / Living Allowance',
  'High Acceptance (85%+)',
  'University Fellowship'
];

export interface UnifiedDiscoveryHeaderProps {
  selectedSubjects: string[];
  setSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  selectedDegrees: string[];
  setSelectedDegrees: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCountries: string[];
  setSelectedCountries: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFunding: string[];
  setSelectedFunding: React.Dispatch<React.SetStateAction<string[]>>;
  title?: string;
  subtitle?: string;
}

export const UnifiedDiscoveryHeader: React.FC<UnifiedDiscoveryHeaderProps> = ({
  selectedSubjects,
  setSelectedSubjects,
  selectedDegrees,
  setSelectedDegrees,
  selectedCountries,
  setSelectedCountries,
  selectedFunding,
  setSelectedFunding,
  title = 'Find Your Desired Scholarship, Lab & Safe Universities',
  subtitle = 'A quick search links you to scholarships, expert professors, and trusted regional universities.',
}) => {
  const { profile, setActiveNavTab, setIsOnboardingOpen } = useApp();

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

  // Filter options with search
  const filteredSubjectOptions = useMemo(() => {
    if (!subjectSearch.trim()) return ALL_SUBJECTS;
    return ALL_SUBJECTS.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()));
  }, [subjectSearch]);

  const filteredCountryOptions = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  return (
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
            {/* 32x32 Avatar with Green Online Status Dot */}
            <div className="relative shrink-0">
              <img
                src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={profile.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-[#F4F6F8]"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#36B37E] ring-1.5 ring-white" />
            </div>

            {/* User Name & Degree Subtitle matching Figma */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#101828] leading-tight">
                {profile.name || 'Ingrid Bergman'}
              </span>
              <span className="text-xs italic text-[#90A1B9] leading-tight mt-0.5">
                {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-white rounded-2xl border border-[#EAECF0] shadow-xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
          {title}
        </h1>
        <p className="text-sm text-[#475467] font-normal leading-5">
          {subtitle}
        </p>
      </div>

      {/* ROW 3: 4 Selection/Filter Fields (Figma Frame 2147226775 Node 122:3188) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* 1. SUBJECT */}
        <div className="relative" ref={subjectRef}>
          <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
            <span>Subject</span>
          </div>

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

          {isSubjectOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-1">
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

        {/* 2. DEGREE */}
        <div className="relative" ref={degreeRef}>
          <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
            <span>Degree</span>
          </div>

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

        {/* 3. COUNTRY */}
        <div className="relative" ref={countryRef}>
          <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
            <span>Country</span>
          </div>

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

          {isCountryOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-[#EAECF0] shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-1">
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

        {/* 4. ACCEPTANCE & FUNDING */}
        <div className="relative" ref={fundingRef}>
          <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-[#344054] flex items-center gap-1 z-10 rounded-sm">
            <span>Acceptance &amp; Funding</span>
          </div>

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
  );
};
