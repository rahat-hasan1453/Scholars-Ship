'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Professor } from '@/types';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScholarshipCard } from '@/components/ScholarshipCard';
import { ProfessorCard } from '@/components/ProfessorCard';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ProfileView } from '@/components/ProfileView';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ScholarshipDetailModal } from '@/components/ScholarshipDetailModal';
import { ChromeExtensionDrawer } from '@/components/ChromeExtensionDrawer';
import { OpportunitiesFeed } from '@/components/OpportunitiesFeed';
import { ColdEmailModal } from '@/components/ColdEmailModal';
import { ProfessorDetailModal } from '@/components/ProfessorDetailModal';
import { OutreachKanban } from '@/components/OutreachKanban';
import { AdvancedFilterModal, FilterState, initialFilterState } from '@/components/AdvancedFilterModal';
import { SmartProfileMatcherModal } from '@/components/SmartProfileMatcherModal';
import { UnifiedHubView } from '@/components/UnifiedHubView';
import { ResearchPapersView } from '@/components/ResearchPapersView';
import { ScholarshipRadarFeed } from '@/components/ScholarshipRadarFeed';
import { FacultyLabsFeed } from '@/components/FacultyLabsFeed';
import { ResearchPapersFeed } from '@/components/ResearchPapersFeed';
import { getCountryOptions } from '@/data/countries';
import { calculateCountdown, calculateMatchScore } from '@/lib/utils';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Award, 
  GraduationCap, 
  Building2, 
  Globe2, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  FlaskConical,
  ArrowRight,
  RotateCcw,
  X,
  User,
  Zap,
  KanbanSquare,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { Tag } from '@/components/ui/tag';
