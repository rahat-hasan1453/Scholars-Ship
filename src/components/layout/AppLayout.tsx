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
import { UserAvatar } from '@/components/UserAvatar';

export type AppTab = 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'saved' | 'profile';

// Figma sidebar icons (273:3998): a stroke icon for the default state, a duotone filled icon when selected
type SidebarItem = { tab: AppTab; label: string; icon: string };
const SIDEBAR_ITEMS: SidebarItem[] = [
  { tab: 'opportunities', label: 'Opportunity Feed', icon: 'dashboard' },
  { tab: 'scholarships', label: 'Scholarship Radar', icon: 'radar' },
  { tab: 'professors', label: 'Faculty & Research Labs', icon: 'user-group' },
  { tab: 'research', label: 'Research Paper', icon: 'license-draft' },
];
// "Others" group (Figma Sidebar 295:6105). Pipeline is the application tracker ('tracker' tab).
const OTHER_ITEMS: SidebarItem[] = [
  { tab: 'tracker', label: 'Pipeline', icon: 'pipeline' },
  { tab: 'saved', label: 'Saved Feed', icon: 'saved' },
];
const COLLAPSED_KEY = 'sidebar:collapsed';

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
  // Desktop only: icon-only sidebar (Figma Sidebar "Close" 295:6104), remembered across visits
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1');
      } catch {}
      return !c;
    });
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

      {/* Sidebar (Figma 183:4894, open/closed states 295:6105) */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-scaled-screen w-[260px] shrink-0 flex flex-col gap-4 pb-5 bg-surface-bg transition-[transform,width] duration-200 ease-in-out ${
          collapsed ? 'px-4 lg:w-[100px]' : 'px-4'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
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
              aria-label="Scholars’ ship home"
              className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer text-left"
            >
              <span aria-hidden className="relative h-9 w-[45.68px] shrink-0">
                <img src="/sidebar/logo-back.svg" alt="" width={29.1005} height={35.6341} className="absolute left-[16.58px] top-0" />
                <img src="/sidebar/logo-front.svg" alt="" width={17.7703} height={34.3125} className="absolute left-0 top-[1.69px]" />
              </span>
              <span className={`flex flex-col min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
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
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center size-6 shrink-0 rounded-md hover:bg-[#f4f2fd] cursor-pointer"
            >
              <img src="/sidebar/collapse.svg" alt="" width={16} height={16} className={collapsed ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto" aria-label="Main">
          <SidebarGroup
            title="Discover & Opportunities"
            items={SIDEBAR_ITEMS}
            collapsed={collapsed}
            activeTab={activeTab}
            onSelect={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
          />
          <div aria-hidden className={`h-px shrink-0 bg-[#e1e8f0] ${collapsed ? 'lg:mx-auto lg:w-[50px]' : ''}`} />
          <SidebarGroup
            title="Others"
            items={OTHER_ITEMS}
            collapsed={collapsed}
            activeTab={activeTab}
            onSelect={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
          />
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
                  <UserAvatar
                    src={profile.avatar}
                    name={profile.name}
                    email={profile.email}
                    className="w-8 h-8 border border-[#F4F6F8]"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#36B37E] ring-1.5 ring-white" />
                </div>

                {/* User Name & Degree Subtitle matching Figma 122:3181 */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#101828] leading-tight">
                    {profile.name || profile.email}
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

/* One labelled group of sidebar links; icon-only (with tooltip) when the desktop sidebar is collapsed */
function SidebarGroup({
  title,
  items,
  collapsed,
  activeTab,
  onSelect,
}: {
  title: string;
  items: SidebarItem[];
  collapsed: boolean;
  activeTab: AppTab;
  onSelect: (tab: AppTab) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className={`font-figtree text-[12px] leading-[18px] font-medium text-text-tertiary ${collapsed ? 'lg:sr-only' : ''}`}>{title}</p>
      <div className={`flex flex-col gap-1 ${collapsed ? 'lg:items-center lg:gap-3' : ''}`}>
        {items.map((item) => {
          const active = activeTab === item.tab;
          return (
            <Button
              key={item.tab}
              variant="ghost"
              onClick={() => onSelect(item.tab)}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={`h-auto w-full justify-start gap-4 py-2 pl-3 pr-2 font-figtree text-[15px] font-medium cursor-pointer ${
                collapsed ? 'lg:h-9 lg:w-11 lg:justify-center lg:px-0 lg:py-0' : ''
              } ${
                active
                  ? 'rounded-lg border-l-3 border-[#7050e6] bg-[#f4f2fd] leading-[18px] text-[#08261f] hover:bg-[#f4f2fd] hover:text-[#08261f]'
                  : `${collapsed ? 'lg:rounded-lg' : ''} rounded-none rounded-r-2xl leading-5 text-text-secondary hover:bg-[#f4f2fd]/60 hover:text-text-primary`
              }`}
            >
              <img
                src={`/sidebar/${item.icon}-${active ? 'selected' : 'default'}.svg`}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0"
              />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
