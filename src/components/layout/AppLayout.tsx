'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ArrowLeftDoubleIcon,
  Compass01Icon, 
  UserGroupIcon, 
  KanbanIcon, 
  UserCircleIcon, 
  FlashIcon, 
  PreferenceHorizontalIcon, 
  Menu01Icon, 
  Cancel01Icon,
  SparklesIcon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  PuzzleIcon
} from '@hugeicons/core-free-icons';
import { ChevronRight, Zap, LogOut, Settings, User, Sparkles, BookOpen } from 'lucide-react';
import { HighScholarLogo } from './HighScholarLogo';
import { HeaderGlobalSearch } from './HeaderGlobalSearch';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'profile';
  setActiveTab: (tab: 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'profile') => void;
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

  const isGradStudent = profile.degreeLevel === 'Masters' || profile.degreeLevel === 'PhD';
  const urgentCount = scholarships.filter((s) => {
    const diff = new Date(s.deadline).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-[#101828]">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar matching User Provided Image */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-white text-[#475467] border-r border-[#F1F5F9] flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto pt-5 px-3">
          {/* Header: HighScholar Brand + PRO + Academic Discovery + Collapse Arrow */}
          <div className="px-2 flex items-center justify-between mb-6">
            <div 
              onClick={() => {
                setActiveTab('opportunities');
                setIsSidebarOpen(false);
              }}
              className="flex items-center cursor-pointer"
            >
              <HighScholarLogo />
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>
            <button
              className="hidden lg:flex p-1 rounded-md text-[#94A3B8] hover:text-[#475467] hover:bg-slate-50 transition-colors"
              title="Collapse sidebar"
            >
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={18} />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-5 text-sm">
            {/* Section 1: Discover & Opportunities */}
            <div>
              <div className="px-2 text-xs font-medium text-[#64748B] mb-2">
                Discover &amp; Opportunities
              </div>
              <div className="space-y-1">
                {/* Opportunity Feed */}
                <button
                  onClick={() => {
                    setActiveTab('opportunities');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer relative overflow-hidden ${
                    activeTab === 'opportunities'
                      ? 'bg-[#F4F3FE] text-[#101828] font-semibold'
                      : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828]'
                  }`}
                >
                  {/* Active Left Indicator Bar */}
                  {activeTab === 'opportunities' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7150E7] rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <HugeiconsIcon 
                      icon={FlashIcon} 
                      size={18} 
                      className={activeTab === 'opportunities' ? 'text-[#7150E7]' : 'text-[#64748B]'} 
                    />
                    <span className={activeTab === 'opportunities' ? 'text-[#101828] font-semibold' : 'text-[#475467]'}>
                      Opportunity Feed
                    </span>
                  </div>
                </button>

                {/* Scholarship Radar */}
                <button
                  onClick={() => {
                    setActiveTab('scholarships');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer relative overflow-hidden ${
                    activeTab === 'scholarships'
                      ? 'bg-[#F4F3FE] text-[#101828] font-semibold'
                      : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828]'
                  }`}
                >
                  {activeTab === 'scholarships' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7150E7] rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <HugeiconsIcon 
                      icon={Compass01Icon} 
                      size={18} 
                      className={activeTab === 'scholarships' ? 'text-[#7150E7]' : 'text-[#64748B]'} 
                    />
                    <span className={activeTab === 'scholarships' ? 'text-[#101828] font-semibold' : 'text-[#475467]'}>
                      Scholarship Radar
                    </span>
                  </div>
                </button>

                {/* Faculty & Research Labs */}
                <button
                  onClick={() => {
                    setActiveTab('professors');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer relative overflow-hidden ${
                    activeTab === 'professors'
                      ? 'bg-[#F4F3FE] text-[#101828] font-semibold'
                      : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828]'
                  }`}
                >
                  {activeTab === 'professors' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7150E7] rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <HugeiconsIcon 
                      icon={UserGroupIcon} 
                      size={18} 
                      className={activeTab === 'professors' ? 'text-[#7150E7]' : 'text-[#64748B]'} 
                    />
                    <span className={activeTab === 'professors' ? 'text-[#101828] font-semibold' : 'text-[#475467]'}>
                      Faculty &amp; Research Labs
                    </span>
                  </div>
                </button>

                {/* Research Paper */}
                <button
                  onClick={() => {
                    setActiveTab('research');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer relative overflow-hidden ${
                    activeTab === 'research'
                      ? 'bg-[#F4F3FE] text-[#101828] font-semibold'
                      : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828]'
                  }`}
                >
                  {activeTab === 'research' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7150E7] rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <BookOpen 
                      className={`w-4 h-4 ${activeTab === 'research' ? 'text-[#7150E7]' : 'text-[#64748B]'}`} 
                    />
                    <span className={activeTab === 'research' ? 'text-[#101828] font-semibold' : 'text-[#475467]'}>
                      Research Paper
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User profile row at bottom matching Figma exactly */}
        <div className="p-3 border-t border-[#F1F5F9] bg-white">
          <div 
            onClick={() => {
              setActiveTab('profile');
              setIsSidebarOpen(false);
            }}
            className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/alex-avatar.png"
                alt="Alex Mercer"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EAECF0]"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-[#101828] leading-tight">Alex Mercer</div>
                <div className="text-[11px] text-[#64748B] leading-tight mt-0.5 truncate">
                  Masters • UX &amp; HCI
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOnboardingOpen(true);
              }}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#7150E7] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
              title="Edit Profile Wizard"
            >
              <HugeiconsIcon icon={PreferenceHorizontalIcon} size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Figma Header (HighScholar | Global Scholarship & Professor Finder Portal) */}
        <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#eaecf0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </button>

            {/* Breadcrumb path matching Figma Node 89:4385 */}
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[#667085] font-medium">HighScholar</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
              <span className="font-bold italic text-[#101828]">
                {activeTab === 'opportunities' ? 'Opportunity Feed' : 
                 activeTab === 'scholarships' ? 'Scholarship Radar' : 
                 activeTab === 'professors' ? 'Faculty & Research Labs' : 
                 activeTab === 'research' ? 'Research Paper' : 
                 activeTab === 'tracker' ? 'Applications & Outreach' : 'Opportunity Feed'}
              </span>
            </div>
          </div>

          {/* Center: Global Omnisearch matching Figma Node 96:6267 Frame 2147226745 */}
          <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-[540px]">
            <HeaderGlobalSearch
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          </div>

          {/* Right: User Profile Pill matching Figma Node 89:4385 exactly */}
          <div className="flex items-center gap-3">
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-full border border-[#EAECF0] transition-colors cursor-pointer shadow-2xs"
                title="User Profile"
              >
                <img
                  src="/alex-avatar.png"
                  alt="Alex Mercer"
                  className="w-7 h-7 rounded-full object-cover border border-[#EAECF0]"
                />
                <span className="text-xs font-bold text-[#101828]">Alex Mercer</span>
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
                    <Link
                      href="/login"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full h-8 sm:h-8.5 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#F04438] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#F04438]" />
                      <span>Logout</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
