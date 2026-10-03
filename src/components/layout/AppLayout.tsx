'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MenuIcon, XIcon } from 'lucide-react';
import { ChevronRight, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { ProfileMenuDropdown } from './ProfileMenuDropdown';
import { HeaderGlobalSearch } from './HeaderGlobalSearch';
import { useDesignScale } from '@/hooks/useDesignScale';

export type AppTab = 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'profile';

// Figma sidebar icons (273:3998): a stroke icon for the default state, a duotone filled icon when selected
const SIDEBAR_ITEMS: { tab: AppTab; label: string; icon: string }[] = [
  { tab: 'opportunities', label: 'Opportunity Feed', icon: 'dashboard' },
  { tab: 'scholarships', label: 'Scholarship Radar', icon: 'radar' },
  { tab: 'professors', label: 'Faculty & Research Labs', icon: 'user-group' },
  { tab: 'research', label: 'Research Paper', icon: 'license-draft' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenExtension: () => void;
  viewMode?: 'classic' | 'unified';
  onToggleViewMode?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onOpenExtension,
  viewMode = 'classic',
  onToggleViewMode,
}) => {
  const { 
    profile, 
    scholarships, 
    applications, 
    opportunities, 
    outreachRecords, 
    setIsOnboardingOpen,
  } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useDesignScale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Support mobile sidebar opening from custom components like OpportunitiesFeed
  useEffect(() => {
    const handleOpenSidebar = () => setIsSidebarOpen(true);
    window.addEventListener('open-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-sidebar', handleOpenSidebar);
  }, []);

  const isGradStudent = profile.degreeLevel === 'Masters' || profile.degreeLevel === 'PhD';
  const urgentCount = scholarships.filter((s) => {
    const diff = new Date(s.deadline).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-scaled-screen flex bg-surface-bg text-[#101828]" style={{ zoom: "var(--app-scale)" }}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Figma 183:4894) */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-scaled-screen w-[260px] shrink-0 flex flex-col gap-4 px-4 pb-5 bg-surface-bg transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand row */}
        <div className="flex h-[76px] items-center shrink-0">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('opportunities');
                setIsSidebarOpen(false);
              }}
              className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer text-left"
            >
              <span aria-hidden className="relative h-9 w-[45.68px] shrink-0">
                <img src="/sidebar/logo-back.svg" alt="" width={29.1005} height={35.6341} className="absolute left-[16.58px] top-0" />
                <img src="/sidebar/logo-front.svg" alt="" width={17.7703} height={34.3125} className="absolute left-0 top-[1.69px]" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[14px] leading-5 font-bold tracking-[-0.5004px] text-text-primary whitespace-nowrap">
                    Scholars’ ship
                  </span>
                  <span className="px-1.5 rounded-xl bg-brand-soft text-[10px] leading-[15px] font-bold tracking-[-0.0748px] text-[#4f46e5]">
                    PRO
                  </span>
                </span>
                <span className="text-[11px] leading-[16.5px] font-medium tracking-[-0.1275px] text-[#667085] whitespace-nowrap">
                  Academic Discovery
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <XIcon size={20} />
            </button>
            <button
              type="button"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="hidden lg:flex items-center justify-center size-4 shrink-0 cursor-pointer"
            >
              <img src="/sidebar/collapse.svg" alt="" width={16} height={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto" aria-label="Discover & Opportunities">
          <p className="font-figtree text-[12px] leading-[18px] font-medium text-text-tertiary">
            Discover &amp; Opportunities
          </p>
          <div className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => {
              const active = activeTab === item.tab;
              return (
                <Button
                  key={item.tab}
                  variant="ghost"
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsSidebarOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`h-auto w-full justify-start gap-4 py-2 pl-3 pr-2 font-figtree text-[15px] font-medium cursor-pointer ${
                    active
                      ? 'rounded-lg border-l-3 border-[#7050e6] bg-[#f4f2fd] leading-[18px] text-[#08261f] hover:bg-[#f4f2fd] hover:text-[#08261f]'
                      : 'rounded-none rounded-r-2xl leading-5 text-text-secondary hover:bg-[#f4f2fd]/60 hover:text-text-primary'
                  }`}
                >
                  <img
                    src={`/sidebar/${item.icon}-${active ? 'selected' : 'default'}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                  />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Figma Header matching Node 122:3164 (Header - HighScholar | Global Scholarship & Professor Finder Portal) */}
        {/* On discovery tabs (opportunities, scholarships, professors, research), Node 122:3164 is rendered inside their dedicated feed as the unified header container */}
        {!['opportunities', 'scholarships', 'professors', 'research', 'profile'].includes(activeTab) && (
          <header className="sticky top-0 z-40 h-[72px] bg-white/95 backdrop-blur-md border-b border-[#EAECF0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-5">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <MenuIcon size={20} />
            </button>

            {/* Global Omnisearch matching Figma Node 122:3165 Frame 2147226771 */}
            <div className="flex-1 min-w-0">
              <HeaderGlobalSearch
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </div>

            {/* Right: User Profile matching Figma Node 122:3174 Frame 2147226782 */}
            <div ref={profileMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
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

                {/* User Name & Degree Subtitle matching Figma 122:3181 */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#101828] leading-tight">
                    {profile.name || 'Ingrid Bergman'}
                  </span>
                  <span className="text-xs italic text-[#64748B] leading-tight mt-0.5">
                    {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
                  </span>
                </div>
              </button>

              {isProfileMenuOpen && <ProfileMenuDropdown onClose={() => setIsProfileMenuOpen(false)} />}
            </div>
          </header>
        )}

        {/* Dynamic Page Content */}
        <main className={['opportunities', 'scholarships', 'professors', 'research'].includes(activeTab) ? "flex-1 flex flex-col min-w-0" : activeTab === 'profile' ? "flex-1 flex flex-col min-w-0 lg:py-5 lg:pl-5 lg:pr-[30px]" : "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6"}>
          {children}
        </main>
      </div>
    </div>
  );
};
