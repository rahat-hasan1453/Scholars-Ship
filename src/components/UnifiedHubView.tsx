'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Scholarship, Professor, HiringOpportunity } from '@/types';
import { ScholarshipCard } from '@/components/ScholarshipCard';
import { ProfessorCard } from '@/components/ProfessorCard';
import { WORLD_COUNTRIES, getCountryOptions } from '@/data/countries';
import { getSubjectOptions, matchesSelectedSubjects } from '@/data/subjects';
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown';
import { 
  Search, 
  Sparkles, 
  Building2, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight, 
  SlidersHorizontal,
  Mail,
  Zap,
  Globe2,
  X,
  Compass,
  Check,
  LayoutGrid,
  List,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedHubViewProps {
  onSwitchToClassic: () => void;
  onOpenColdEmail?: (prof: Professor) => void;
  onOpenScholarshipDetail: (sch: Scholarship) => void;
}

export const UnifiedHubView: React.FC<UnifiedHubViewProps> = ({
  onSwitchToClassic,
  onOpenColdEmail,
  onOpenScholarshipDetail,
}) => {
  const { profile, scholarships, professors, opportunities } = useApp();

  // View Layout State (Grid vs List)
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Unified Omnisearch States
  const [selectedField, setSelectedField] = useState<string[]>(['UX Design']);
  const [selectedDegree, setSelectedDegree] = useState('Masters');
  const [selectedCountry, setSelectedCountry] = useState<string[]>(['ALL']);
  const [fundingPreference, setFundingPreference] = useState<'FREE_ONLY' | 'SAFE_GEMS' | 'ALL'>('SAFE_GEMS');
  const [keywordQuery, setKeywordQuery] = useState('');

  // Dropdown Options adhering to system CustomDropdown specification (40+ categorized subjects)
  const subjectOptions = useMemo<DropdownOption[]>(() => getSubjectOptions(), []);

  const degreeOptions = useMemo<DropdownOption[]>(() => [
    { label: 'Masters Degree', value: 'Masters' },
    { label: 'PhD / Doctorate', value: 'PhD' },
    { label: 'Bachelors / Undergrad', value: 'Undergraduate' },
    { label: 'Postdoc Fellow', value: 'Postdoc' },
    { label: 'All Degrees', value: 'ALL' },
  ], []);

  const fundingOptions = useMemo<DropdownOption[]>(() => [
    { label: '🌟 Safe Regional (Rank 1000–5000+)', value: 'SAFE_GEMS' },
    { label: '💰 100% Free Tuition Only', value: 'FREE_ONLY' },
    { label: '🌐 All Options & Tiers', value: 'ALL' },
  ], []);

  // Active Tab within Unified Results: 'safe_unis' | 'scholarships' | 'professors' | 'all'
  const [activeSection, setActiveSection] = useState<'safe_unis' | 'scholarships' | 'professors' | 'all'>('safe_unis');

  // Filtered Scholarships based on Omnisearch
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      const text = (s.title + ' ' + s.specializations.join(' ') + ' ' + s.tags.join(' ') + ' ' + s.description).toLowerCase();
      
      // Keyword or Field match
      if (keywordQuery.trim()) {
        const q = keywordQuery.toLowerCase();
        if (!text.includes(q) && !s.countries.some(c => c.toLowerCase().includes(q))) return false;
      } else if (!matchesSelectedSubjects(text, [...s.specializations, ...s.tags], selectedField)) {
        return false;
      }

      // Country match
      if (selectedCountry.length > 0 && !selectedCountry.includes('ALL')) {
        const matchesCountry = selectedCountry.some((sc) => {
          const target = sc.toLowerCase();
          return s.countries.some((c) => {
            const cl = c.toLowerCase();
            return cl === target || 
                   cl.includes(target) || 
                   target.includes(cl) ||
                   (target === 'usa' && (cl.includes('united states') || cl.includes('us'))) ||
                   (target === 'uk' && (cl.includes('united kingdom') || cl.includes('britain')));
          });
        });
        if (!matchesCountry) return false;
      }

      // Degree match
      if (selectedDegree !== 'ALL' && !s.degreeLevels.includes(selectedDegree as any)) {
        return false;
      }

      // Free Tuition match
      if (fundingPreference === 'FREE_ONLY' || fundingPreference === 'SAFE_GEMS') {
        const isFree = s.fundingType === 'FULL' || 
                       s.fundingType === 'TUITION_WAIVER' || 
                       s.fundingAmount.toLowerCase().includes('full tuition') || 
                       s.fundingAmount.toLowerCase().includes('100%');
        if (!isFree) return false;
      }

      return true;
    });
  }, [scholarships, selectedField, selectedDegree, selectedCountry, fundingPreference, keywordQuery]);

  // Filtered Professors based on Omnisearch
  const filteredProfessors = useMemo(() => {
    return professors.filter((p) => {
      const text = (p.name + ' ' + p.university + ' ' + p.department + ' ' + (p.labName || '') + ' ' + p.researchTags.join(' ') + ' ' + (p.bio || '')).toLowerCase();
      
      // Keyword or Field match
      if (keywordQuery.trim()) {
        const q = keywordQuery.toLowerCase();
        if (!text.includes(q) && !p.country.toLowerCase().includes(q)) return false;
      } else if (!matchesSelectedSubjects(text, p.researchTags, selectedField)) {
        return false;
      }

      // Country match
      if (selectedCountry.length > 0 && !selectedCountry.includes('ALL')) {
        const matchesCountry = selectedCountry.some((sc) => {
          const target = sc.toLowerCase();
          const pc = p.country.toLowerCase();
          return pc === target || 
                 pc.includes(target) || 
                 target.includes(pc) ||
                 (target === 'usa' && (pc.includes('united states') || pc.includes('us'))) ||
                 (target === 'uk' && (pc.includes('united kingdom') || pc.includes('britain')));
        });
        if (!matchesCountry) return false;
      }

      return true;
    });
  }, [professors, selectedField, selectedCountry, keywordQuery]);

  // Safe Bet Universities tailored for Rank 1,000 – 5,000+ with 100% Free Tuition / TA-RA
  const safeUniversities = useMemo(() => {
    const list = [
      {
        id: 'safe_astate_01',
        name: 'Arkansas State University / Lamar University',
        country: 'USA 🇺🇸',
        field: 'UX Design, CS & Digital Media',
        rankBadge: 'Rank 1,200 – 1,800 • High Acceptance (88%)',
        cost: 'Low Cost College Town ($650/mo)',
        fundingBenefit: 'Automatic In-State Tuition Waiver + $1,400/mo Graduate Assistantship (TA/RA)',
        requirements: 'Accepts CGPA 2.65+, No GRE required, 4+ Years Study Gap Accepted',
        officialLink: 'https://www.astate.edu/graduate-school',
      },
      {
        id: 'safe_mun_02',
        name: 'Memorial University of Newfoundland',
        country: 'Canada 🇨🇦',
        field: 'Computer Science, HCI & Applied Computing',
        rankBadge: 'Rank 700 – 900 • Canadian Atlantic PNP PR Bonus',
        cost: 'Lowest Tuition in Canada ($3,500/yr or 100% Free with Faculty Fellowship)',
        fundingBenefit: 'Dean’s Doctoral & Masters Award + Atlantic Immigration Program (AIP) fast PR pathway',
        requirements: 'No GRE, Accepts Duolingo, Flexible CGPA assessment',
        officialLink: 'https://www.mun.ca/sgs',
      },
      {
        id: 'safe_bremen_03',
        name: 'University of Bremen & HfK Bremen',
        country: 'Germany 🇩🇪',
        field: 'Digital Media, UX & Interaction Design',
        rankBadge: 'Public University • 100% Tuition Free (€0)',
        cost: 'Affordable Living (€750 - €850/mo) • Free Regional Transit',
        fundingBenefit: 'Zero Tuition Fees + High Demand for English Digital Media / UX / CS Students',
        requirements: 'No Tuition, 18 Months Stay-Back Job Visa, Accepts English MOI',
        officialLink: 'https://www.uni-bremen.de/en/studies/international',
      },
      {
        id: 'safe_usm_04',
        name: 'University of Southern Mississippi / South Dakota Mines',
        country: 'USA 🇺🇸',
        field: 'Informatics, UX & Computational Science',
        rankBadge: 'Rank 1,500+ • 92% Graduate Admission Rate',
        cost: 'Super Low Living Cost ($550/mo)',
        fundingBenefit: '100% Tuition Remission with Departmental Teaching Assistantship',
        requirements: 'Low CGPA friendly (2.50+), GRE waived upon inquiry, Fast I-20 Issuance',
        officialLink: 'https://www.usm.edu/graduate-admissions',
      },
    ];

    let filtered = list;
    if (selectedCountry.length > 0 && !selectedCountry.includes('ALL')) {
      filtered = filtered.filter((u) => {
        const uc = u.country.toLowerCase();
        return selectedCountry.some((sc) => {
          const target = sc.toLowerCase();
          return uc.includes(target) ||
                 target.includes(uc.slice(0, 3)) ||
                 (target === 'usa' && (uc.includes('usa') || uc.includes('united states'))) ||
                 (target === 'canada' && uc.includes('canada')) ||
                 (target === 'germany' && uc.includes('germany'));
        });
      });
    }

    if (selectedField.length > 0 && !selectedField.includes('ALL')) {
      filtered = filtered.filter((u) => matchesSelectedSubjects(u.field + ' ' + u.name, [u.field], selectedField));
    }

    return filtered;
  }, [selectedCountry, selectedField]);

  // Live Hiring Opportunities in this field
  const fieldOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const text = (opp.title + ' ' + opp.fieldTags.join(' ') + ' ' + opp.content).toLowerCase();
      if (keywordQuery.trim()) {
        return text.includes(keywordQuery.toLowerCase());
      }
      return matchesSelectedSubjects(text, opp.fieldTags, selectedField);
    });
  }, [opportunities, selectedField, keywordQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* FIGMA NODE 60-798: Unified Discovery Hero Card with Integrated Category Tabs */}
      <div className="bg-white rounded-3xl border border-[#EAECF0] shadow-sm relative z-30 mb-6">
        
        {/* Top White Section */}
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-3xl">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#101828] tracking-tight">
              Find Your Desired Scholarship, Lab &amp; Safe Universities
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] font-normal">
              One simple search connects you to Scholarships, qualified professors, and secure regional universities
            </p>
          </div>

          <div className="flex flex-row sm:flex-col sm:items-end justify-between sm:justify-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSwitchToClassic}
                className="text-xs text-[#475467] hover:text-[#101828] font-semibold bg-[#F8FAFC] hover:bg-slate-100 border border-[#D0D5DD] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
              >
                ← Classic View
              </button>

              {/* Grid / List View Toggle matching Figma Node 60-798 */}
              <div className="flex items-center p-0.5 bg-white border border-[#D0D5DD] rounded-xl shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewLayout === 'grid' ? 'bg-[#F4F3FE] text-[#7150E7]' : 'text-[#667085] hover:text-[#101828]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewLayout === 'list' ? 'bg-[#F4F3FE] text-[#7150E7]' : 'text-[#667085] hover:text-[#101828]'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Openings Indicator matching Figma Node 60-798 */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48]">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              <span>{opportunities.length || 58} Live Openings</span>
            </div>
          </div>
        </div>

        {/* Bottom Lavender Filter Section matching Figma Node 60-798 */}
        <div className="bg-[#EDE9FC] px-6 sm:px-7 pt-5 pb-0 border-t border-[#E4DEF7] rounded-b-3xl space-y-4">
          
          {/* Row 1: The 4 Dropdown Pills with small labels above */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Subject */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#475467] pl-1">
                Subject
              </label>
              <CustomDropdown
                variant="pill"
                align="left"
                isMulti={true}
                value={selectedField}
                onChange={(val) => setSelectedField(Array.isArray(val) ? val : [val])}
                buttonClassName="!h-11 !bg-white hover:!bg-white border !border-[#D0D5DD] hover:!border-[#7150E7] !rounded-full text-xs font-semibold text-[#101828] px-3.5 shadow-2xs"
                placeholder="🌐 All Fields"
                searchPlaceholder="Search 40+ subjects across disciplines..."
                options={subjectOptions}
                showSearch={true}
              />
            </div>

            {/* 2. Degree */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#475467] pl-1">
                Degree
              </label>
              <CustomDropdown
                variant="pill"
                align="left"
                value={selectedDegree}
                onChange={(val) => setSelectedDegree(val)}
                buttonClassName="!h-11 !bg-white hover:!bg-white border !border-[#D0D5DD] hover:!border-[#7150E7] !rounded-full text-xs font-semibold text-[#101828] px-3.5 shadow-2xs"
                placeholder="Select Degree"
                options={degreeOptions}
                showSearch={false}
              />
            </div>

            {/* 3. Country (Searchable CustomDropdown with 50+ countries) */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#475467] pl-1">
                Country
              </label>
              <CustomDropdown
                variant="pill"
                align="left"
                isMulti={true}
                value={selectedCountry}
                onChange={(val) => setSelectedCountry(Array.isArray(val) ? val : [val])}
                buttonClassName="!h-11 !bg-white hover:!bg-white border !border-[#D0D5DD] hover:!border-[#7150E7] !rounded-full text-xs font-semibold text-[#101828] px-3.5 shadow-2xs"
                placeholder="🌐 All Countries"
                searchPlaceholder="Search 50+ countries..."
                options={getCountryOptions()}
                showSearch={true}
              />
            </div>

            {/* 4. Acceptance & Funding */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#475467] pl-1">
                Acceptance &amp; Funding
              </label>
              <CustomDropdown
                variant="pill"
                align="right"
                value={fundingPreference}
                onChange={(val) => setFundingPreference(val)}
                buttonClassName="!h-11 !bg-white hover:!bg-white border !border-[#D0D5DD] hover:!border-[#7150E7] !rounded-full text-xs font-semibold text-[#101828] px-3.5 shadow-2xs"
                placeholder="Select Strategy"
                options={fundingOptions}
                showSearch={false}
              />
            </div>

          </div>

          {/* Row 2: Search Input + Explore Results Button matching Figma Node 60-798 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                placeholder="Type any keyword (e.g. Stanford, Interaction Design, Germany, Chevening, Arkansas, Full Ride)..."
                className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm bg-transparent border-none text-[#101828] placeholder:text-[#98A2B3] placeholder:italic focus:outline-hidden"
              />
              {keywordQuery && (
                <button
                  type="button"
                  onClick={() => setKeywordQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="h-10 px-6 rounded-full bg-[#7150E7] hover:bg-[#5E3CD4] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
            >
              Explore Results
            </button>
          </div>

          {/* Dotted Divider matching Figma Node 60-798 */}
          <div className="border-t border-dashed border-[#D6BBFB]/80 pt-2" />

          {/* Row 3: Integrated Category Tabs matching Figma Node 60-798 */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 sm:gap-10 pt-1">
            {/* Tab 1: Safe-Bet Universities */}
            <button
              type="button"
              onClick={() => setActiveSection('safe_unis')}
              className={`pb-3 text-left transition-all cursor-pointer relative group select-none ${
                activeSection === 'safe_unis'
                  ? 'text-[#101828]'
                  : 'text-[#475467] hover:text-[#101828]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold">Safe-Bet Universities</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSection === 'safe_unis'
                    ? 'bg-[#7150E7] text-white'
                    : 'bg-white/80 text-[#7150E7]'
                }`}>
                  {safeUniversities.length}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                High Acceptance &amp; $0 Tuition
              </p>
              
              {/* Active Indicator Underline */}
              {activeSection === 'safe_unis' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#7150E7] rounded-t-full" />
              )}
            </button>

            {/* Tab 2: Full-Ride Scholarships */}
            <button
              type="button"
              onClick={() => setActiveSection('scholarships')}
              className={`pb-3 text-left transition-all cursor-pointer relative group select-none ${
                activeSection === 'scholarships'
                  ? 'text-[#101828]'
                  : 'text-[#475467] hover:text-[#101828]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold">Full-Ride Scholarships</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSection === 'scholarships'
                    ? 'bg-[#7150E7] text-white'
                    : 'bg-white/80 text-[#7150E7]'
                }`}>
                  {filteredScholarships.length}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                100% Free Tuition Waivers
              </p>
              
              {activeSection === 'scholarships' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#7150E7] rounded-t-full" />
              )}
            </button>

            {/* Tab 3: Professors & Labs */}
            <button
              type="button"
              onClick={() => setActiveSection('professors')}
              className={`pb-3 text-left transition-all cursor-pointer relative group select-none ${
                activeSection === 'professors'
                  ? 'text-[#101828]'
                  : 'text-[#475467] hover:text-[#101828]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold">Professors &amp; Labs</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSection === 'professors'
                    ? 'bg-[#7150E7] text-white'
                    : 'bg-white/80 text-[#7150E7]'
                }`}>
                  {filteredProfessors.length}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-normal truncate max-w-[200px]">
                Hiring in {selectedField.includes('ALL') || selectedField.length === 0 ? 'All Fields' : selectedField.length > 2 ? `${selectedField.slice(0, 2).join(', ')} +${selectedField.length - 2}` : selectedField.join(', ')}
              </p>
              
              {activeSection === 'professors' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#7150E7] rounded-t-full" />
              )}
            </button>

            {/* Optional: View All Combined Pill on Far Right */}
            <div className="ml-auto hidden md:block pb-3">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'all' ? 'safe_unis' : 'all')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  activeSection === 'all'
                    ? 'bg-[#101828] text-white font-bold'
                    : 'text-[#64748B] hover:text-[#101828] bg-white/60 hover:bg-white'
                }`}
              >
                {activeSection === 'all' ? '✓ Showing All' : 'View All Combined'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. UNIFIED SECTION 1: SAFE REGIONAL UNIVERSITIES (RANK 1,000 – 5,000+) */}
      {(activeSection === 'all' || activeSection === 'safe_unis') && safeUniversities.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Highest Acceptance &amp; Zero Tuition Gems (Rank 1,000 – 5,000+)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Safe-Bet Universities with Guaranteed Funding &amp; Assistantships
              </h2>
            </div>
            <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200 self-start sm:self-auto">
              ✓ 85% – 95% Acceptance Rate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeUniversities.map((uni) => (
              <div 
                key={uni.id}
                className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{uni.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{uni.field}</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{uni.country}</span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                    {uni.rankBadge}
                  </span>

                  <div className="bg-emerald-50/40 rounded-xl p-3 text-xs space-y-1.5 border border-emerald-100">
                    <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>Financial:</strong> {uni.fundingBenefit}</span>
                    </p>
                    <p className="text-slate-600">
                      🏡 <strong>Living:</strong> {uni.cost}
                    </p>
                    <p className="text-slate-600">
                      🎓 <strong>Admission:</strong> {uni.requirements}
                    </p>
                  </div>
                </div>

                <a
                  href={uni.officialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-4 rounded-xl text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Official Admissions &amp; Funding Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. UNIFIED SECTION 2: 100% FREE SCHOLARSHIPS */}
      {(activeSection === 'all' || activeSection === 'scholarships') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7150E7]">
                <Award className="w-4 h-4 text-[#7150E7]" />
                <span>Verified Global Scholarships</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Full-Ride &amp; Tuition Waiver Scholarships ({filteredScholarships.length})
              </h2>
            </div>
          </div>

          {filteredScholarships.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No scholarships matched these criteria. Try selecting "All Countries" or resetting the keyword.
            </div>
          ) : (
            <div className={viewLayout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
              {filteredScholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  scholarship={sch}
                  onSelect={(s) => onOpenScholarshipDetail(s)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 5. UNIFIED SECTION 3: PROFESSORS & LABS CURRENTLY HIRING */}
      {(activeSection === 'all' || activeSection === 'professors') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Faculty &amp; Research Supervisors</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Professors &amp; Labs with Open Positions in {selectedField.includes('ALL') || selectedField.length === 0 ? 'All Fields' : selectedField.join(', ')} ({filteredProfessors.length})
              </h2>
            </div>
          </div>

          {filteredProfessors.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No professors matched this query. Try switching field or country.
            </div>
          ) : (
            <div className={viewLayout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
              {filteredProfessors.map((prof) => (
                <ProfessorCard
                  key={prof.id}
                  professor={prof}
                />
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
};
