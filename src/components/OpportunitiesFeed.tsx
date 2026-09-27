'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { OpportunityCard } from './OpportunityCard';
import { DegreeLevel } from '@/types';
import { 
  Sparkles, 
  Search, 
  LayoutGrid, 
  List, 
  Check, 
  Bookmark, 
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Zap,
  GraduationCap,
  SlidersHorizontal,
  Flame,
  Award,
  RefreshCw,
  Share2,
  Globe,
  Plus,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { ImportPostModal } from './ImportPostModal';
import { CustomDropdown } from './ui/CustomDropdown';

const ALL_SUBJECTS = [
  'Computer Science',
  'Artificial Intelligence',
  'Data Science & Analytics',
  'Machine Learning',
  'Biotechnology',
  'Biomedical Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Renewable Energy',
  'Physics & Quantum Computing',
  'Economics & Econometrics',
  'Public Health & Epidemiology',
  'Robotics & Autonomous Systems',
  'Materials Science & Nanotechnology',
  'Human-Computer Interaction',
  'Software Engineering',
  'Neuroscience',
  'Chemistry & Molecular Sciences',
  'Civil & Environmental Engineering'
];

export const OpportunitiesFeed: React.FC = () => {
  const { 
    opportunities, 
    profile, 
    openColdEmailModal, 
    saveOpportunityToOutreach, 
    outreachRecords,
    syncLiveOpportunities,
    isSyncingOpportunities,
    lastSyncedAt 
  } = useApp();

  // Filter States
  const [selectedDegree, setSelectedDegree] = useState<string>('ALL');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    if (profile?.specializations?.length) {
      return profile.specializations;
    }
    return ['Computer Science', 'Artificial Intelligence', 'Biotechnology', 'Data Science & Analytics'];
  });
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const removeSubject = (subject: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubjects((prev) => prev.filter((s) => s !== subject));
  };

  const filteredSubjectList = useMemo(() => {
    if (!subjectSearchQuery.trim()) return ALL_SUBJECTS;
    const q = subjectSearchQuery.toLowerCase();
    return ALL_SUBJECTS.filter((s) => s.toLowerCase().includes(q));
  }, [subjectSearchQuery]);

  const [matchTab, setMatchTab] = useState<'exact' | 'similar' | 'all'>('exact');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncLive = async () => {
    setSyncFeedback('Crawling academic web & social networks...');
    const res = await syncLiveOpportunities();
    if (res.newFound > 0) {
      setSyncFeedback(`✨ Found and added ${res.newFound} new live openings!`);
    } else {
      setSyncFeedback(`✓ Live feed is up to date (${res.count} openings found).`);
    }
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4500);
  };

  // Filter logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = opp.title.toLowerCase().includes(q);
        const matchAuthor = opp.authorName.toLowerCase().includes(q);
        const matchInst = opp.institution.toLowerCase().includes(q);
        const matchTags = opp.fieldTags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchAuthor && !matchInst && !matchTags) return false;
      }

      // Match Tab filter
      if (matchTab === 'exact' && opp.matchType !== 'exact') return false;
      if (matchTab === 'similar' && opp.matchType !== 'similar' && opp.matchType !== 'exact') return false;

      // Degree filter
      if (selectedDegree !== 'ALL') {
        if (!opp.degrees.includes(selectedDegree as DegreeLevel)) return false;
      }

      // Subject multi-select filter
      if (selectedSubjects.length > 0) {
        const matchesSubject = opp.fieldTags.some((tag) =>
          selectedSubjects.some((sub) => {
            const t = tag.toLowerCase().trim();
            const s = sub.toLowerCase().trim();
            if (t.includes(s) || s.includes(t)) return true;
            if (s.includes('cs') && t.includes('computer science')) return true;
            if (s.includes('ai') && (t.includes('artificial intelligence') || t.includes('machine learning'))) return true;
            if (s.includes('bio') && (t.includes('biomedical') || t.includes('biotechnology') || t.includes('genomics'))) return true;
            if (s.includes('energy') && (t.includes('renewable') || t.includes('clean energy') || t.includes('battery'))) return true;
            if (s.includes('physics') && (t.includes('quantum') || t.includes('optics'))) return true;
            if (s.includes('econ') && (t.includes('economics') || t.includes('finance'))) return true;
            return false;
          })
        );
        if (!matchesSubject) return false;
      }

      // Country filter
      if (selectedCountry !== 'ALL' && opp.country !== selectedCountry) {
        return false;
      }

      // Source filter
      if (selectedSource !== 'ALL' && opp.source !== selectedSource) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, matchTab, selectedDegree, selectedSubjects, selectedCountry, selectedSource]);

  const exactCount = opportunities.filter((o) => o.matchType === 'exact').length;
  const similarCount = opportunities.filter((o) => o.matchType === 'similar').length;
  const allCount = opportunities.length;

  return (
    <div className="space-y-6">
      {/* Figma Hero Banner Card (Node 16-1999) */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xs relative z-20">
        {/* Top White Section */}
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-t-2xl">
          <div className="max-w-2xl">
            {/* Live Ingestion Active Badge */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE9FC] text-[#7150E7]">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Live Ingestion Active
              </span>
              <span className="text-xs sm:text-[13px] text-[#475467] font-normal">
                Real-time faculty recruitment announcements
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-[26px] font-bold text-[#101828] tracking-tight">
              Professor Hiring & Funded Lab Calls
            </h1>
          </div>

          {/* Right Side Controls & Live Aggregator Sync */}
          <div className="flex flex-col lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Sync Live Posts Pill Button */}
              <button
                onClick={handleSyncLive}
                disabled={isSyncingOpportunities}
                className="h-9 px-4 rounded-full text-xs font-semibold bg-[#6941C6] hover:bg-[#5925DC] text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-75"
                title="Crawl open professor posts from web & social"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingOpportunities ? 'animate-spin' : ''}`} />
                <span>{isSyncingOpportunities ? 'Syncing...' : 'Sync Live Posts'}</span>
              </button>

              {/* Import Post Pill Button */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="h-9 px-4 rounded-full text-xs font-medium bg-white hover:bg-slate-50 text-[#344054] border border-[#D0D5DD] transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                title="Import a LinkedIn or Twitter post manually"
              >
                <span className="text-[#6941C6] font-semibold text-sm leading-none">+</span>
                <span>Import Post</span>
              </button>

              {/* Grid / List View Mode Toggle */}
              <div className="h-9 px-1 bg-white border border-[#D0D5DD] rounded-full inline-flex items-center gap-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#EDE9FC] text-[#7150E7]' : 'text-[#98A2B3] hover:text-[#344054]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#EDE9FC] text-[#7150E7]' : 'text-[#98A2B3] hover:text-[#344054]'
                  }`}
                  title="Compact List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 58 Live Openings · Synced 02:09 AM */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 text-[#039855] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
                {opportunities.length} Live Openings
              </span>
              <span className="text-[#98A2B3]">•</span>
              <span className="text-[#475467]">
                Synced {lastSyncedAt || '02:09 AM'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Lavender Filter Section (Figma Node 25-4268) */}
        <div className="bg-[#EDE9FC] px-6 sm:px-7 py-5 border-t border-[#E4DEF7] rounded-b-2xl space-y-4">
          {/* Row 1: Search Bar, Filter Button, Choose Country Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Bar Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholarships by title, provider, or topic (e.g. Fulbright, AI, Germany)..."
                className="w-full h-10 bg-white border-0 focus:ring-2 focus:ring-[#7150E7] text-[#101828] text-xs sm:text-sm rounded-full pl-10 pr-4 placeholder:text-[#98A2B3] placeholder:italic shadow-2xs focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3] hover:text-[#344054] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              type="button"
              className="h-10 px-5 rounded-full text-xs sm:text-sm font-medium bg-white text-[#344054] hover:bg-slate-50 border-0 shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-all shrink-0"
            >
              <span>Filter</span>
              <SlidersHorizontal className="w-4 h-4 text-[#667085]" />
            </button>

            {/* Choose Country Dropdown */}
            <div className="min-w-[170px] shrink-0">
              <CustomDropdown
                variant="pill"
                align="right"
                value={selectedCountry}
                onChange={(val) => setSelectedCountry(val)}
                buttonClassName="h-10 border-0 shadow-2xs px-4 text-xs sm:text-sm font-medium"
                placeholder="Choose Country"
                options={[
                  { label: 'Choose Country', value: 'ALL' },
                  { label: 'United States', value: 'USA' },
                  { label: 'Canada', value: 'Canada' },
                  { label: 'United Kingdom', value: 'UK' },
                  { label: 'Germany', value: 'Germany' },
                  { label: 'South Korea', value: 'South Korea' },
                ]}
                showSearch={false}
              />
            </div>
          </div>

          {/* Row 2: Inline Filter Groups (Subject, Degree, Match Result) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
            {/* Subject Dropdown Pill */}
            <div className="flex items-center gap-2 relative" ref={subjectDropdownRef}>
              <span className="italic text-xs font-medium text-[#475467]">Subject</span>
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen((prev) => !prev)}
                className="h-8 px-3.5 bg-white border border-[#D0D5DD] hover:bg-slate-50 text-[#344054] text-xs font-medium rounded-full inline-flex items-center gap-2 shadow-2xs cursor-pointer select-none transition-all"
              >
                <span>Choose Subjects</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#667085] transition-transform duration-200 ${
                    isSubjectDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Subject Popover Menu */}
              {isSubjectDropdownOpen && (
                <div
                  className="absolute left-14 top-full mt-2 w-72 bg-white rounded-2xl border border-[#D0D5DD] shadow-xl z-50 p-3.5 animate-in fade-in slide-in-from-top-2 duration-150 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Bar */}
                  <div className="relative mb-2.5">
                    <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      placeholder="Search subjects..."
                      className="w-full bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#101828] placeholder-[#98A2B3] focus:outline-hidden focus:border-[#7150E7]"
                      autoFocus
                    />
                    {subjectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSubjectSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* List of Subjects with Checkboxes */}
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredSubjectList.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject);
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => toggleSubject(subject)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#F4F3FE] text-[#7150E7] font-semibold'
                              : 'text-[#344054] hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{subject}</span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ml-2 ${
                              isSelected
                                ? 'bg-[#7150E7] border-[#7150E7] text-white'
                                : 'border-[#D0D5DD] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Degree Pill Filter Group */}
            <div className="flex items-center gap-1.5">
              <span className="italic text-xs font-medium text-[#475467] mr-1">Degree</span>
              {(['ALL', 'Bachelors', 'Masters', 'PhD'] as const).map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setSelectedDegree(deg)}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none ${
                    selectedDegree === deg
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                      : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                  }`}
                >
                  {deg}
                </button>
              ))}
            </div>

            {/* Match Result Pill Filter Group */}
            <div className="flex items-center gap-1.5">
              <span className="italic text-xs font-medium text-[#475467] mr-1">Match Result</span>
              <button
                type="button"
                onClick={() => setMatchTab('exact')}
                className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 select-none ${
                  matchTab === 'exact'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                    : 'bg-white text-[#344054] hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <span>Exact Match</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    matchTab === 'exact' ? 'bg-[#5925DC] text-white' : 'bg-[#EAECF0] text-[#475467]'
                  }`}
                >
                  {exactCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMatchTab('similar')}
                className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 select-none ${
                  matchTab === 'similar'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                    : 'bg-white text-[#344054] hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <span>Similar Fields</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    matchTab === 'similar' ? 'bg-[#5925DC] text-white' : 'bg-[#EAECF0] text-[#475467]'
                  }`}
                >
                  {similarCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMatchTab('all')}
                className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 select-none ${
                  matchTab === 'all'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                    : 'bg-white text-[#344054] hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <span>All Openings</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    matchTab === 'all' ? 'bg-[#5925DC] text-white' : 'bg-[#EAECF0] text-[#475467]'
                  }`}
                >
                  {allCount}
                </span>
              </button>
            </div>
          </div>

          {/* Row 3: Selected Subject Chips (from Figma Node 25-4268) */}
          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1.5 bg-white text-[#344054] text-xs font-medium px-3 py-1 rounded-full shadow-2xs transition-colors shrink-0"
                >
                  <span>{subject}</span>
                  <button
                    type="button"
                    className="hover:text-[#101828] text-[#98A2B3] transition-colors p-0.5 rounded-full hover:bg-black/5 cursor-pointer"
                    onClick={(e) => removeSubject(subject, e)}
                    title={`Remove ${subject}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs text-[#4f46e5] animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-[#4f46e5] shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid or List of Opportunities */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-[#eaecf0] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#101828] mb-1">No matching opportunities found</h3>
          <p className="text-xs text-[#667085] max-w-md mx-auto mb-4">
            Try adjusting your degree level, research field, or switching to the "All Openings" tab.
          </p>
          <button
            onClick={() => {
              setMatchTab('all');
              setSelectedDegree('ALL');
              setSelectedCountry('ALL');
              setSelectedSource('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] text-white hover:bg-[#4338ca] transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        /* Uxcel Clean Compact List View */
        <div className="bg-white border border-[#eaecf0] rounded-2xl overflow-hidden divide-y divide-[#f2f4f7] shadow-xs">
          {filteredOpportunities.map((opp) => {
            const isSaved = outreachRecords.some((r) => r.opportunityId === opp.id);
            return (
              <div
                key={opp.id}
                className="group px-5 py-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center font-bold text-xs shrink-0">
                    🎓
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#101828] truncate group-hover:text-[#4f46e5] transition-colors">
                        {opp.title}
                      </span>
                      {opp.matchType === 'exact' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exact
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#667085]">
                      <span className="font-semibold text-slate-800">{opp.authorName}</span>
                      <span>•</span>
                      <span>{opp.institution}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{opp.funding}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-[11px] text-[#98a2b3] font-medium mr-1">{opp.postedAgo}</span>
                  <button
                    onClick={() => openColdEmailModal(opp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Email</span>
                  </button>
                  <button
                    onClick={() => saveOpportunityToOutreach(opp)}
                    disabled={isSaved}
                    className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-slate-50 text-[#344054] border-[#d0d5dd]'
                    }`}
                    title={isSaved ? 'Tracked' : 'Save to Pipeline'}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={opp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-[#98a2b3] hover:text-[#101828] hover:bg-slate-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual / Social Import Modal */}
      <ImportPostModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
};
