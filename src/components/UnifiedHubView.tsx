'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Scholarship, Professor, HiringOpportunity } from '@/types';
import { ScholarshipCard } from '@/components/ScholarshipCard';
import { ProfessorCard } from '@/components/ProfessorCard';
import { ResearchPapersView } from '@/components/ResearchPapersView';
import { WORLD_COUNTRIES, getCountryOptions } from '@/data/countries';
import { getSubjectOptions, matchesSelectedSubjects } from '@/data/subjects';
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown';
import { OpportunityCard } from '@/components/OpportunityCard';
import { parseNaturalLanguageQuery, matchItemSemantically } from '@/lib/semanticSearch';
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
  ChevronDown,
  BookOpen,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedHubViewProps {
  onSwitchToClassic: () => void;
  onOpenColdEmail?: (prof: Professor) => void;
  onOpenScholarshipDetail: (sch: Scholarship) => void;
  activeTab?: string;
  setActiveTab?: (tab: 'scholarships' | 'opportunities' | 'professors' | 'research' | 'tracker' | 'saved' | 'profile') => void;
}

export const UnifiedHubView: React.FC<UnifiedHubViewProps> = ({
  onSwitchToClassic,
  onOpenColdEmail,
  onOpenScholarshipDetail,
  activeTab,
  setActiveTab,
}) => {
  const { 
    profile, 
    scholarships, 
    professors, 
    opportunities,
    syncLiveOpportunities,
    isSyncingOpportunities,
    lastSyncedAt,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  // Live Internet / OpenAlex & Web Search States
  const [isLiveWebActive, setIsLiveWebActive] = useState(true);
  const [isLiveSearchingProfessors, setIsLiveSearchingProfessors] = useState(false);
  const [liveProfessors, setLiveProfessors] = useState<Professor[]>([]);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);

  // View Layout State (Grid vs List)
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Unified Omnisearch States
  const [selectedField, setSelectedField] = useState<string[]>(['UX Design']);
  const [selectedDegree, setSelectedDegree] = useState('Masters');
  const [selectedCountry, setSelectedCountry] = useState<string[]>(['ALL']);
  const [fundingPreference, setFundingPreference] = useState<'FREE_ONLY' | 'SAFE_GEMS' | 'ALL'>('SAFE_GEMS');
  const [keywordQuery, setKeywordQuery] = useState(globalSearchQuery || '');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Sync with Global Header Search
  useEffect(() => {
    if (globalSearchQuery !== keywordQuery) {
      setKeywordQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleKeywordChange = (val: string) => {
    setKeywordQuery(val);
    setGlobalSearchQuery(val);
  };

  // Parse natural language query intent
  const parsedIntent = useMemo(() => {
    return parseNaturalLanguageQuery(keywordQuery);
  }, [keywordQuery]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const renderCountryFlag = (country: string, id: string) => {
    const c = country.toLowerCase();
    if (c.includes('germany') || c.includes('de')) {
      return (
        <svg className="w-7 h-[18px] rounded-[4px] shrink-0 shadow-2xs" viewBox="0 0 28 18" fill="none">
          <clipPath id={`flag-de-${id}`}><rect width="28" height="18" rx="4" fill="white"/></clipPath>
          <g clipPath={`url(#flag-de-${id})`}>
            <rect width="28" height="6" fill="#000000"/>
            <rect y="6" width="28" height="6" fill="#DD0000"/>
            <rect y="12" width="28" height="6" fill="#FFCE00"/>
          </g>
        </svg>
      );
    }
    if (c.includes('usa') || c.includes('united states') || c.includes('us')) {
      return (
        <svg className="w-7 h-[18px] rounded-[4px] shrink-0 shadow-2xs" viewBox="0 0 28 18" fill="none">
          <clipPath id={`flag-us-${id}`}><rect width="28" height="18" rx="4" fill="white"/></clipPath>
          <g clipPath={`url(#flag-us-${id})`}>
            <rect width="28" height="18" fill="#B22234"/>
            <rect y="2" width="28" height="2" fill="white"/>
            <rect y="5" width="28" height="2" fill="white"/>
            <rect y="8" width="28" height="2" fill="white"/>
            <rect y="11" width="28" height="2" fill="white"/>
            <rect y="14" width="28" height="2" fill="white"/>
            <rect width="12" height="9" fill="#3C3B6E"/>
            <circle cx="3" cy="2.5" r="0.8" fill="white"/>
            <circle cx="6" cy="2.5" r="0.8" fill="white"/>
            <circle cx="9" cy="2.5" r="0.8" fill="white"/>
            <circle cx="4.5" cy="4.5" r="0.8" fill="white"/>
            <circle cx="7.5" cy="4.5" r="0.8" fill="white"/>
            <circle cx="3" cy="6.5" r="0.8" fill="white"/>
            <circle cx="6" cy="6.5" r="0.8" fill="white"/>
            <circle cx="9" cy="6.5" r="0.8" fill="white"/>
          </g>
        </svg>
      );
    }
    if (c.includes('canada') || c.includes('ca')) {
      return (
        <svg className="w-7 h-[18px] rounded-[4px] shrink-0 shadow-2xs" viewBox="0 0 28 18" fill="none">
          <clipPath id={`flag-ca-${id}`}><rect width="28" height="18" rx="4" fill="white"/></clipPath>
          <g clipPath={`url(#flag-ca-${id})`}>
            <rect width="28" height="18" fill="#FF0000"/>
            <rect x="7" width="14" height="18" fill="#FFFFFF"/>
            <path d="M14 4L15 7L18 6L16.5 9L19 11L16 11.5L16.5 14L14 12.5L11.5 14L12 11.5L9 11L11.5 9L10 6L13 7L14 4Z" fill="#FF0000"/>
          </g>
        </svg>
      );
    }
    if (c.includes('switzerland') || c.includes('ch')) {
      return (
        <svg className="w-7 h-[18px] rounded-[4px] shrink-0 shadow-2xs" viewBox="0 0 28 18" fill="none">
          <clipPath id={`flag-ch-${id}`}><rect width="28" height="18" rx="4" fill="white"/></clipPath>
          <g clipPath={`url(#flag-ch-${id})`}>
            <rect width="28" height="18" fill="#D52B1E"/>
            <rect x="12" y="4" width="4" height="10" fill="white"/>
            <rect x="9" y="7" width="10" height="4" fill="white"/>
          </g>
        </svg>
      );
    }
    return (
      <svg className="w-7 h-[18px] rounded-[4px] shrink-0 shadow-2xs" viewBox="0 0 28 18" fill="none">
        <clipPath id={`flag-uk-${id}`}><rect width="28" height="18" rx="4" fill="white"/></clipPath>
        <g clipPath={`url(#flag-uk-${id})`}>
          <rect width="28" height="18" fill="#012169"/>
          <path d="M0 0L28 18M28 0L0 18" stroke="white" strokeWidth="3"/>
          <path d="M0 0L28 18M28 0L0 18" stroke="#C8102E" strokeWidth="1.8"/>
          <path d="M14 0V18M0 9H28" stroke="white" strokeWidth="5"/>
          <path d="M14 0V18M0 9H28" stroke="#C8102E" strokeWidth="3"/>
        </g>
      </svg>
    );
  };

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

  // Active Tab within Unified Results: 'safe_unis' | 'scholarships' | 'professors' | 'research_papers' | 'all'
  const [activeSection, setActiveSection] = useState<'safe_unis' | 'scholarships' | 'professors' | 'research_papers' | 'all'>('safe_unis');

  useEffect(() => {
    if (activeTab === 'scholarships') {
      setActiveSection('scholarships');
    } else if (activeTab === 'professors') {
      setActiveSection('professors');
    } else if (activeTab === 'research') {
      setActiveSection('research_papers');
    } else if (activeTab === 'opportunities') {
      setActiveSection('safe_unis');
    }
  }, [activeTab]);

  // Filtered Scholarships based on Omnisearch & Semantic Intent
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      const text = `${s.title} ${s.provider} ${s.specializations.join(' ')} ${s.tags.join(' ')} ${s.description} ${s.countries.join(' ')} ${s.fundingAmount} ${s.fundingType}`;
      
      // Semantic Keyword or Field match
      if (keywordQuery.trim()) {
        const { matches } = matchItemSemantically(text, s.countries, parsedIntent);
        if (!matches) return false;
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
  }, [scholarships, selectedField, selectedDegree, selectedCountry, fundingPreference, keywordQuery, parsedIntent]);

  // Query OpenAlex Global API in real-time when Live Internet is ON
  useEffect(() => {
    if (!isLiveWebActive) {
      setLiveProfessors([]);
      return;
    }

    const timer = setTimeout(async () => {
      const q = keywordQuery.trim();
      const f = selectedField.includes('ALL') ? '' : selectedField.join(' ');
      
      if (!q && !f) return;

      setIsLiveSearchingProfessors(true);
      try {
        const res = await fetch(`/api/professors/search?query=${encodeURIComponent(q)}&field=${encodeURIComponent(f)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.professors)) {
            setLiveProfessors(data.professors);
          }
        }
      } catch (err) {
        console.error('Failed to fetch from OpenAlex:', err);
      } finally {
        setIsLiveSearchingProfessors(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [keywordQuery, selectedField, isLiveWebActive]);

  // Filtered Professors based on Omnisearch + Live OpenAlex
  const filteredProfessors = useMemo(() => {
    const localFiltered = professors.filter((p) => {
      const text = `${p.name} ${p.university} ${p.department} ${p.labName || ''} ${p.country} ${p.researchTags.join(' ')} ${p.bio || ''}`;
      
      // Semantic Keyword or Field match
      if (keywordQuery.trim()) {
        const { matches } = matchItemSemantically(text, p.country, parsedIntent);
        if (!matches) return false;
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

    if (!isLiveWebActive || liveProfessors.length === 0) {
      return localFiltered;
    }

    const existingNames = new Set(localFiltered.map(p => p.name.toLowerCase()));
    const additional = liveProfessors.filter(lp => !existingNames.has(lp.name.toLowerCase()));
    return [...localFiltered, ...additional];
  }, [professors, liveProfessors, isLiveWebActive, selectedField, selectedCountry, keywordQuery, parsedIntent]);

  // Safe Bet Universities & Fully Funded Faculty Lab Opportunities Populated from Academic Database
  const safeUniversities = useMemo(() => {
    const list = [
      {
        id: 'safe_astate_01',
        name: 'Arkansas State University',
        country: 'USA',
        field: 'UX Design, CS & Digital Media',
        rankBadge: 'Rank 1,200 – 1,800 • High Acceptance (88%)',
        financialBase: 'In-State Tuition Waiver ',
        financialHighlight: '+ $1,400/mo',
        financialSuffix: ' Graduate Assistantship (TA/RA)',
        admission: 'Accepts CGPA 2.65+, No GRE required, 4+ Years Study Gap Accepted',
        living: 'Jonesboro AR Low Cost College Town ($650/mo)',
        officialLink: 'https://www.astate.edu/graduate-school',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['UX Design', 'Computer Science', 'Digital Media', 'Human-Computer Interaction'],
      },
      {
        id: 'safe_lamar_02',
        name: 'Lamar University',
        country: 'USA',
        field: 'Informatics, Applied CS & HCI',
        rankBadge: 'Rank 1,400+ • High Acceptance (84%)',
        financialBase: 'Out-of-State Waiver ',
        financialHighlight: '+ $1,550/mo',
        financialSuffix: ' Departmental Teaching Assistantship',
        admission: 'Accepts CGPA 2.50+, No GRE required for STEM, 5+ Years Study Gap Accepted',
        living: 'Beaumont TX Affordable Living ($620/mo)',
        officialLink: 'https://www.lamar.edu/graduate-admissions',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['UX Design', 'Informatics', 'Computer Science', 'Data Science', 'Human-Computer Interaction'],
      },
      {
        id: 'safe_bremen_03',
        name: 'University of Bremen',
        country: 'Germany',
        field: 'Digital Media, UX & Interaction Design',
        rankBadge: 'Public University • 100% Free Tuition (€0)',
        financialBase: 'Zero Tuition Fees (€0) ',
        financialHighlight: '+ Free Transit',
        financialSuffix: ' Semesterticket + €14/hr Student HiWi Jobs',
        admission: 'Zero Tuition for All, 18 Months Stay-Back Job Visa, English MOI Accepted',
        living: 'Bremen Student Dorms (€750 - €850/mo)',
        officialLink: 'https://www.uni-bremen.de/en/studies/international',
        degrees: ['Masters'],
        fieldTags: ['UX Design', 'Interaction Design', 'Digital Media', 'Human-Computer Interaction'],
      },
      {
        id: 'safe_mun_04',
        name: 'Memorial University of Newfoundland',
        country: 'Canada',
        field: 'Computer Science, HCI & Applied Computing',
        rankBadge: 'Rank 700 – 900 • Canadian Atlantic PNP PR Bonus',
        financialBase: 'Graduate Fellowship ',
        financialHighlight: '+ $1,750/mo',
        financialSuffix: ' Baseline Graduate Funding Guarantee',
        admission: 'No GRE, Flexible CGPA assessment (2.75+), Fast Atlantic PNP PR Pathway',
        living: 'St. John\'s NL Student Housing ($680/mo)',
        officialLink: 'https://www.mun.ca/sgs',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Computer Science', 'Human-Computer Interaction', 'UX Design', 'Applied Computing'],
      },
      {
        id: 'safe_usm_05',
        name: 'University of Southern Mississippi',
        country: 'USA',
        field: 'Informatics, UX & Computational Science',
        rankBadge: 'Rank 1,500+ • 92% Graduate Admission Rate',
        financialBase: 'Full Tuition Remission ',
        financialHighlight: '+ $1,350/mo',
        financialSuffix: ' Graduate Assistant Stipend',
        admission: 'Low CGPA Friendly (2.50+), GRE Waived upon Inquiry, Fast I-20 Issuance',
        living: 'Hattiesburg MS Low Cost Living ($550/mo)',
        officialLink: 'https://www.usm.edu/graduate-admissions',
        degrees: ['Masters'],
        fieldTags: ['UX Design', 'Informatics', 'Computer Science', 'Human-Computer Interaction'],
      },
      {
        id: 'opp_cmu_hcii_06',
        name: 'Carnegie Mellon University',
        country: 'USA',
        field: 'Human-Computer Interaction Institute (HCII)',
        rankBadge: 'Top 10 Global CS • 100% Full Ride Call',
        financialBase: '100% Full Tuition Remission ',
        financialHighlight: '+ $3,833/mo',
        financialSuffix: ' Research Assistant Stipend ($46k/yr)',
        admission: 'CGPA 3.4+, Portfolio or Coding Background, Direct Lab Interview',
        living: 'Pittsburgh Urban Campus ($950/mo)',
        officialLink: 'https://hcii.cmu.edu/academics/phd',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['UX Design', 'Human-Computer Interaction', 'Artificial Intelligence', 'Software Engineering'],
      },
      {
        id: 'opp_ucsd_designlab_07',
        name: 'UC San Diego',
        country: 'USA',
        field: 'The Design Lab & Cognitive Science',
        rankBadge: 'Rank 30 Global • High Funding Allocation',
        financialBase: 'Full Tuition Waiver ',
        financialHighlight: '+ $3,708/mo',
        financialSuffix: ' Graduate Fellowship ($44.5k/yr)',
        admission: 'CGPA 3.2+, GRE Not Required, Interdisciplinary Backgrounds Welcome',
        living: 'La Jolla Subsidized Graduate Housing ($920/mo)',
        officialLink: 'https://designlab.ucsd.edu',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['UX Design', 'Cognitive Science', 'Interaction Design', 'Product Design', 'Human-Computer Interaction'],
      },
      {
        id: 'opp_ucl_uclic_08',
        name: 'University College London (UCL)',
        country: 'United Kingdom',
        field: 'UCL Interaction Centre (UCLIC)',
        rankBadge: 'Top 10 UK • EPSRC Direct Studentship',
        financialBase: '100% UK/International Tuition Coverage ',
        financialHighlight: '+ £1,856/mo',
        financialSuffix: ' Tax-Free London Living Grant',
        admission: 'UK 2:1 Honours or 3.2+ CGPA, IELTS 7.0, No GRE Required',
        living: 'Bloomsbury Central London (£1,100/mo)',
        officialLink: 'https://uclic.ucl.ac.uk',
        degrees: ['PhD'],
        fieldTags: ['UX Design', 'Human-Computer Interaction', 'Interaction Design', 'Cognitive Ergonomics'],
      },
      {
        id: 'opp_hpi_potsdam_09',
        name: 'Hasso Plattner Institute',
        country: 'Germany',
        field: 'HPI Human Computer Interaction Lab',
        rankBadge: 'Rank 150 Global • Official TV-L E13 Scale',
        financialBase: 'Zero Tuition Fees (€0) ',
        financialHighlight: '+ €4,500/mo',
        financialSuffix: ' German TV-L E13 Government Salary',
        admission: 'Master in CS/Design, Study Gap Allowed, Zero Tuition for All',
        living: 'Potsdam / Berlin Metro ($800/mo)',
        officialLink: 'https://hpi.de/baudisch/home.html',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['UX Design', 'Human-Computer Interaction', 'Interactive Systems', 'Computer Science'],
      },
      {
        id: 'safe_tum_10',
        name: 'Technical University of Munich (TUM)',
        country: 'Germany',
        field: 'Department of Informatics & UX Research',
        rankBadge: 'Rank 30 Global • Top German Technical University',
        financialBase: 'Zero Tuition Fees (€0) ',
        financialHighlight: '+ €2,600/mo',
        financialSuffix: ' Max Planck / TUM Research Salary',
        admission: 'Bachelor in CS/Engineering, VPD & Aptitude Assessment, No Tuition',
        living: 'Munich Student Dorms / WG (€850/mo)',
        officialLink: 'https://www.tum.de/en',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Human-Computer Interaction', 'UX Design', 'Computer Science', 'Artificial Intelligence'],
      },
      {
        id: 'safe_herts_11',
        name: 'University of Hertfordshire',
        country: 'United Kingdom',
        field: 'Creative Tech, Digital Media & Interaction',
        rankBadge: 'UK Top Post-92 • High International Intake',
        financialBase: 'Dean Graduate Scholarship ',
        financialHighlight: '+ £1,200/mo',
        financialSuffix: ' International Merit Discount',
        admission: 'CGPA 2.80+, IELTS 6.0, UK Graduate Visa 2-Year Route',
        living: 'Hatfield Suburb (£720/mo)',
        officialLink: 'https://www.herts.ac.uk',
        degrees: ['Masters'],
        fieldTags: ['UX Design', 'Digital Media', 'Computer Science', 'Interaction Design'],
      },
      {
        id: 'safe_ilmenau_12',
        name: 'TU Ilmenau',
        country: 'Germany',
        field: 'Media Technology, HCI & Audio Informatics',
        rankBadge: 'German Excellence • Lowest Living Cost in Germany',
        financialBase: 'Zero Tuition (€0) ',
        financialHighlight: '+ €1,300/mo',
        financialSuffix: ' Thuringian Research Scholarship',
        admission: 'Bachelor in Media/CS, English B2, No Tuition, Friendly Visa Process',
        living: 'Thuringia Affordable Dorms (€450 - €550/mo)',
        officialLink: 'https://www.tu-ilmenau.de',
        degrees: ['Masters'],
        fieldTags: ['UX Design', 'Digital Media', 'Human-Computer Interaction', 'Computer Science'],
      },
      {
        id: 'opp_stanford_ai_13',
        name: 'Stanford University',
        country: 'USA',
        field: 'Stanford AI Lab (SAIL) & NLP Group',
        rankBadge: 'Top 3 Global • Stanford Graduate Fellow',
        financialBase: '100% Full Tuition Remission ',
        financialHighlight: '+ $4,500/mo',
        financialSuffix: ' Fellowship + Summer Health Insurance',
        admission: 'CGPA 3.6+, Strong Math & ML Background, GRE Optional',
        living: 'Palo Alto On-Campus Graduate Residence ($1,250/mo)',
        officialLink: 'https://ai.stanford.edu',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['Artificial Intelligence', 'Computer Science', 'Machine Learning', 'Data Science', 'Human-Computer Interaction', 'UX Design'],
      },
      {
        id: 'opp_harvard_wyss_14',
        name: 'Harvard University & Wyss Institute',
        country: 'USA',
        field: 'Synthetic Biology & Molecular Informatics',
        rankBadge: 'Top 5 Global • NIH Direct Research Assistantship',
        financialBase: 'Full NIH Grant ',
        financialHighlight: '+ $4,041/mo',
        financialSuffix: ' Living Allowance ($48.5k/yr)',
        admission: 'CGPA 3.5+, Lab Research Experience in Molecular/Bio or CS',
        living: 'Cambridge MA Student Apartments ($1,180/mo)',
        officialLink: 'https://wyss.harvard.edu',
        degrees: ['PhD'],
        fieldTags: ['Biotechnology', 'Biomedical Engineering', 'Data Science', 'Computer Science'],
      },
      {
        id: 'opp_eth_zurich_15',
        name: 'ETH Zurich',
        country: 'Switzerland',
        field: 'Materials & Clean Energy Laboratory',
        rankBadge: 'Rank 7 Global • Swiss SNSF Salary Scale',
        financialBase: 'Zero Tuition (0 CHF) ',
        financialHighlight: '+ CHF 4,666/mo',
        financialSuffix: ' Official Swiss Doctoral Salary',
        admission: 'Masters in Engineering/Physics, IELTS/TOEFL Accepted, No GRE',
        living: 'Zurich Student Living ($1,350/mo)',
        officialLink: 'https://ethz.ch',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['Renewable Energy', 'Chemical Engineering', 'Materials Science', 'Physics'],
      },
      {
        id: 'opp_cambridge_quantum_16',
        name: 'University of Cambridge',
        country: 'United Kingdom',
        field: 'Cavendish Laboratory Quantum Optics',
        rankBadge: 'Top 5 Global • EPSRC Fully Funded',
        financialBase: 'Full University Course Fees Paid ',
        financialHighlight: '+ £1,833/mo',
        financialSuffix: ' Tax-Free UKRI Research Stipend',
        admission: 'UK 1st Class Honours or CGPA 3.5+, Direct Lab Call',
        living: 'Cambridge College Accommodation (£750/mo)',
        officialLink: 'https://www.phy.cam.ac.uk',
        degrees: ['PhD'],
        fieldTags: ['Physics', 'Quantum Computing', 'Electrical Engineering', 'Nanotechnology'],
      },
      {
        id: 'opp_berkeley_robotics_17',
        name: 'UC Berkeley',
        country: 'USA',
        field: 'AUTOLAB Robotics & AI Manipulation',
        rankBadge: 'Rank 4 Global • GSR Full Remission',
        financialBase: 'Full Fee Remission ',
        financialHighlight: '+ $3,900/mo',
        financialSuffix: ' GSR Graduate Researcher Salary',
        admission: 'CGPA 3.3+, Python/Robotics Skills, GRE Waived',
        living: 'Berkeley Co-op / Graduate Apartments ($980/mo)',
        officialLink: 'https://autolab.berkeley.edu',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['Robotics', 'Computer Science', 'Artificial Intelligence', 'Mechanical Engineering', 'Human-Computer Interaction', 'UX Design'],
      },
      {
        id: 'opp_toronto_met_18',
        name: 'Toronto Metropolitan University',
        country: 'Canada',
        field: 'CarAI Research Laboratory & HCI',
        rankBadge: 'Rank 600 • High Acceptance (82%)',
        financialBase: 'Full Tuition Grant ',
        financialHighlight: '+ $2,333/mo',
        financialSuffix: ' NSERC Graduate Living Stipend',
        admission: 'Accepts CGPA 3.0+, Study Gap 3+ Years Accepted, No GRE Needed',
        living: 'Downtown Toronto Transit Corridor ($880/mo)',
        officialLink: 'https://www.torontomu.ca',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Computer Science', 'Artificial Intelligence', 'Human-Computer Interaction', 'UX Design'],
      },
      {
        id: 'opp_jhu_biomed_19',
        name: 'Johns Hopkins University',
        country: 'USA',
        field: 'Center for Imaging Science, BME Department',
        rankBadge: 'Top 10 Global • BME Top Ranked',
        financialBase: 'Full Tuition Waiver ',
        financialHighlight: '+ $3,750/mo',
        financialSuffix: ' NIH Graduate Fellowship ($45k/yr)',
        admission: 'CGPA 3.4+, BME/CS Background, Full 5-Year NIH Guarantee',
        living: 'Baltimore Graduate Housing ($890/mo)',
        officialLink: 'https://bme.jhu.edu',
        degrees: ['PhD'],
        fieldTags: ['Biomedical Engineering', 'Neuroscience', 'Artificial Intelligence', 'Computer Vision', 'Data Science'],
      },
      {
        id: 'opp_oxford_econ_20',
        name: 'University of Oxford',
        country: 'United Kingdom',
        field: 'Department of Economics & Global Trade Analytics',
        rankBadge: 'Top 2 Global • Clarendon Fully Funded',
        financialBase: 'Clarendon Full Ride ',
        financialHighlight: '+ £1,625/mo',
        financialSuffix: ' Course Fee + Tax-Free Living',
        admission: 'UK 1st Class / CGPA 3.7+, Quantitative Research Proposal',
        living: 'Oxford College Rooms (£800/mo)',
        officialLink: 'https://www.economics.ox.ac.uk',
        degrees: ['PhD', 'Masters'],
        fieldTags: ['Economics', 'Data Science', 'Public Policy', 'Finance', 'Statistics'],
      },
      {
        id: 'safe_wichita_21',
        name: 'Wichita State University',
        country: 'USA',
        field: 'Computer Science, Aerospace & Industrial Engineering',
        rankBadge: 'Rank 800 – 1,000 • High Acceptance (85%)',
        financialBase: 'In-State Tuition Waiver ',
        financialHighlight: '+ $1,450/mo',
        financialSuffix: ' Graduate Teaching Assistantship (GTA)',
        admission: 'Accepts CGPA 2.65+, GRE Waived for STEM, Study Gap 4+ Years Accepted',
        living: 'Wichita KS Affordable Living ($640/mo)',
        officialLink: 'https://www.wichita.edu/academics/graduate_school',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Computer Science', 'Aerospace Engineering', 'Mechanical Engineering', 'Data Science'],
      },
      {
        id: 'safe_sd_mines_22',
        name: 'South Dakota Mines',
        country: 'USA',
        field: 'Mechanical, Materials Science & Computer Engineering',
        rankBadge: 'Top Regional STEM • High Acceptance (83%)',
        financialBase: 'Reduced STEM Rate ',
        financialHighlight: '+ $1,600/mo',
        financialSuffix: ' Graduate Research Assistantship',
        admission: 'Accepts CGPA 2.75+, Low Tuition ($5,500/semester), No GRE Required',
        living: 'Rapid City SD Low Cost Student Housing ($610/mo)',
        officialLink: 'https://www.sdsmt.edu/GradEd',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Materials Science', 'Mechanical Engineering', 'Computer Science', 'Civil Engineering'],
      },
      {
        id: 'safe_mnsu_23',
        name: 'Minnesota State University, Mankato',
        country: 'USA',
        field: 'Data Science, Software Engineering & Applied HCI',
        rankBadge: 'Rank 1,200+ • High Acceptance (80%)',
        financialBase: 'Non-Resident Waiver ',
        financialHighlight: '+ $1,350/mo',
        financialSuffix: ' Departmental Graduate Assistantship',
        admission: 'Accepts CGPA 2.60+, 5+ Years Study Gap Accepted, No GRE Needed',
        living: 'Mankato MN Student Apartments ($630/mo)',
        officialLink: 'https://grad.mnsu.edu',
        degrees: ['Masters'],
        fieldTags: ['Data Science', 'Software Engineering', 'Computer Science', 'UX Design'],
      },
      {
        id: 'safe_nwmissouri_24',
        name: 'Northwest Missouri State University',
        country: 'USA',
        field: 'Applied Computer Science & Information Systems',
        rankBadge: 'Rank 1,400+ • High Acceptance (86%)',
        financialBase: 'In-State Tuition Match ',
        financialHighlight: '+ $1,250/mo',
        financialSuffix: ' Campus Graduate Assistantship',
        admission: 'Accepts CGPA 2.50+, No GRE Required for CS, Fast I-20 Processing',
        living: 'Maryville MO Safe Rural Living ($590/mo)',
        officialLink: 'https://www.nwmissouri.edu/graduate',
        degrees: ['Masters'],
        fieldTags: ['Computer Science', 'Information Systems', 'Data Science', 'Software Engineering'],
      },
      {
        id: 'safe_tamucc_25',
        name: 'Texas A&M University–Corpus Christi',
        country: 'USA',
        field: 'Geospatial Computing, Marine Data Science & CS',
        rankBadge: 'Tier 2 Research • High Acceptance (82%)',
        financialBase: 'Texas Out-of-State Waiver ',
        financialHighlight: '+ $1,500/mo',
        financialSuffix: ' Graduate Assistantship Package',
        admission: 'Accepts CGPA 2.70+, $1,000 Competitive Scholarship unlocks In-State Tuition',
        living: 'Corpus Christi TX Coastal Living ($680/mo)',
        officialLink: 'https://gradschool.tamucc.edu',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Computer Science', 'Geospatial Data', 'Marine Science', 'Data Science'],
      },
      {
        id: 'safe_uncw_26',
        name: 'University of North Carolina Wilmington',
        country: 'USA',
        field: 'Data Science, Coastal Environmental Systems & CS',
        rankBadge: 'Rank 700 • Acceptance (74%)',
        financialBase: 'Tuition Remission ',
        financialHighlight: '+ $1,400/mo',
        financialSuffix: ' Departmental TA / Lab Assistant',
        admission: 'Accepts CGPA 2.80+, Holistic Evaluation, No GRE Required',
        living: 'Wilmington NC Student Housing ($720/mo)',
        officialLink: 'https://uncw.edu/gradschool',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Data Science', 'Computer Science', 'Environmental Science', 'Bioinformatics'],
      },
      {
        id: 'safe_brandon_27',
        name: 'Brandon University',
        country: 'Canada',
        field: 'Environmental Science, Mathematics & Computing',
        rankBadge: 'Low Cost Public Canadian Uni • High Acceptance (82%)',
        financialBase: 'Low Tuition (CAD $8,400/yr) ',
        financialHighlight: '+ CAD $1,200/mo',
        financialSuffix: ' Graduate Teaching Stipend',
        admission: 'Accepts CGPA 2.80+ (B- average), Fast Visa Processing in Manitoba',
        living: 'Brandon MB Affordable Community Living ($650 CAD/mo)',
        officialLink: 'https://www.brandonu.ca/graduate-studies',
        degrees: ['Masters'],
        fieldTags: ['Computer Science', 'Environmental Science', 'Mathematics', 'Data Science'],
      },
      {
        id: 'safe_unbc_28',
        name: 'University of Northern British Columbia',
        country: 'Canada',
        field: 'Natural Resources, Environmental CS & Health Sciences',
        rankBadge: 'Ranked Top 3 Primarily Undergrad Canada • Acceptance (78%)',
        financialBase: 'BC Graduate Scholarship ',
        financialHighlight: '+ CAD $1,500/mo',
        financialSuffix: ' NSERC/SSHRC RA Funding',
        admission: 'Accepts CGPA 3.0+, Direct Supervisor Nomination Pathway',
        living: 'Prince George BC University Residence ($750 CAD/mo)',
        officialLink: 'https://www.unbc.ca/graduate-programs',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Environmental Science', 'Computer Science', 'Public Health', 'Data Science'],
      },
      {
        id: 'safe_upei_29',
        name: 'University of Prince Edward Island',
        country: 'Canada',
        field: 'Sustainable Design Engineering, Analytics & CS',
        rankBadge: 'Atlantic Canada Public • High Acceptance (80%)',
        financialBase: 'Low Atlantic Tuition ',
        financialHighlight: '+ CAD $1,100/mo',
        financialSuffix: ' Departmental TA Assistance',
        admission: 'Accepts CGPA 2.70+, Easy Provincial Nominee Program (PNP) Route',
        living: 'Charlottetown PEI Island Living ($700 CAD/mo)',
        officialLink: 'https://www.upei.ca/graduatestudies',
        degrees: ['Masters'],
        fieldTags: ['Design Engineering', 'Computer Science', 'Data Science', 'Civil Engineering'],
      },
      {
        id: 'safe_fhdortmund_30',
        name: 'Fachhochschule Dortmund',
        country: 'Germany',
        field: 'Digital Transformation, Applied UX & Embedded Systems',
        rankBadge: 'Public University • 100% Free Tuition (€0)',
        financialBase: 'Zero Tuition (€0) ',
        financialHighlight: '+ NRW Transit Pass',
        financialSuffix: ' Free Travel + €14.50/hr Student HiWi Jobs',
        admission: 'Accepts German Grade 2.5 (US ~2.8+), 100% English-Taught, No GRE',
        living: 'Dortmund Student Dormitory (€680/mo)',
        officialLink: 'https://www.fh-dortmund.de/en',
        degrees: ['Masters'],
        fieldTags: ['UX Design', 'Embedded Systems', 'Computer Science', 'Software Engineering'],
      },
      {
        id: 'safe_dit_31',
        name: 'Deggendorf Institute of Technology',
        country: 'Germany',
        field: 'Artificial Intelligence, Applied CS & Mechatronics',
        rankBadge: 'Public Bavarian Institute • 100% Free Tuition (€0)',
        financialBase: 'Zero Tuition (€0) ',
        financialHighlight: '+ Bavaria Silicon Valley',
        financialSuffix: ' Campus High-Tech Lab HiWi Positions',
        admission: 'Accepts CGPA 2.7+, English-Taught Master’s, High Visa Approval Rate',
        living: 'Deggendorf Bavaria Low Cost Living (€650/mo)',
        officialLink: 'https://www.th-deg.de/en',
        degrees: ['Masters'],
        fieldTags: ['Artificial Intelligence', 'Mechatronics', 'Computer Science', 'Robotics'],
      },
      {
        id: 'safe_oulu_32',
        name: 'University of Oulu',
        country: 'Finland',
        field: '6G Wireless Communications, Software & Health AI',
        rankBadge: 'European 6G Hub • 50-70% Tuition Waiver',
        financialBase: '70% Tuition Scholarship ',
        financialHighlight: '+ €1,300/mo',
        financialSuffix: ' Funded Nokia/EU Research Assistantship',
        admission: 'Accepts CGPA 2.8+, Direct English Degree, Spouse Work Permit Allowed',
        living: 'Oulu Student Housing (PSOAS) (€450/mo)',
        officialLink: 'https://www.oulu.fi/en',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Telecommunications', 'Computer Science', 'Artificial Intelligence', 'Electrical Engineering'],
      },
      {
        id: 'safe_greenwich_33',
        name: 'University of Greenwich',
        country: 'United Kingdom',
        field: 'Computing, Data Science & Built Environment',
        rankBadge: 'London Maritime Campus • High Acceptance (77%)',
        financialBase: '£3,000 International Bursary ',
        financialHighlight: '+ £13.50/hr',
        financialSuffix: ' On-Campus Student Ambassador Roles',
        admission: 'Accepts CGPA 2.6+, 4+ Years Gap Accepted, 2-Year Graduate Route Visa',
        living: 'London Student Residence (£720/mo)',
        officialLink: 'https://www.gre.ac.uk/postgraduate',
        degrees: ['Masters'],
        fieldTags: ['Computer Science', 'Data Science', 'Civil Engineering', 'UX Design'],
      },
      {
        id: 'safe_teesside_34',
        name: 'Teesside University',
        country: 'United Kingdom',
        field: 'Games Computing, Digital Media & Applied AI',
        rankBadge: 'Top Modern University UK • High Acceptance (84%)',
        financialBase: '£4,000 Global Excellence Award ',
        financialHighlight: '+ UK Lowest Living Cost',
        financialSuffix: ' Affordable Living Package',
        admission: 'Accepts CGPA 2.5+, Study Gap 5+ Years Accepted, Quick CAS Turnaround',
        living: 'Middlesbrough Living (One of UK’s Lowest, £520/mo)',
        officialLink: 'https://www.tees.ac.uk/postgraduate',
        degrees: ['Masters'],
        fieldTags: ['Computer Science', 'Digital Media', 'Artificial Intelligence', 'UX Design'],
      },
      {
        id: 'safe_ecu_35',
        name: 'Edith Cowan University',
        country: 'Australia',
        field: 'Cyber Security, Computer Science & Petroleum Engineering',
        rankBadge: 'Global Cyber Hub • High Acceptance (81%)',
        financialBase: '20% Tuition Fee Discount ',
        financialHighlight: '+ 5-Year PSW Visa',
        financialSuffix: ' Regional Australia Extended Work Rights',
        admission: 'Accepts CGPA 2.65+, Direct Entry without GRE, High Visa Success',
        living: 'Perth Shared Apartments ($750 AUD/mo)',
        officialLink: 'https://www.ecu.edu.au',
        degrees: ['Masters', 'PhD'],
        fieldTags: ['Cybersecurity', 'Computer Science', 'Data Science', 'Engineering'],
      },
    ];

    let filtered = list;

    // 1. Country Filter
    if (selectedCountry.length > 0 && !selectedCountry.includes('ALL')) {
      filtered = filtered.filter((u) => {
        const uc = u.country.toLowerCase();
        return selectedCountry.some((sc) => {
          const target = sc.toLowerCase();
          return uc.includes(target) ||
                 target.includes(uc.slice(0, 3)) ||
                 (target === 'usa' && (uc.includes('usa') || uc.includes('united states'))) ||
                 (target === 'uk' && (uc.includes('uk') || uc.includes('united kingdom'))) ||
                 (target === 'canada' && uc.includes('canada')) ||
                 (target === 'germany' && uc.includes('germany')) ||
                 (target === 'switzerland' && uc.includes('switzerland'));
        });
      });
    }

    // 2. Degree Filter
    if (selectedDegree !== 'ALL') {
      filtered = filtered.filter((u) => u.degrees.includes(selectedDegree as any));
    }

    // 3. Subject / Field Filter
    if (selectedField.length > 0 && !selectedField.includes('ALL')) {
      filtered = filtered.filter((u) => 
        matchesSelectedSubjects(u.field + ' ' + u.name + ' ' + u.fieldTags.join(' '), u.fieldTags, selectedField)
      );
    }

    // 4. Keyword / Semantic Query Filter
    if (keywordQuery.trim()) {
      filtered = filtered.filter((u) => {
        const text = `${u.name} ${u.field} ${u.country} ${u.admission} ${u.financialBase} ${u.financialHighlight} ${u.financialSuffix} ${u.living} ${u.fieldTags.join(' ')}`;
        const { matches } = matchItemSemantically(text, u.country, parsedIntent);
        return matches;
      });
    }

    return filtered;
  }, [selectedCountry, selectedDegree, selectedField, keywordQuery, parsedIntent]);

  // Live Hiring Opportunities in this field
  const fieldOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const text = `${opp.title} ${opp.institution} ${opp.country} ${opp.funding} ${opp.fieldTags.join(' ')} ${opp.content}`;
      if (keywordQuery.trim()) {
        const { matches } = matchItemSemantically(text, opp.country, parsedIntent);
        return matches;
      }
      return matchesSelectedSubjects(text, opp.fieldTags, selectedField);
    });
  }, [opportunities, selectedCountry, selectedField, keywordQuery, parsedIntent]);

  const { headerTitle, headerSubtitle, countBadgeText, searchPlaceholder } = useMemo(() => {
    switch (activeSection) {
      case 'scholarships':
        return {
          headerTitle: 'Personalized Scholarship Radar & Global Grants',
          headerSubtitle: 'Discover full-ride, tuition waiver, and research scholarships matched to your academic profile',
          countBadgeText: `${filteredScholarships.length} Available Scholarships`,
          searchPlaceholder: 'Search scholarships by title, provider, country...',
        };
      case 'professors':
        return {
          headerTitle: 'Graduate Faculty & Research Lab Supervisors',
          headerSubtitle: 'Connect with professors and lab directors actively seeking Masters & PhD researchers',
          countBadgeText: `${filteredProfessors.length} Hiring Professors`,
          searchPlaceholder: 'Search professors by name, lab, university, HCI, AI...',
        };
      case 'research_papers':
        return {
          headerTitle: 'Academic Research Papers & AI Explorer',
          headerSubtitle: 'Search peer-reviewed publications, extract methodology insights, and chat with AI research assistant',
          countBadgeText: 'Curated Papers & AI Bot',
          searchPlaceholder: 'Search research papers by topic, DOI, author...',
        };
      case 'safe_unis':
      default:
        return {
          headerTitle: 'Find Your Desired Scholarship, Lab & Safe Universities',
          headerSubtitle: 'One simple search connects you to Scholarships, qualified professors, and secure regional universities',
          countBadgeText: `${safeUniversities.length} Live Openings`,
          searchPlaceholder: 'Search scholarships',
        };
    }
  }, [activeSection, filteredScholarships.length, filteredProfessors.length, safeUniversities.length]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* FIGMA NODE 60-798: Unified Discovery Hero Card with Integrated Category Tabs */}
      {activeSection !== 'research_papers' && (
        <div className="bg-white rounded-3xl border border-[#EAECF0] shadow-sm relative z-10 mb-6">
        
        {/* Top White Section */}
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-3xl">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#101828] tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] font-normal">
              {headerSubtitle}
            </p>
          </div>

          <div className="flex flex-col items-end justify-center gap-2.5 shrink-0">
            {/* Grid / List View Toggle matching Figma Node 89:4385 & Node 19:2130 */}
            <div className="flex items-center p-1 bg-white border border-[#D0D5DD] rounded-full shadow-2xs">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewLayout === 'grid' 
                    ? 'bg-[#F4F3FE] text-[#7150E7]' 
                    : 'text-[#98A2B3] hover:text-[#475467]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewLayout === 'list' 
                    ? 'bg-[#F4F3FE] text-[#7150E7]' 
                    : 'text-[#98A2B3] hover:text-[#475467]'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Live Openings Indicator matching Figma Node 89:4385 */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48]">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              <span>{countBadgeText}</span>
            </div>
          </div>
        </div>

        {/* Bottom Filter Section */}
        <div className="bg-[#F8FAFC] px-5 sm:px-7 pt-5 pb-5 sm:pb-6 border-t border-[#EAECF0] rounded-b-3xl">
          
          {/* Row matching Figma: 4 Dropdowns distributed cleanly across the row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            
            {/* 1. Subject */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#475467] pl-1 block">
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#475467] pl-1 block">
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#475467] pl-1 block">
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#475467] pl-1 block">
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

        </div>
      </div>
      )}

      {/* 3. UNIFIED SECTION 1: OPPORTUNITY LIST (SAFE REGIONAL UNIVERSITIES) */}
      {(activeSection === 'all' || activeSection === 'safe_unis') && safeUniversities.length > 0 && (
        <section className="space-y-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-[#101828]">
                  Opportunity List
                </h2>
                <span className="text-xs italic text-[#98A2B3] font-normal">
                  / {safeUniversities.length} Items
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Safe-Bet Universities with Guaranteed Funding &amp; Assistantships
              </p>
            </div>
            <span className="text-xs text-[#006045] bg-[#ECFDF5] px-3.5 py-1 rounded-full font-bold border border-[#A7F3D0] self-start sm:self-auto">
              ✓ 85% – 95% Acceptance Rate
            </span>
          </div>

          {viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {safeUniversities.map((uni) => (
                <div 
                  key={uni.id}
                  className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md transition-all group"
                >
                  {/* Header (Frame 2147226739) */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#101828] leading-snug group-hover:text-[#7050E6] transition-colors truncate">
                          {uni.name}
                        </h3>
                        <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
                          {uni.field}
                        </p>
                      </div>
                      {/* Standalone 28x18 Flag Graphic matching Figma Frame 2147226739 */}
                      {renderCountryFlag(uni.country, uni.id)}
                    </div>

                    {/* Divider Line 1 (Vector 1) */}
                    <div className="h-[1px] bg-[#F1F5F9] w-full" />

                    {/* Middle Details Container (Frame 2147226738) */}
                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-xs space-y-1.5">
                      <p className="text-xs leading-snug">
                        <span className="font-bold text-[#101828]">💰 Financial: </span>
                        <span className="text-[#101828]">{uni.financialBase}</span>
                        <span className="font-bold italic text-[#101828]">{uni.financialHighlight}</span>
                        <span className="text-[#101828]">{uni.financialSuffix}</span>
                      </p>
                      <p className="text-xs leading-snug">
                        <span className="font-bold text-[#101828]">🎓 Admission: </span>
                        <span className="text-text-secondary">{uni.admission}</span>
                      </p>
                      <p className="text-xs leading-snug">
                        <span className="font-bold text-[#101828]">🏡 Living: </span>
                        <span className="text-text-secondary">{uni.living}</span>
                      </p>
                    </div>

                    {/* Rank Chip (Frame 2147226703) */}
                    <div className="pt-0.5">
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block">
                        {uni.rankBadge}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions Row (Frame 2147226704) */}
                  <div className="space-y-3 pt-1">
                    {/* Divider Line 2 (Vector 3) */}
                    <div className="h-[1px] bg-[#F1F5F9] w-full" />

                    <div className="flex items-center gap-4">
                      {/* Left: Bookmark Button matching Figma Frame 2147226704 Button (no border, rounded-full) */}
                      <button
                        type="button"
                        onClick={() => toggleBookmark(uni.id)}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-slate-50 text-[#98A2B3] hover:text-[#7050E6] transition-colors cursor-pointer shrink-0 shadow-2xs"
                        title={bookmarkedIds.includes(uni.id) ? "Remove Bookmark" : "Bookmark University"}
                      >
                        <Bookmark className={`w-4.5 h-4.5 ${bookmarkedIds.includes(uni.id) ? 'text-[#7050E6] fill-[#7050E6]' : 'text-[#98A2B3]'}`} />
                      </button>

                      {/* Subtle Vertical Divider (Vector 3: height 15.5px, #D9D9D9) */}
                      <div className="h-4 w-[1px] bg-[#D9D9D9] shrink-0" />

                      {/* Right: Official Link & See Details Button Group (Frame 2147226705: gap-4, flex-1 equal width) */}
                      <div className="flex items-center gap-4 flex-1">
                        <a
                          href={uni.officialLink}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 px-4 rounded-full bg-[#F8FAFC] hover:bg-slate-100 text-[#7050E6] border border-[#7050E6] text-xs font-bold flex-1 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Official Link</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#7050E6]" />
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const matchingSch = scholarships.find(s => s.provider.toLowerCase().includes(uni.name.toLowerCase()) || uni.name.toLowerCase().includes(s.provider.toLowerCase()));
                            if (matchingSch) {
                              onOpenScholarshipDetail(matchingSch);
                            } else {
                              onOpenScholarshipDetail({
                                id: uni.id,
                                title: `${uni.name} - ${uni.field} Graduate Assistantship`,
                                provider: uni.name,
                                countries: [uni.country],
                                degreeLevels: uni.degrees as any,
                                fundingType: 'TUITION_WAIVER',
                                fundingAmount: `${uni.financialBase}${uni.financialHighlight}${uni.financialSuffix}`,
                                deadline: '2026-12-15T00:00:00.000Z',
                                description: `Guaranteed graduate funding opportunity at ${uni.name}. Admission requirements: ${uni.admission}. Living & housing: ${uni.living}.`,
                                requirements: {
                                  notes: uni.admission
                                },
                                officialUrl: uni.officialLink,
                                specializations: uni.fieldTags,
                                tags: ['Guaranteed Funding', 'Safe University', 'Assistantship', ...uni.fieldTags],
                                featured: true
                              });
                            }
                          }}
                          className="h-10 px-4 rounded-full bg-[#7050E6] hover:bg-[#5E3CD4] text-white text-xs font-bold flex-1 inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <span>See Details</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden divide-y divide-[#F2F4F7] shadow-xs">
              {safeUniversities.map((uni) => (
                <div
                  key={uni.id}
                  className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 mt-0.5 md:mt-0">
                      {renderCountryFlag(uni.country, uni.id)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#101828] group-hover:text-[#7050E6] transition-colors truncate">
                          {uni.name}
                        </span>
                        <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          {uni.rankBadge}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#667085]">
                        <span className="font-semibold text-slate-800">{uni.field}</span>
                        <span>•</span>
                        <span className="text-[#101828] font-bold">💰 {uni.financialHighlight}</span>
                        <span>•</span>
                        <span className="text-text-secondary">🎓 {uni.admission}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(uni.id)}
                      className="p-2 rounded-xl border border-[#D0D5DD] bg-white hover:bg-slate-50 text-[#98A2B3] hover:text-[#7050E6] transition-colors cursor-pointer"
                      title={bookmarkedIds.includes(uni.id) ? "Remove Bookmark" : "Bookmark"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.includes(uni.id) ? 'text-[#7050E6] fill-[#7050E6]' : 'text-[#98A2B3]'}`} />
                    </button>
                    <a
                      href={uni.officialLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-full border border-[#7050E6] bg-[#F8FAFC] hover:bg-slate-100 text-[#7050E6] text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Portal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const matchingSch = scholarships.find(s => s.provider.toLowerCase().includes(uni.name.toLowerCase()) || uni.name.toLowerCase().includes(s.provider.toLowerCase()));
                        if (matchingSch) {
                          onOpenScholarshipDetail(matchingSch);
                        } else {
                          onOpenScholarshipDetail({
                            id: uni.id,
                            title: `${uni.name} - ${uni.field} Graduate Assistantship`,
                            provider: uni.name,
                            countries: [uni.country],
                            degreeLevels: uni.degrees as any,
                            fundingType: 'TUITION_WAIVER',
                            fundingAmount: `${uni.financialBase}${uni.financialHighlight}${uni.financialSuffix}`,
                            deadline: '2026-12-15T00:00:00.000Z',
                            description: `Guaranteed graduate funding opportunity at ${uni.name}. Admission requirements: ${uni.admission}. Living & housing: ${uni.living}.`,
                            requirements: { notes: uni.admission },
                            officialUrl: uni.officialLink,
                            specializations: uni.fieldTags,
                            tags: ['Guaranteed Funding', 'Safe University', 'Assistantship', ...uni.fieldTags],
                            featured: true
                          });
                        }
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#7050E6] hover:bg-[#5E3CD4] text-white text-xs font-bold inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3.5. UNIFIED SECTION 1.5: LAB HIRING NOTICES & LIVE PHD/RA OPENINGS */}
      {(activeSection === 'all' || activeSection === 'safe_unis') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7150E7]">
                <Zap className="w-4 h-4 text-[#7150E7]" />
                <span>Live Lab Hiring &amp; Graduate Research Assistantships</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#101828] mt-0.5">
                Active Lab Openings with Stipend &amp; Tuition Remission ({fieldOpportunities.length})
              </h2>
            </div>

            {/* Live Web Sync Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await syncLiveOpportunities();
                  setLiveSyncMessage(`Fetched ${res.newFound} new live postings from global academic web!`);
                  setTimeout(() => setLiveSyncMessage(null), 4000);
                }}
                disabled={isSyncingOpportunities}
                className="h-9 px-4 rounded-full bg-[#7150E7] hover:bg-[#5E3CD4] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer select-none"
              >
                <Zap className={`w-3.5 h-3.5 ${isSyncingOpportunities ? 'animate-spin' : ''}`} />
                <span>{isSyncingOpportunities ? 'Crawling Academic Web...' : 'Fetch Live Web Postings (PhD/RA)'}</span>
              </button>
            </div>
          </div>

          {liveSyncMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>✓ {liveSyncMessage}</span>
              <button onClick={() => setLiveSyncMessage(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {fieldOpportunities.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No direct lab openings matched this query. Try selecting "All Fields" or clicking "Fetch Live Web Postings".
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fieldOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden divide-y divide-[#F2F4F7] shadow-xs">
              {fieldOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-[#F4F3FE] text-[#7150E7] flex items-center justify-center font-bold text-xs shrink-0">
                      🧪
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#101828] truncate group-hover:text-[#7150E7] transition-colors">
                          {opp.title}
                        </span>
                        {opp.matchType === 'exact' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Exact Match
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#667085]">
                        <span className="font-semibold text-slate-800">{opp.authorName}</span>
                        <span>•</span>
                        <span>{opp.institution}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{opp.funding}</span>
                        <span>•</span>
                        <span className="text-[#98A2B3]">{opp.postedAgo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const fakeProf: Professor = {
                          id: `opp-prof-${opp.id}`,
                          name: opp.authorName,
                          title: 'Principal Investigator',
                          university: opp.institution,
                          department: opp.fieldTags?.[0] || 'Research Laboratory',
                          country: opp.country || 'United States',
                          researchTags: opp.fieldTags || [],
                          openPositions: true,
                          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                          acceptingTerms: ['Fall 2026', 'Spring 2027'],
                          email: opp.contactEmail
                        };
                        onOpenColdEmail?.(fakeProf);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#7150E7] hover:bg-[#5E3CD4] text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Cold Email</span>
                    </button>
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-[#98A2B3] hover:text-[#101828] hover:bg-slate-100 transition-colors"
                      title="Open source posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  scholarship={sch}
                  onSelect={(s) => onOpenScholarshipDetail(s)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden divide-y divide-[#F2F4F7] shadow-xs">
              {filteredScholarships.map((sch) => (
                <div
                  key={sch.id}
                  className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group cursor-pointer"
                  onClick={() => onOpenScholarshipDetail(sch)}
                >
                  <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#101828] truncate group-hover:text-[#7150E7] transition-colors">
                          {sch.title}
                        </span>
                        <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          {sch.fundingType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#667085]">
                        <span className="font-semibold text-slate-800">{sch.provider}</span>
                        <span>•</span>
                        <span>{sch.countries.join(', ')}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{sch.fundingAmount}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-medium">🎓 {sch.degreeLevels.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      📅 {new Date(sch.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenScholarshipDetail(sch)}
                      className="px-4 py-1.5 rounded-full bg-[#7150E7] hover:bg-[#5E3CD4] text-white text-xs font-bold inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
                {isLiveSearchingProfessors && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#7150E7] font-semibold lowercase bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> querying OpenAlex (30M+ Researchers)...
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Professors &amp; Labs with Open Positions in {selectedField.includes('ALL') || selectedField.length === 0 ? 'All Fields' : selectedField.join(', ')} ({filteredProfessors.length})
              </h2>
            </div>

            {/* Quick Live Refresh Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const q = keywordQuery.trim();
                  const f = selectedField.includes('ALL') ? '' : selectedField.join(' ');
                  setIsLiveSearchingProfessors(true);
                  try {
                    const res = await fetch(`/api/professors/search?query=${encodeURIComponent(q || 'Computer Science AI')}&field=${encodeURIComponent(f)}`);
                    if (res.ok) {
                      const data = await res.json();
                      if (data.success && Array.isArray(data.professors)) {
                        setLiveProfessors(data.professors);
                      }
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsLiveSearchingProfessors(false);
                  }
                }}
                disabled={isLiveSearchingProfessors}
                className="h-8 px-3 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer select-none"
              >
                <Globe2 className={`w-3.5 h-3.5 ${isLiveSearchingProfessors ? 'animate-spin' : ''}`} />
                <span>{isLiveSearchingProfessors ? 'Searching OpenAlex...' : 'Search Global OpenAlex Web'}</span>
              </button>
            </div>
          </div>

          {filteredProfessors.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No professors matched this query. Try switching field or country.
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfessors.map((prof) => (
                <ProfessorCard
                  key={prof.id}
                  professor={prof}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden divide-y divide-[#F2F4F7] shadow-xs">
              {filteredProfessors.map((prof) => (
                <div
                  key={prof.id}
                  className="px-5 py-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                    <img
                      src={prof.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`}
                      alt={prof.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#EAECF0] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#101828] truncate group-hover:text-[#7150E7] transition-colors">
                          {prof.name}
                        </span>
                        <span className="text-xs text-[#667085] font-medium truncate">
                          ({prof.title})
                        </span>
                        {prof.openPositions && (
                          <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                            ✓ Hiring Students
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#667085]">
                        <span className="font-semibold text-slate-800">{prof.university}</span>
                        <span>•</span>
                        <span>{prof.department}</span>
                        <span>•</span>
                        <span className="text-purple-700 font-medium">🔬 {prof.researchTags.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onOpenColdEmail?.(prof)}
                      className="px-4 py-1.5 rounded-full bg-[#7150E7] hover:bg-[#5E3CD4] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Draft Cold Email</span>
                    </button>
                    {prof.labWebsite && (
                      <a
                        href={prof.labWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-[#98A2B3] hover:text-[#101828] hover:bg-slate-100 transition-colors"
                        title="Faculty Website"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. UNIFIED SECTION 4: RESEARCH PAPERS & AI BOT EXPLORER */}
      {(activeSection === 'all' || activeSection === 'research_papers') && (
        <ResearchPapersView />
      )}

    </div>
  );
};
