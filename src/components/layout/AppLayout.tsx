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
import { ChevronRight, Zap, LogOut, Settings, User, Sparkles } from 'lucide-react';
import { HighScholarLogo } from './HighScholarLogo';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: 'scholarships' | 'opportunities' | 'professors' | 'tracker' | 'profile';
  setActiveTab: (tab: 'scholarships' | 'opportunities' | 'professors' | 'tracker' | 'profile') => void;
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
            {/* Senior UX Suggested Design Preview Switcher */}
            {onToggleViewMode && (
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#F4F3FE] via-[#EDE9FC] to-[#E0EAFF] border border-[#DDD7FA] shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7150E7]">
                    UX Redesign
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#7150E7] text-white">
                    Preview
                  </span>
                </div>
                <p className="text-[11px] text-[#475467] leading-snug mb-2 font-normal">
                  Unified view for Safe Universities, Free Tuition &amp; Labs.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onToggleViewMode();
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    viewMode === 'unified'
                      ? 'bg-[#7150E7] hover:bg-[#5e3cd4] text-white shadow-purple-200'
                      : 'bg-white hover:bg-[#FAF9FF] text-[#7150E7] border border-[#DDD7FA]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{viewMode === 'unified' ? '← Back to Classic' : '✨ Try Unified Hub'}</span>
                </button>
              </div>
            )}

            {/* Section 1: Discover & Opportunities */}
            <div>
              <div className="px-2 text-xs font-medium text-[#64748B] mb-2">
                Discover & Opportunities
              </div>
              <div className="space-y-1">
                {/* Day Planning (Active) */}
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
                      Opportunities Feed
                    </span>
                  </div>
                  
                  {/* Badge '1' */}
                  <span className="w-5 h-5 rounded-full bg-[#7150E7] text-white text-[11px] font-semibold flex items-center justify-center">
                    1
                  </span>
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
                      Faculty & Research Labs
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Application Pipelines */}
            <div>
              <div className="px-2 text-xs font-medium text-[#64748B] mb-2">
                Application Pipelines
              </div>
              <div className="space-y-1">
                {/* Kanban Pipelines */}
                <button
                  onClick={() => {
                    setActiveTab('tracker');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer relative overflow-hidden ${
                    activeTab === 'tracker'
                      ? 'bg-[#F4F3FE] text-[#101828] font-semibold'
                      : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#101828]'
                  }`}
                >
                  {activeTab === 'tracker' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7150E7] rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <HugeiconsIcon 
                      icon={KanbanIcon} 
                      size={18} 
                      className={activeTab === 'tracker' ? 'text-[#7150E7]' : 'text-[#64748B]'} 
                    />
                    <span className={activeTab === 'tracker' ? 'text-[#101828] font-semibold' : 'text-[#475467]'}>
                      Kanban Pipelines
                    </span>
                  </div>

                  <span className="w-5 h-5 rounded-full bg-[#7150E7] text-white text-[11px] font-semibold flex items-center justify-center">
                    1
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User profile row at bottom matching image */}
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
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-[#101828] leading-tight">{profile.name}</div>
                <div className="text-[11px] text-[#64748B] leading-tight mt-0.5 truncate max-w-[140px]">
                  {profile.degreeLevel} • {profile.specializations[0] || 'Computer Science'}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOnboardingOpen(true);
              }}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#7150E7] hover:bg-[#EDE9FE] transition-colors"
              title="Edit Profile Wizard"
            >
              <HugeiconsIcon icon={PreferenceHorizontalIcon} size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Uxcel Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#eaecf0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#667085] font-medium">HighScholar</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-[#101828]">
                {activeTab === 'opportunities'
                  ? 'Opportunities Feed'
                  : activeTab === 'scholarships'
                  ? 'Scholarship Radar'
                  : activeTab === 'professors'
                  ? 'Faculty & Research Labs'
                  : activeTab === 'tracker'
                  ? 'Kanban Pipelines'
                  : 'Scholar Profile & Credentials'}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar in Uxcel Aesthetic */}
          <div className="flex items-center gap-3">
            {/* Live Count Pill */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] border border-[#c7d2fe] text-xs font-semibold text-[#4338ca]">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{opportunities.length} Live Openings</span>
              </div>

              {urgentCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  <HugeiconsIcon icon={Clock01Icon} size={14} className="text-rose-500" />
                  <span>{urgentCount} Urgent (≤7d)</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-emerald-600" />
                <span>{applications.length + outreachRecords.length} Tracked</span>
              </div>
            </div>

            {/* Suggested Design Preview Switcher in Header */}
            {onToggleViewMode && (
              <button
                type="button"
                onClick={onToggleViewMode}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                  viewMode === 'unified'
                    ? 'bg-[#7150E7] text-white border-[#7150E7] hover:bg-[#5e3cd4] shadow-purple-200 ring-2 ring-purple-300/40'
                    : 'bg-[#F4F3FE] hover:bg-[#EDE9FE] text-[#7150E7] border-[#DDD7FA] hover:border-[#C4B9F5]'
                }`}
                title="Toggle between Classic View and Senior UX Unified Hub"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{viewMode === 'unified' ? '← Back to Classic View' : '✨ Try Unified Hub (Preview)'}</span>
              </button>
            )}

            {/* Extension API CTA */}
            <button
              onClick={onOpenExtension}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#344054] border border-[#d0d5dd] transition-colors shadow-xs cursor-pointer"
            >
              <HugeiconsIcon icon={PuzzleIcon} size={14} className="text-[#4f46e5]" />
              <span>Extension API</span>
            </button>

            {/* Profile Avatar Pill & Login in Header */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#5E43D8] bg-[#F4F3FE] hover:bg-[#EDE9FE] border border-[#DDD7FA] transition-colors"
                title="Sign In / Switch Account"
              >
                <span>Login</span>
              </Link>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-2 p-1 pl-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-full transition-colors border shadow-2xs cursor-pointer ${
                    isProfileMenuOpen ? 'border-[#6941C6] ring-2 ring-[#6941C6]/15' : 'border-[#eaecf0]'
                  }`}
                  title="Open User Profile Menu"
                >
                  <span className="text-xs font-bold text-[#101828] hidden sm:inline">{profile.name.split(' ')[0]}</span>
                  <img
                    src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                    alt={profile.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#eaecf0]"
                  />
                </button>

                {/* Profile Small Modal (Figma Node 49-648) */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-[28px] border border-[#EAECF0] shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header Row */}
                    <div className="flex items-center gap-3.5 pb-2">
                      <div className="relative shrink-0">
                        <img
                          src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                          alt={profile.name}
                          className="w-14 h-14 rounded-full object-cover border border-[#EAECF0]"
                        />
                        {/* Green Active Status Dot */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#12B76A] rounded-full border-2 border-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-lg sm:text-xl font-bold text-[#101828] leading-tight truncate">
                          {profile.name}
                        </div>
                        <div className="text-sm text-[#667085] font-normal leading-tight mt-1">
                          Poweruser
                        </div>
                      </div>
                    </div>

                    <hr className="border-[#F2F4F7] my-3" />

                    {/* Menu Items */}
                    <div className="space-y-1">
                      {/* Profile Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#EDE9FE] flex items-center justify-center text-[#344054] group-hover:text-[#6941C6] transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-base font-semibold text-[#101828] group-hover:text-[#6941C6] transition-colors">
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#EDE9FE] flex items-center justify-center text-[#344054] group-hover:text-[#6941C6] transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-base font-semibold text-[#101828] group-hover:text-[#6941C6] transition-colors">
                          Settings
                        </span>
                      </button>
                    </div>

                    <hr className="border-[#F2F4F7] my-3" />

                    {/* Logout Button (Figma Node 49-648) */}
                    <Link
                      href="/login"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full h-11 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#F04438] rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-4.5 h-4.5 text-[#F04438]" />
                      <span>Logout</span>
                    </Link>
                  </div>
                )}
              </div>
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