import { HugeiconsIcon } from '@hugeicons/react';
import { PreferenceHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons';

export default function HomePage() {
  const { 
    profile, 
    scholarships, 
    professors, 
    applications, 
    outreachRecords,
    setIsOnboardingOpen, 
    selectedScholarship, 
    setSelectedScholarship,
    selectedProfessor,
    setSelectedProfessor,
    activeNavTab,
    setActiveNavTab,
  } = useApp();

  const router = useRouter();

  // Route protection & onboarding check
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated) {
          router.replace('/login');
        } else if (!data.user?.onboardingCompleted) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [router]);

  const [activeTab, setActiveTab] = useState<'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'profile'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as any;
      if (tabParam && ['opportunities', 'scholarships', 'professors', 'research', 'tracker', 'profile'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'opportunities';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as any;
      if (tabParam && ['opportunities', 'scholarships', 'professors', 'research', 'tracker', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam);
        setActiveNavTab(tabParam);
      }
    }
  }, [setActiveNavTab]);
  const [viewMode, setViewMode] = useState<'classic' | 'unified'>('unified');
  const [trackerMode, setTrackerMode] = useState<'outreach' | 'scholarships'>('outreach');
  const [isExtensionDrawerOpen, setIsExtensionDrawerOpen] = useState(false);

  // Scholarship filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<string>('ALL');
  const [selectedFunding, setSelectedFunding] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'amount'>('match');

  // Professor filters
  const [profSearchQuery, setProfSearchQuery] = useState('');
  const [profCountryFilter, setProfCountryFilter] = useState('ALL');
  const [openPositionsOnly, setOpenPositionsOnly] = useState(false);
  const [profSubjectFilter, setProfSubjectFilter] = useState<'ALL' | 'UX' | 'AI' | 'Biotech' | 'Robotics' | 'Economics'>('ALL');
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<Professor[]>([]);
  const [liveSearchError, setLiveSearchError] = useState('');

  // Advanced Filter Modal & Smart AI Profile Matcher States
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isSmartMatcherOpen, setIsSmartMatcherOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(initialFilterState);

  const advancedActiveCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.rankScope !== 'ALL') count++;
    if (advancedFilters.freeTuitionOnly) count++;
    if (advancedFilters.lowCostLiving) count++;
    if (advancedFilters.noGreOnly) count++;
    if (advancedFilters.lowCgpaFriendly) count++;
    if (advancedFilters.studyGapFriendly) count++;
    if (advancedFilters.intakeTerm !== 'ALL') count++;
    return count;
  }, [advancedFilters]);

  // Live OpenAlex / ApplyKite Database Search Handler
  const handleOpenAlexSearch = async () => {
    const query = profSearchQuery.trim() || profSubjectFilter !== 'ALL' ? (profSubjectFilter === 'UX' ? 'Human-Computer Interaction UX' : profSubjectFilter) : 'Human-Computer Interaction';
    setIsLiveSearching(true);
    setLiveSearchError('');
    try {
      const res = await fetch(`/api/professors/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.professors?.length > 0) {
        setLiveSearchResults(data.professors);
      } else {
        setLiveSearchError('No additional live professors found for this query.');
      }
    } catch {
      setLiveSearchError('Unable to connect to live global database.');
    } finally {
      setIsLiveSearching(false);
    }
  };

  // Filtered Scholarships (Comprehensive multi-field search including UX Design, Country, and Description)
  const filteredScholarships = useMemo(() => {
    return scholarships
      .filter((s) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchProvider = s.provider.toLowerCase().includes(q);
          const matchSpecs = s.specializations.some((spec) => spec.toLowerCase().includes(q));
          const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
          const matchCountry = s.countries.some((c) => c.toLowerCase().includes(q));
          const matchDesc = s.description.toLowerCase().includes(q);
          if (!matchTitle && !matchProvider && !matchSpecs && !matchTags && !matchCountry && !matchDesc) return false;
        }

        if (selectedDegree !== 'ALL') {
          if (!s.degreeLevels.includes(selectedDegree as any)) return false;
        }

        if (selectedFunding !== 'ALL') {
          if (s.fundingType !== selectedFunding) return false;
        }

        if (selectedCountry !== 'ALL') {
          if (!s.countries.includes(selectedCountry)) return false;
        }

        // Advanced Filter Criteria
        if (advancedFilters.freeTuitionOnly) {
          const isFree = s.fundingType === 'FULL' || 
                         s.fundingType === 'TUITION_WAIVER' || 
                         s.fundingAmount.toLowerCase().includes('full tuition') || 
                         s.fundingAmount.toLowerCase().includes('100%');
          if (!isFree) return false;
        }

        if (advancedFilters.noGreOnly && s.requirements?.minGre) {
          return false;
        }

        if (advancedFilters.lowCgpaFriendly && s.requirements?.minCgpa && s.requirements.minCgpa > 3.2) {
          return false;
        }

        if (advancedFilters.lowCostLiving) {
          const highCostCountries = ['United Kingdom', 'Switzerland', 'Singapore'];
          if (s.countries.every((c) => highCostCountries.includes(c))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'match') {
          const scoreA = calculateMatchScore(a, profile);
          const scoreB = calculateMatchScore(b, profile);
          return scoreB - scoreA;
        }
        return 0;
      });
  }, [scholarships, searchQuery, selectedDegree, selectedFunding, selectedCountry, sortBy, profile]);

  // Filtered Professors (Comprehensive multi-field search + OpenAlex live search merge)
  const filteredProfessors = useMemo(() => {
    const combined = [...liveSearchResults, ...professors];
    const uniqueMap = new Map<string, Professor>();
    combined.forEach((p) => uniqueMap.set(p.id, p));
    const allProfs = Array.from(uniqueMap.values());

    return allProfs.filter((p) => {
      if (profSearchQuery.trim()) {
        const q = profSearchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchUni = p.university.toLowerCase().includes(q);
        const matchDept = p.department.toLowerCase().includes(q);
        const matchLab = p.labName?.toLowerCase().includes(q) || false;
        const matchCountry = p.country.toLowerCase().includes(q);
        const matchBio = p.bio?.toLowerCase().includes(q) || false;
        const matchTags = (p.researchTags || []).some((t: string) => t.toLowerCase().includes(q));
        if (!matchName && !matchUni && !matchDept && !matchLab && !matchCountry && !matchBio && !matchTags) return false;
      }

      if (profCountryFilter !== 'ALL' && p.country !== profCountryFilter) {
        return false;
      }

      if (openPositionsOnly && !p.openPositions) {
        return false;
      }

      if (profSubjectFilter !== 'ALL') {
        const text = (p.researchTags.join(' ') + ' ' + p.department + ' ' + (p.bio || '')).toLowerCase();
        if (profSubjectFilter === 'UX' && !text.includes('ux') && !text.includes('interaction') && !text.includes('human-computer') && !text.includes('hci') && !text.includes('design')) return false;
        if (profSubjectFilter === 'AI' && !text.includes('ai') && !text.includes('intelligence') && !text.includes('learning') && !text.includes('nlp') && !text.includes('vision')) return false;
        if (profSubjectFilter === 'Biotech' && !text.includes('bio') && !text.includes('genomics') && !text.includes('health') && !text.includes('medical') && !text.includes('crispr')) return false;
        if (profSubjectFilter === 'Robotics' && !text.includes('robot') && !text.includes('energy') && !text.includes('materials') && !text.includes('hardware')) return false;
        if (profSubjectFilter === 'Economics' && !text.includes('econ') && !text.includes('finance') && !text.includes('policy') && !text.includes('social')) return false;
      }

      // Advanced Filter Criteria for Professors
      if (advancedFilters.rankScope === 'ACCESSIBLE') {
        const topTierUnis = ['Stanford University', 'Harvard University', 'MIT', 'University of Oxford', 'University of Cambridge'];
        if (topTierUnis.includes(p.university)) return false;
      } else if (advancedFilters.rankScope === 'TOP') {
        const topTierUnis = ['Stanford University', 'Harvard University', 'MIT', 'University of Oxford', 'University of Cambridge', 'UC Berkeley', 'Carnegie Mellon University', 'ETH Zurich'];
        if (!topTierUnis.includes(p.university)) return false;
      }

      return true;
    });
  }, [professors, liveSearchResults, profSearchQuery, profCountryFilter, openPositionsOnly, profSubjectFilter, advancedFilters]);

  // Funding acts as a tab view (ALL / Fully Funded), not an applied filter tag
  const activeFiltersCount = (selectedDegree !== 'ALL' ? 1 : 0) + 
                             (selectedCountry !== 'ALL' ? 1 : 0) + 
                             (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDegree('ALL');
    setSelectedFunding('ALL');
    setSelectedCountry('ALL');
  };

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenExtension={() => setIsExtensionDrawerOpen(true)}
      viewMode={viewMode}
      onToggleViewMode={() => setViewMode(prev => prev === 'classic' ? 'unified' : 'classic')}
    >
      {/* Dynamic View Header for tracker */}
      {activeTab === 'tracker' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">
                Applications & Outreach Pipelines
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe]">
                {applications.length + outreachRecords.length} Active
              </span>
            </div>
          </div>

          {/* Quick Context Pill */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-700" />
              <span>Profile: {profile.degreeLevel} (GPA {profile.cgpa})</span>
            </Button>
          </div>
        </div>
      )}

      {/* 1. OPPORTUNITY FEED: Figma Node 116:1841 */}
      {activeTab === 'opportunities' && (
        <OpportunitiesFeed />
      )}

      {/* 2. SCHOLARSHIP RADAR: Figma Node 122:3864 */}
      {activeTab === 'scholarships' && (
        <ScholarshipRadarFeed />
      )}

      {/* 3. FACULTY & RESEARCH LABS: Figma Node 122:5197 */}
      {activeTab === 'professors' && (
        <FacultyLabsFeed />
      )}

      {/* 4. RESEARCH PAPERS: Figma Node 122:8982 */}
      {activeTab === 'research' && (
        <ResearchPapersFeed />
      )}

      {/* TAB 1: SCHOLARSHIPS (Classic Fallback - Disabled in favor of ScholarshipRadarFeed) */}
      {false && (
        <div className="space-y-6">
          
          {/* Figma Node 25-4268 Hero Banner */}
          <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-2xs relative z-20">
            {/* Top White Section */}
            <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECE9FE] text-[#6941C6] mb-2.5">
                  {filteredScholarships.length} Available
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
                  Personalized Scholarship Radar
                </h1>
              </div>

              {/* Smart Profile Matcher CTA Button */}
              <button
                type="button"
                onClick={() => setIsSmartMatcherOpen(true)}
                className="h-11 px-5 rounded-full bg-gradient-to-r from-[#7150E7] via-purple-600 to-[#5b38d6] hover:from-[#5e3cd4] hover:to-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-200 inline-flex items-center gap-2.5 transition-all cursor-pointer select-none shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Smart AI Profile Matcher</span>
              </button>
            </div>

            {/* Bottom Lavender Filter Section (Full Width) */}
            <div className="bg-[#EDE9FC] px-6 sm:px-7 py-5 border-t border-[#E4DEF7] rounded-b-2xl space-y-4">
              {/* Row 1: Search Bar, Filter Button, Choose Country */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scholarships by title, provider, country, or topic (e.g. UX Design, Fulbright, AI, Germany)..."
                    className="w-full h-10 bg-white border-0 focus:ring-2 focus:ring-[#7150E7] text-[#101828] text-xs sm:text-sm rounded-full pl-10 pr-4 placeholder:text-[#98A2B3] placeholder:italic shadow-2xs focus:outline-hidden transition-all"
                  />
                  {searchQuery && (
                    <button
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
                  onClick={() => setIsAdvancedFilterOpen(true)}
                  className={`h-10 px-5 rounded-full text-xs sm:text-sm font-medium border-0 shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-all shrink-0 ${
                    advancedActiveCount > 0
                      ? 'bg-[#7150E7] text-white'
                      : 'bg-white text-[#344054] hover:bg-slate-50'
                  }`}
                >
                  <span>Filter</span>
                  <SlidersHorizontal className="w-4 h-4" />
                  {advancedActiveCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#7150E7] text-[11px] font-bold flex items-center justify-center">
                      {advancedActiveCount}
                    </span>
                  )}
                </button>

                {/* Choose Country Dropdown (All World Countries with search) */}
                <div className="min-w-[190px] shrink-0">
                  <CustomDropdown
                    variant="pill"
                    align="right"
                    value={selectedCountry}
                    onChange={(val) => setSelectedCountry(val)}
                    buttonClassName="h-10 border-0 shadow-2xs px-4 text-xs sm:text-sm font-medium"
                    placeholder="Choose Country"
                    searchPlaceholder="Search 50+ world countries..."
                    options={getCountryOptions()}
                    showSearch={true}
                  />
                </div>
              </div>

              {/* Row 2: Degree and Funding Pill Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Degree Filter Group */}
                  <div className="flex items-center gap-1.5">
                    <span className="italic text-xs font-medium text-[#475467] mr-1.5">Degree</span>
                    {(['ALL', 'Bachelors', 'Masters', 'PhD'] as const).map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setSelectedDegree(deg)}
                        className={`h-8 px-4 rounded-full text-xs transition-all cursor-pointer select-none ${
                          selectedDegree === deg
                            ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                            : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                        }`}
                      >
                        {deg}
                      </button>
                    ))}
                  </div>

                  {/* Funding Filter Group */}
                  <div className="flex items-center gap-1.5 sm:ml-4">
                    <span className="italic text-xs font-medium text-[#475467] mr-1.5">Funding</span>
                    <button
                      onClick={() => setSelectedFunding('ALL')}
                      className={`h-8 px-4 rounded-full text-xs transition-all cursor-pointer select-none ${
                        selectedFunding === 'ALL'
                          ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                          : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSelectedFunding('FULL')}
                      className={`h-8 px-4 rounded-full text-xs transition-all cursor-pointer select-none ${
                        selectedFunding === 'FULL'
                          ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                          : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                      }`}
                    >
                      Fully Funded
                    </button>
                  </div>
                </div>

                {/* Reset Filters Action */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-[#6941C6] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters ({activeFiltersCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Tags with Dismiss "X" */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
              <span className="text-[11px] text-slate-400 font-medium">Applied:</span>
              {searchQuery && (
                <Tag
                  label={`Query: "${searchQuery}"`}
                  variant="indigo"
                  onDismiss={() => setSearchQuery('')}
                />
              )}
              {selectedDegree !== 'ALL' && (
                <Tag
                  label={`Degree: ${selectedDegree}`}
                  variant="indigo"
                  onDismiss={() => setSelectedDegree('ALL')}
                />
              )}
              {selectedCountry !== 'ALL' && (
                <Tag
                  label={`Country: ${selectedCountry}`}
                  variant="default"
                  onDismiss={() => setSelectedCountry('ALL')}
                />
              )}
            </div>
          )}

          {/* Scholarship Grid */}
          {filteredScholarships.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No scholarships matched these criteria</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try resetting your search query or expanding your degree and country filters to view more global opportunities.
              </p>
              <Button variant="primary" size="default" onClick={resetFilters}>
                Reset All Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                  onSelect={(sch) => setSelectedScholarship(sch)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: PROFESSORS & LABS (Classic Fallback - Disabled in favor of FacultyLabsFeed) */}
      {false && (
        <div className="space-y-6">
          
          {/* Figma Node 26-6797 Hero Banner Card */}
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xs relative z-20">
            {/* Top White Section */}
            <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {/* Badge Row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE9FC] text-[#7150E7]">
                    Graduate Research Labs
                  </span>
                  <span className="text-xs sm:text-sm text-[#475467] font-normal">
                    Masters & PhD Candidates
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-[28px] font-bold text-[#101828] tracking-tight">
                  Graduate Faculty & Research Labs
                </h1>
              </div>

              {/* Safe Universities Recommender Button */}
              <button
                type="button"
                onClick={() => setIsSmartMatcherOpen(true)}
                className="h-10 px-4 rounded-full bg-gradient-to-r from-[#7150E7] to-purple-600 hover:from-[#5e3cd4] hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-200 inline-flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Find Safe Universities (100% Free)</span>
              </button>
            </div>

            {/* Bottom Lavender Filter Section (Full Width) */}
            <div className="bg-[#EDE9FC] px-6 sm:px-7 py-5 border-t border-[#E4DEF7] rounded-b-2xl space-y-4">
              {/* Row 1: Search Bar, Filter Button, Choose Country */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={profSearchQuery}
                    onChange={(e) => setProfSearchQuery(e.target.value)}
                    placeholder="Search professors by name, lab, university, UX Design, HCI, AI, Robotics..."
                    className="w-full h-10 bg-white border-0 focus:ring-2 focus:ring-[#7150E7] text-[#101828] text-xs sm:text-sm rounded-full pl-10 pr-4 placeholder:text-[#98A2B3] placeholder:italic shadow-2xs focus:outline-hidden transition-all"
                  />
                  {profSearchQuery && (
                    <button
                      onClick={() => setProfSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3] hover:text-[#344054] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsAdvancedFilterOpen(true)}
                  className={`h-10 px-5 rounded-full text-xs sm:text-sm font-medium border-0 shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-all shrink-0 ${
                    advancedActiveCount > 0
                      ? 'bg-[#7150E7] text-white'
                      : 'bg-white text-[#344054] hover:bg-slate-50'
                  }`}
                >
                  <span>Filter</span>
                  <SlidersHorizontal className="w-4 h-4" />
                  {advancedActiveCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#7150E7] text-[11px] font-bold flex items-center justify-center">
                      {advancedActiveCount}
                    </span>
                  )}
                </button>

                {/* Choose Country Dropdown (All World Countries with search) */}
                <div className="min-w-[190px] shrink-0">
                  <CustomDropdown
                    variant="pill"
                    align="right"
                    value={profCountryFilter}
                    onChange={(val) => setProfCountryFilter(val)}
                    buttonClassName="h-10 border-0 shadow-2xs px-4 text-xs sm:text-sm font-medium"
                    placeholder="Choose Country"
                    searchPlaceholder="Search 50+ world countries..."
                    options={getCountryOptions()}
                    showSearch={true}
                  />
                </div>
              </div>

              {/* Row 2: Status & Discipline Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* ALL Pill */}
                <button
                  onClick={() => {
                    setOpenPositionsOnly(false);
                    setProfSubjectFilter('ALL');
                  }}
                  className={`h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                    !openPositionsOnly && profSubjectFilter === 'ALL'
                      ? 'bg-[#6941C6] text-white shadow-xs'
                      : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                  }`}
                >
                  ALL
                </button>

                {/* Open Position Pill with Count Badge */}
                <button
                  onClick={() => setOpenPositionsOnly(!openPositionsOnly)}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none inline-flex items-center gap-2 ${
                    openPositionsOnly
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs'
                      : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                  }`}
                >
                  <span>Open Positions</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      openPositionsOnly
                        ? 'bg-[#5925DC] text-white'
                        : 'bg-[#EAECF0] text-[#475467]'
                    }`}
                  >
                    {professors.filter((p) => p.openPositions).length}
                  </span>
                </button>

                <div className="h-5 w-px bg-[#D6BBFB]/60 mx-1 hidden sm:block" />

                {/* Discipline Chips including UX Design */}
                <button
                  onClick={() => setProfSubjectFilter(profSubjectFilter === 'UX' ? 'ALL' : 'UX')}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                    profSubjectFilter === 'UX'
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                      : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                  }`}
                >
                  <span>🎨 UX Design & HCI</span>
                </button>

                <button
                  onClick={() => setProfSubjectFilter(profSubjectFilter === 'AI' ? 'ALL' : 'AI')}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                    profSubjectFilter === 'AI'
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                      : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                  }`}
                >
                  <span>🤖 AI & Machine Learning</span>
                </button>

                <button
                  onClick={() => setProfSubjectFilter(profSubjectFilter === 'Biotech' ? 'ALL' : 'Biotech')}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                    profSubjectFilter === 'Biotech'
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                      : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                  }`}
                >
                  <span>🧬 Biotech & Genomics</span>
                </button>

                <button
                  onClick={() => setProfSubjectFilter(profSubjectFilter === 'Robotics' ? 'ALL' : 'Robotics')}
                  className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                    profSubjectFilter === 'Robotics'
                      ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                      : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                  }`}
                >
                  <span>⚡ Robotics & Energy</span>
                </button>

                {/* Live OpenAlex / ApplyKite Global Search Button */}
                <button
                  onClick={handleOpenAlexSearch}
                  disabled={isLiveSearching}
                  className="h-8 px-3.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ml-auto disabled:opacity-60"
                  title="Query OpenAlex & Semantic Scholar live database for global faculty"
                >
                  {isLiveSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isLiveSearching ? 'Searching OpenAlex...' : '🌐 Search Live OpenAlex DB'}</span>
                </button>
              </div>

              {liveSearchResults.length > 0 && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-2 mt-2">
                  <span>✓ Added <strong>{liveSearchResults.length} live international faculty & labs</strong> from OpenAlex global database.</span>
                  <button onClick={() => setLiveSearchResults([])} className="text-emerald-700 hover:underline font-bold">Clear Live Data</button>
                </div>
              )}

              {liveSearchError && (
                <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-2 mt-2">
                  {liveSearchError}
                </div>
              )}
            </div>
          </div>

          {/* Professors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProfessors.map((professor) => (
              <ProfessorCard key={professor.id} professor={professor} />
            ))}
          </div>

        </div>
      )}

      {/* TAB 2.5: RESEARCH PAPERS (Classic Fallback - Disabled in favor of ResearchPapersFeed) */}
      {false && (
        <ResearchPapersView />
      )}

      {/* TAB 3: DUAL-MODE APPLICATION & OUTREACH TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-5">
          {/* Uxcel Mode Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-[#eaecf0] rounded-2xl w-fit shadow-xs">
            <button
              onClick={() => setTrackerMode('outreach')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                trackerMode === 'outreach'
                  ? 'bg-[#4f46e5] text-white shadow-xs'
                  : 'text-[#475467] hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Professor Outreach Pipeline</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${trackerMode === 'outreach' ? 'bg-white/25 text-white' : 'bg-slate-100 text-[#344054]'}`}>
                {outreachRecords.length}
              </span>
            </button>

            <button
              onClick={() => setTrackerMode('scholarships')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                trackerMode === 'scholarships'
                  ? 'bg-[#4f46e5] text-white shadow-xs'
                  : 'text-[#475467] hover:bg-slate-50'
              }`}
            >
              <KanbanSquare className="w-4 h-4" />
              <span>Scholarship Applications</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${trackerMode === 'scholarships' ? 'bg-white/25 text-white' : 'bg-slate-100 text-[#344054]'}`}>
                {applications.length}
              </span>
            </button>
          </div>

          {trackerMode === 'outreach' ? <OutreachKanban /> : <KanbanBoard />}
        </div>
      )}

      {/* TAB 4: MY SCHOLAR PROFILE & CREDENTIALS */}
      {activeTab === 'profile' && (
        <ProfileView onNavigateToTracker={() => setActiveTab('tracker')} />
      )}

      {/* MODALS */}
      <OnboardingModal />
      <ColdEmailModal />
      <ScholarshipDetailModal
        scholarship={selectedScholarship}
        onClose={() => setSelectedScholarship(null)}
      />
      <ProfessorDetailModal
        professor={selectedProfessor}
        onClose={() => setSelectedProfessor(null)}
      />
      <ChromeExtensionDrawer
        isOpen={isExtensionDrawerOpen}
        onClose={() => setIsExtensionDrawerOpen(false)}
      />

      {/* Advanced Admission & Funding Filter Modal */}
      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        filters={advancedFilters}
        onApply={(newFilters) => setAdvancedFilters(newFilters)}
        onReset={() => setAdvancedFilters(initialFilterState)}
        activeCount={advancedActiveCount}
      />

      {/* Smart Profile Matcher & Recommendation Engine Modal */}
      <SmartProfileMatcherModal
        isOpen={isSmartMatcherOpen}
        onClose={() => setIsSmartMatcherOpen(false)}
        onSelectScholarship={(id) => {
          const s = scholarships.find((item) => item.id === id);
          if (s) setSelectedScholarship(s);
        }}
      />

    </AppLayout>
  );
}
