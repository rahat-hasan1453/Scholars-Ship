'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { 
  GraduationCap, 
  Sparkles, 
  Compass, 
  KanbanSquare, 
  Users, 
  SlidersHorizontal,
  Globe2,
  BookmarkCheck,
  Puzzle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'scholarships' | 'professors' | 'tracker';
  setActiveTab: (tab: 'scholarships' | 'professors' | 'tracker') => void;
  onOpenExtension: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenExtension }) => {
  const { profile, setIsOnboardingOpen, applications } = useApp();

  const isGradStudent = profile.degreeLevel === 'Masters' || profile.degreeLevel === 'PhD';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/20">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-slate-900">HighScholar</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Global Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Higher Ed Discovery</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scholarships'
                  ? 'bg-white text-indigo-950 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Scholarships</span>
            </button>

            <button
              onClick={() => setActiveTab('professors')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'professors'
                  ? 'bg-white text-indigo-950 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Professors & Labs</span>
              {isGradStudent && (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  Grad Match
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tracker'
                  ? 'bg-white text-indigo-950 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <KanbanSquare className="w-4 h-4 text-indigo-600" />
              <span>My Tracker</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {applications.length}
              </span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Chrome Extension Test Button */}
            <button
              onClick={onOpenExtension}
              title="Chrome Extension Ingest Simulator"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Puzzle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Extension API</span>
            </button>

            {/* Profile Preferences Pill */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100/80 transition-all text-left shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
                {profile.degreeLevel === 'PhD' ? 'PhD' : profile.degreeLevel === 'Masters' ? 'MS' : 'BS'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-semibold text-indigo-950 flex items-center gap-1">
                  <span>{profile.degreeLevel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">{profile.specializations[0] || 'General'}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>GPA {profile.cgpa.toFixed(2)}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-700 font-medium group-hover:underline">Edit Filters</span>
                </div>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-700 ml-0.5" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'scholarships' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Scholarships</span>
          </button>
          <button
            onClick={() => setActiveTab('professors')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'professors' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Professors</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'tracker' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>Tracker ({applications.length})</span>
          </button>
        </div>

      </div>
    </header>
  );
};
