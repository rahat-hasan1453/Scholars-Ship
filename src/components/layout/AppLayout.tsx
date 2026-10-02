'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MenuIcon, XIcon } from 'lucide-react';
import { ChevronRight, Zap, LogOut, Settings, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { HeaderGlobalSearch } from './HeaderGlobalSearch';
import { useDesignScale } from '@/hooks/useDesignScale';

type AppTab = 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'profile';

// Figma sidebar menu (183:4918) — Hugeicons, recoloured per state via mask
const SIDEBAR_ITEMS: { tab: AppTab; label: string; icon: string; iconSize: number }[] = [
  { tab: 'opportunities', label: 'Opportunity Feed', icon: '/sidebar/dashboard.svg', iconSize: 17.9167 },
  { tab: 'scholarships', label: 'Scholarship Radar', icon: '/sidebar/radar.svg', iconSize: 18.1667 },
  { tab: 'professors', label: 'Faculty & Research Labs', icon: '/sidebar/user-group.svg', iconSize: 20 },
  { tab: 'research', label: 'Research Paper', icon: '/sidebar/license-draft.svg', iconSize: 20 },
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
                  <span aria-hidden className="flex items-center justify-center size-5 shrink-0">
                    <span
                      className={active ? 'bg-[#7050e6]' : 'bg-[#62748e]'}
                      style={{
                        width: item.iconSize,
                        height: item.iconSize,
                        mask: `url(${item.icon}) center / contain no-repeat`,
                      }}
                    />
                  </span>
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
        {!['opportunities', 'scholarships', 'professors', 'research'].includes(activeTab) && (
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
                  <span className="text-xs italic text-[#90A1B9] leading-tight mt-0.5">
                    {profile.degreeLevel || 'Masters'} • {profile.specializations?.[0] || 'UX & HCI'}
                  </span>
                </div>
              </button>

              {/* Profile Small Modal (Figma Node 49-648 - Compact) */}
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
                      {/* Green Active Status Dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] rounded-full border-2 border-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#101828] leading-tight truncate">
                        {profile.name}
                      </div>
                      <div className="text-xs text-[#667085] font-normal leading-tight mt-0.5 truncate">
                        {profile.email || 'Poweruser'}
                      </div>
                    </div>
                  </div>

                  <hr className="border-[#F2F4F7] my-2" />

                  {/* Menu Items */}
                  <div className="space-y-0.5">
                    {/* Profile Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
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

                    {/* Settings Action */}
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
          </header>
        )}

        {/* Dynamic Page Content */}
        <main className={['opportunities', 'scholarships', 'professors', 'research'].includes(activeTab) ? "flex-1 flex flex-col min-w-0" : "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6"}>
          {children}
        </main>
      </div>
    </div>
  );
};
