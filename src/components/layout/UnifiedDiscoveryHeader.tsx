'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ProfileMenuDropdown } from './ProfileMenuDropdown';
import { HeaderGlobalSearch } from '@/components/layout/HeaderGlobalSearch';
import { MenuIcon } from 'lucide-react';
import { MultiSelectField } from '@/components/layout/MultiSelectField';
import { UserAvatar } from '@/components/UserAvatar';

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
  const { profile, setActiveNavTab } = useApp();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

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
            aria-label={`Account menu for ${profile.name || 'your account'}`}
            className="flex h-11 items-center gap-2 rounded-lg px-2 py-1 text-left cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="relative size-8 shrink-0">
              <UserAvatar
                src={profile.avatar}
                name={profile.name}
                email={profile.email}
                className="size-8 border-[0.667px] border-[#f4f6f8]"
              />
              <span className="absolute bottom-[1.33px] right-[1.33px] size-[6.667px] rounded-full bg-success-main border-[0.667px] border-white" />
            </span>
            <span className="hidden sm:flex w-[145px] flex-col gap-1">
              <span className="truncate text-[12px] leading-4 font-bold tracking-[-0.192px] text-text-primary">
                {profile.name || profile.email}
              </span>
              <span className="truncate text-[12px] leading-4 italic tracking-[-0.192px] text-text-secondary">
                {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
              </span>
            </span>
          </button>

          {isProfileMenuOpen && <ProfileMenuDropdown onClose={() => setIsProfileMenuOpen(false)} />}
        </div>
      </div>

      {/* Row 2: title */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-1 min-w-0 flex-col gap-1">
            <h1 className="text-[16px] leading-6 font-medium text-text-primary">{title}</h1>
            <p className="text-[14px] leading-5 tracking-[-0.3424px] text-text-secondary">{subtitle}</p>
          </div>
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
