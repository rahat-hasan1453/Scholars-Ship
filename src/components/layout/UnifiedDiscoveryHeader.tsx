'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { HeaderGlobalSearch } from '@/components/layout/HeaderGlobalSearch';
import { MenuIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/shadcn/toggle-group';
import { MultiSelectField } from '@/components/layout/MultiSelectField';
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
  'Norway',
  'France',
  'Japan',
  'Singapore',
  'South Korea'
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

// Round flags in /public/flags, keyed by ALL_COUNTRIES value
export const COUNTRY_FLAGS: Record<string, string> = {
  USA: '/flags/us.svg',
  Germany: '/flags/de.svg',
  'United Kingdom': '/flags/gb.svg',
  Canada: '/flags/ca.svg',
  Switzerland: '/flags/ch.svg',
  Australia: '/flags/au.svg',
  Netherlands: '/flags/nl.svg',
  Sweden: '/flags/se.svg',
  Norway: '/flags/no.svg',
  France: '/flags/fr.svg',
  Japan: '/flags/jp.svg',
  Singapore: '/flags/sg.svg',
  'South Korea': '/flags/kr.svg',
};

export const FUNDING_DESCRIPTIONS: Record<string, string> = {
  'Safe Regional': 'Regional universities where your profile comfortably meets the admission bar',
  'Tuition Waiver': 'Tuition fees are fully or partly waived',
  'Full Funding': 'Tuition plus a living stipend are covered',
  'Graduate Assistantship (TA/RA)': 'Paid teaching or research job, often with a tuition waiver',
  'Stipend / Living Allowance': 'A monthly allowance for rent, food and other living costs',
  'High Acceptance (85%+)': 'Programs that admit 85% or more of applicants',
  'University Fellowship': "A merit award from the university — no work required",
};

export type MatchMode = 'all' | 'resume';

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
  matchMode?: MatchMode;
  onMatchModeChange?: (mode: MatchMode) => void;
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
  matchMode: matchModeProp,
  onMatchModeChange,
}) => {
  const { profile, setActiveNavTab, setIsOnboardingOpen } = useApp();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  // "All / Resume Customised" — UI only for now; uncontrolled unless the page passes it in
  const [localMatchMode, setLocalMatchMode] = useState<MatchMode>('all');
  const matchMode = matchModeProp ?? localMatchMode;

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const toggleItemClass =
    'h-8 min-w-0 px-[10px] font-[family-name:var(--font-inter)] text-[14px] leading-5 font-medium cursor-pointer border border-[#e1e8f0] bg-white text-text-secondary hover:bg-[#f4f2fd] hover:text-text-secondary data-[state=on]:z-10 data-[state=on]:border-[#7150e7] data-[state=on]:bg-[#ede9fc] data-[state=on]:text-[#6f4fe4] data-[spacing=0]:first:rounded-l-[10px] data-[spacing=0]:last:rounded-r-[10px] data-[spacing=0]:last:-ml-px';

  return (
    // Figma header (212:6322)
    <header className="w-full shrink-0 flex flex-col gap-4 px-5 py-4 bg-white border-b-4 border-[#f1f1f1]">
      {/* Row 1: search + user */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))}
          className="lg:hidden -mr-3 p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <MenuIcon size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <HeaderGlobalSearch onNavigateToTab={(tab) => setActiveNavTab(tab)} />
        </div>

        <div ref={profileMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-expanded={isProfileMenuOpen}
            className="flex h-11 items-center gap-2 rounded-lg px-2 py-1 text-left cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="relative size-8 shrink-0">
              <img
                src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={profile.name || 'User'}
                className="size-8 rounded-full object-cover border-[0.667px] border-[#f4f6f8]"
              />
              <span className="absolute bottom-[1.33px] right-[1.33px] size-[6.667px] rounded-full bg-success-main border-[0.667px] border-white" />
            </span>
            <span className="hidden sm:flex w-[145px] flex-col gap-1">
              <span className="truncate text-[12px] leading-4 font-bold tracking-[-0.192px] text-text-primary">
                {profile.name || 'Ingrid Bergman'}
              </span>
              <span className="truncate text-[12px] leading-4 italic tracking-[-0.192px] text-text-secondary">
                {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
              </span>
            </span>
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

              <button
                type="button"
                onClick={async () => {
                  setIsProfileMenuOpen(false);
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch {}
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('highscholar_profile_v2');
                    window.location.href = '/login';
                  }
                }}
                className="w-full h-8 sm:h-8.5 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#F04438] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#F04438]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: title + match-mode toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-1 min-w-0 flex-col gap-1">
            <h1 className="text-[16px] leading-6 font-medium text-text-primary">{title}</h1>
            <p className="text-[14px] leading-5 tracking-[-0.3424px] text-text-secondary">{subtitle}</p>
          </div>
          <ToggleGroup
            type="single"
            value={matchMode}
            onValueChange={(v) => {
              if (!v) return; // keep one option selected
              setLocalMatchMode(v as MatchMode);
              onMatchModeChange?.(v as MatchMode);
            }}
            aria-label="Result mode"
            className="shrink-0"
          >
            <ToggleGroupItem value="all" className={toggleItemClass}>
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="resume" className={toggleItemClass}>
              Resume Customised
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Row 3: filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MultiSelectField
            label="Subject"
            options={ALL_SUBJECTS}
            selected={selectedSubjects}
            onChange={setSelectedSubjects}
            searchable
            placeholder="Select subjects..."
          />
          <MultiSelectField
            label="Degree"
            options={ALL_DEGREES}
            selected={selectedDegrees}
            onChange={setSelectedDegrees}
            placeholder="Select degrees..."
          />
          <MultiSelectField
            label="Country"
            options={ALL_COUNTRIES}
            selected={selectedCountries}
            onChange={setSelectedCountries}
            searchable
            optionIcons={COUNTRY_FLAGS}
            placeholder="Select countries..."
          />
          <MultiSelectField
            label="Acceptance & Funding"
            options={ALL_FUNDING}
            selected={selectedFunding}
            onChange={setSelectedFunding}
            optionDescriptions={FUNDING_DESCRIPTIONS}
            placeholder="Select funding..."
          />
        </div>
      </div>
    </header>
  );
};
