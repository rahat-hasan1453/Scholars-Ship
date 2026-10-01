'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DegreeLevel } from '@/types';
import { 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Plus,
  HelpCircle
} from 'lucide-react';

const DEGREE_OPTIONS: { id: DegreeLevel; title: string; subtitle: string }[] = [
  {
    id: 'Bachelors',
    title: 'Bachelor’s Degree',
    subtitle: 'Undergraduate study, fully funded merit & entrance awards',
  },
  {
    id: 'Masters',
    title: 'Master’s Degree',
    subtitle: 'Coursework & research MS, departmental assistantships & fellowships',
  },
  {
    id: 'PhD',
    title: 'Doctoral / PhD',
    subtitle: 'Research labs, advisor funding, fully funded RA/TA positions',
  },
];

const AVAILABLE_SPECIALIZATIONS = [
  'Computer Science',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Biomedical Engineering',
  'Biotechnology & Genomics',
  'Electrical & Computer Engineering',
  'Mechanical & Aerospace Engineering',
  'Economics & Quantitative Finance',
  'Public Health & Epidemiology',
  'Public Policy & Governance',
  'Robotics & Autonomous Systems',
  'Materials Science & Nanotechnology',
  'Human-Computer Interaction (HCI) & UX',
  'Software Engineering & Distributed Systems',
  'Neuroscience & Neurotechnology',
  'UX Design',
  'Human-Computer Interaction (HCI)',
  'Artificial Intelligence',
];

const POPULAR_COUNTRIES = [
  { name: 'USA', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'New Zealand', flag: '🇳🇿' },
];

interface OnboardingFlowProps {
  isStandalonePage?: boolean;
  onFinish?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  isStandalonePage = false,
  onFinish,
}) => {
  const router = useRouter();
  const { profile, updateProfile, setIsOnboardingOpen } = useApp();

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(profile?.name || '');
  const [email, setEmail] = useState<string>(profile?.email || '');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>(profile?.degreeLevel || 'Masters');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(
    profile?.specializations?.length 
      ? profile.specializations 
      : ['Computer Science', 'Data Science & Analytics', 'UX Design', 'Human-Computer Interaction (HCI)', 'Artificial Intelligence']
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    profile?.targetCountries?.length 
      ? profile.targetCountries 
      : ['USA', 'United Kingdom', 'Germany', 'Canada', 'Sweden', 'France', 'Switzerland', 'Australia']
  );
  const [cgpa, setCgpa] = useState<number | string>(profile?.cgpa || 3.79);
  const [ielts, setIelts] = useState<number | string>(profile?.testScores?.ielts ?? 7.5);
  const [gre, setGre] = useState<number | string>(profile?.testScores?.gre ?? 324);

  const [customSpecialization, setCustomSpecialization] = useState('');
  const [showCustomSpecInput, setShowCustomSpecInput] = useState(false);
  const [customCountry, setCustomCountry] = useState('');
  const [showCustomCountryInput, setShowCustomCountryInput] = useState(false);

  useEffect(() => {
    if (profile?.name && !name) setName(profile.name);
    if (profile?.email && !email) setEmail(profile.email);
    if (profile?.degreeLevel) setDegreeLevel(profile.degreeLevel);
  }, [profile]);

  const toggleSpecialization = (tag: string) => {
    if (selectedSpecializations.includes(tag)) {
      setSelectedSpecializations(selectedSpecializations.filter((t) => t !== tag));
    } else {
      setSelectedSpecializations([...selectedSpecializations, tag]);
    }
  };

  const handleAddCustomSpecialization = () => {
    if (customSpecialization.trim() && !selectedSpecializations.includes(customSpecialization.trim())) {
      setSelectedSpecializations([...selectedSpecializations, customSpecialization.trim()]);
      setCustomSpecialization('');
      setShowCustomSpecInput(false);
    }
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleAddCustomCountry = () => {
    if (customCountry.trim() && !selectedCountries.includes(customCountry.trim())) {
      setSelectedCountries([...selectedCountries, customCountry.trim()]);
      setCustomCountry('');
      setShowCustomCountryInput(false);
    }
  };

  const handleSaveAndComplete = async () => {
    const finalName = name.trim() || profile?.name || 'Scholar User';
    const finalEmail = email.trim() || profile?.email || 'scholar@highscholar.io';

    const profilePayload = {
      name: finalName,
      email: finalEmail,
      degreeLevel,
      specializations: selectedSpecializations.length > 0 ? selectedSpecializations : ['Computer Science'],
      targetCountries: selectedCountries.length > 0 ? selectedCountries : ['USA', 'United Kingdom', 'Germany'],
      cgpa: Number(cgpa) || 3.79,
      testScores: {
        ielts: Number(ielts) || 0,
        gre: Number(gre) || 0,
      },
      onboardingCompleted: true,
    };

    updateProfile(profilePayload);

    if (typeof window !== 'undefined' && finalEmail) {
      localStorage.setItem(`highscholar_onboarded_${finalEmail}`, 'true');
    }

    try {
      await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });
    } catch (err) {
      console.error('Failed to notify backend of completed onboarding:', err);
    }

    if (onFinish) {
      onFinish();
    } else {
      setIsOnboardingOpen(false);
      router.push('/?welcome=true');
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-white text-[#101828] flex flex-col justify-center overflow-x-hidden select-none font-sans">
      
      {/* Phase 1: Left Chevron Watermark Layer (3x stacked chevrons at y: -123px, 285px, 693px) */}
      <div 
        className="pointer-events-none absolute left-0 top-0 w-[732px] h-full overflow-hidden select-none z-0"
        aria-hidden="true"
      >
        <div className="relative w-[732px] h-full">
          <img 
            src="/onboarding-chevron.svg" 
            alt="" 
            className="absolute left-0 top-[-123px] w-[732px] h-[408px] max-w-none block" 
          />
          <img 
            src="/onboarding-chevron.svg" 
            alt="" 
            className="absolute left-0 top-[285px] w-[732px] h-[408px] max-w-none block" 
          />
          <img 
            src="/onboarding-chevron.svg" 
            alt="" 
            className="absolute left-0 top-[693px] w-[732px] h-[408px] max-w-none block" 
          />
        </div>
      </div>

      {/* Optional Close Button (for modal takeover) */}
      {!isStandalonePage && (
        <button
          onClick={() => setIsOnboardingOpen(false)}
          className="absolute top-6 right-6 z-30 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Exit onboarding"
          aria-label="Exit onboarding"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Phase 2: Core Container & Positioning Engine (Anchored at X = 800px on desktop) */}
      <div className="relative z-10 w-full max-w-[1728px] mx-auto min-h-screen flex items-center px-6 sm:px-10 lg:px-0 py-8 lg:py-12">
        
        {/* Content Container (Width = 580px, Left Anchor X = 800px on 1728px canvas, Fixed Height = 577px on desktop) */}
        <div className="w-full max-w-[580px] mx-auto lg:mx-0 lg:ml-[calc((100%-580px)*0.75)] 2xl:ml-[800px] flex flex-col justify-between min-h-[520px] lg:h-[577px]">
          
          {/* Top Section: Logo Header + Step Body */}
          <div className="w-full flex flex-col">
            {/* Phase 1: Official Brand Logo Header (263px × 51px, 48px vertical gap to title) */}
            <div className="w-[263px] h-[51px] shrink-0 mb-[48px]">
              <img 
                src="/onboarding-logo.svg" 
                alt="HighScholar" 
                className="w-[263px] h-[51px] block select-none pointer-events-none"
              />
            </div>

            {/* Dynamic Step Content: Always starts at exact same Y coordinate */}
            <div className="w-full">
            
            {/* STEP 1: Personal Identity & Contact (580 × 431 Hug) */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-2xl sm:text-[24px] font-semibold text-black tracking-tight leading-snug">
                    Let’s begin with your scholar profile
                  </h1>
                  <p className="text-sm text-[#919EAB] mt-2 leading-relaxed">
                    Enter your name and contact details to register your application dashboard.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Floating notched label input: Full Name */}
                  <div className="relative">
                    <div className="absolute -top-2 left-3 bg-white px-1.5 z-10">
                      <span className="text-[11px] italic text-[#62748E] font-normal">
                        Full Name
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-[#E1E8F0] rounded-lg text-sm text-[#0F172B] placeholder:text-[#90A1B9] focus:outline-none focus:border-[#704FE5] focus:ring-1 focus:ring-[#704FE5] transition-all"
                    />
                  </div>

                  {/* Floating notched label input: Email */}
                  <div className="relative">
                    <div className="absolute -top-2 left-3 bg-white px-1.5 z-10">
                      <span className="text-[11px] italic text-[#62748E] font-normal">
                        Email
                      </span>
                    </div>
                    {/* Read-only: this is the verified sign-in email */}
                    <input
                      type="email"
                      value={email}
                      readOnly
                      aria-readonly="true"
                      className="w-full h-12 px-3.5 bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg text-sm text-[#62748E] cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-[#62748E] pt-1">
                    Used for deadline alerts and application tracking summaries.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Target Academic Degree (580 × 497 Hug) */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-2xl sm:text-[24px] font-semibold text-black tracking-tight leading-snug">
                    Which academic degree are you targeting?
                  </h1>
                  <p className="text-sm text-[#919EAB] mt-2 leading-relaxed">
                    Selecting Master’s or PhD activates the Professor & Research Lab matching engine.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  {DEGREE_OPTIONS.map((opt) => {
                    const isSelected = degreeLevel === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setDegreeLevel(opt.id)}
                        className={`w-full min-h-[76px] p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[#704FE5] ring-1 ring-[#704FE5] bg-white'
                            : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <h3 className={`text-base font-semibold transition-colors ${
                            isSelected ? 'text-[#704FE5]' : 'text-[#101828]'
                          }`}>
                            {opt.title}
                          </h3>
                          <p className="text-xs text-[#919EAB] mt-1 leading-snug">
                            {opt.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="shrink-0">
                            <Check className="w-5 h-5 text-[#704FE5] stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Fields of Research & Study (580 × 651 Hug) */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-2xl sm:text-[24px] font-semibold text-black tracking-tight leading-snug">
                    What are your primary fields of research & study?
                  </h1>
                  <p className="text-sm text-[#919EAB] mt-2 leading-relaxed">
                    Select your major and sub-specialisations to calculate match scores.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_SPECIALIZATIONS.map((tag) => {
                    const isSelected = selectedSpecializations.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSpecialization(tag)}
                        className={`h-[28px] px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#704FE5] text-white font-semibold shadow-2xs'
                            : 'bg-[#F3F3F3] text-[#314158] hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <span className="text-xs font-normal text-[#314158] leading-none">+</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom tag inputs */}
                  {selectedSpecializations
                    .filter((s) => !AVAILABLE_SPECIALIZATIONS.includes(s))
                    .map((customTag) => (
                      <button
                        key={customTag}
                        type="button"
                        onClick={() => toggleSpecialization(customTag)}
                        className="h-[28px] px-3.5 rounded-full text-xs font-semibold bg-[#704FE5] text-white flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
                      >
                        <span>{customTag}</span>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    ))}

                  {/* Add Other Field Button */}
                  {showCustomSpecInput ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Add field..."
                        value={customSpecialization}
                        onChange={(e) => setCustomSpecialization(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSpecialization()}
                        autoFocus
                        className="h-[28px] px-3 text-xs border border-[#704FE5] rounded-full focus:outline-none w-32 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSpecialization}
                        className="h-[28px] px-2.5 rounded-full bg-[#704FE5] text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomSpecInput(true)}
                      className="h-[28px] px-3.5 rounded-full text-xs font-medium bg-[#F3F3F3] text-[#314158] hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <span>Other</span>
                      <span className="text-xs font-normal text-[#314158] leading-none">+</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Target Study Destinations (580 × 550.92 Hug) */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-2xl sm:text-[24px] font-semibold text-black tracking-tight leading-snug">
                    Where in the world do you want to study?
                  </h1>
                  <p className="text-sm text-[#919EAB] mt-2 leading-relaxed">
                    Choose countries matching your visa, stipend, and lifestyle preferences.
                  </p>
                </div>

                {/* 4-column Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {POPULAR_COUNTRIES.map((c) => {
                    const isSelected = selectedCountries.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleCountry(c.name)}
                        className={`h-[46px] px-3 rounded-lg border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#704FE5] ring-1 ring-[#704FE5] bg-white'
                            : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{c.flag}</span>
                          <span className={`text-xs truncate ${
                            isSelected ? 'text-[#704FE5] font-semibold' : 'text-[#704FE5] font-normal'
                          }`}>
                            {c.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#704FE5] stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Countries */}
                  {selectedCountries
                    .filter((c) => !POPULAR_COUNTRIES.some((pc) => pc.name === c))
                    .map((cc) => (
                      <button
                        key={cc}
                        type="button"
                        onClick={() => toggleCountry(cc)}
                        className="h-[46px] px-3 rounded-lg border border-[#704FE5] ring-1 ring-[#704FE5] bg-white text-left flex items-center justify-between gap-1.5 cursor-pointer"
                      >
                        <span className="text-xs text-[#704FE5] font-semibold truncate">{cc}</span>
                        <Check className="w-4 h-4 text-[#704FE5] stroke-[2.5] shrink-0" />
                      </button>
                    ))}

                  {/* Add Other Country */}
                  {showCustomCountryInput ? (
                    <div className="h-[46px] px-2 rounded-lg border border-[#704FE5] bg-white flex items-center gap-1 col-span-2 sm:col-span-1">
                      <input
                        type="text"
                        placeholder="Country..."
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCountry()}
                        autoFocus
                        className="w-full text-xs text-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCountry}
                        className="text-[10px] bg-[#704FE5] text-white px-2 py-1 rounded-md font-bold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomCountryInput(true)}
                      className="h-[46px] px-3 rounded-lg border border-[#E2E8F0] hover:border-slate-300 bg-white text-left flex items-center justify-between gap-1.5 cursor-pointer"
                    >
                      <span className="text-xs text-[#101828] font-medium">Other</span>
                      <Plus className="w-4 h-4 text-[#314158]" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Academic Background & Test Scores (580 × 514.92 Hug) */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-2xl sm:text-[24px] font-semibold text-black tracking-tight leading-snug">
                    Academic Background & Test Scores
                  </h1>
                  <p className="text-sm text-[#919EAB] mt-2 leading-relaxed">
                    These scores verify eligibility cut-offs (e.g. minimum CGPA, IELTS, GRE).
                  </p>
                </div>

                {/* 3 Score Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  
                  {/* CGPA */}
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between h-[142px]">
                    <label className="text-xs font-bold text-[#314158] block leading-tight">
                      Normalized CGPA (4.0 scale)
                    </label>
                    <div className="my-auto">
                      <input
                        type="number"
                        step="0.01"
                        min="2.0"
                        max="4.0"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172B] focus:outline-none focus:border-[#704FE5] focus:ring-1 focus:ring-[#704FE5]"
                      />
                    </div>
                    <span className="text-[11px] text-[#62748E]">
                      e.g., 3.85 / 4.00
                    </span>
                  </div>

                  {/* IELTS */}
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between h-[142px]">
                    <label className="text-xs font-bold text-[#314158] block leading-tight">
                      English Band (IELTS / TOEFL)
                    </label>
                    <div className="my-auto">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9.0"
                        value={ielts}
                        onChange={(e) => setIelts(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172B] focus:outline-none focus:border-[#704FE5] focus:ring-1 focus:ring-[#704FE5]"
                      />
                    </div>
                    <span className="text-[11px] text-[#62748E]">
                      e.g., 7.5 or 8.0
                    </span>
                  </div>

                  {/* GRE / GMAT */}
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between h-[142px]">
                    <label className="text-xs font-bold text-[#314158] block leading-tight">
                      GRE /<br />GMAT Total
                    </label>
                    <div className="my-auto">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="340"
                        value={gre}
                        onChange={(e) => setGre(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-[#704FE5] ring-1 ring-[#704FE5] rounded-md text-xs font-semibold text-[#0F172B] focus:outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-[#62748E]">
                      e.g., 324 (Quant 168)
                    </span>
                  </div>
                </div>

                {/* Amber Warning / Notice Banner */}
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center gap-2.5">
                  <div className="shrink-0 text-[#B45309]">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#7B3306] leading-normal font-normal">
                    HighScholar automatically matches your scores against historical admission cut-offs and flags scholarships where you exceed requirements!
                  </p>
                </div>
              </div>
            )}

            </div>
          </div>

          {/* Phase 2: Unified Footer Row (Frame 2147226820: Height 40px, justify-between, items-center) */}
          <div className="w-full h-10 mt-auto pt-2 flex items-center justify-between">
            
            {/* Left: 5-step Stepper (80px × 6px) */}
            <div 
              className="w-[80px] h-[6px] flex items-center gap-1 select-none"
              title={`Step ${step} of 5`}
            >
              {[1, 2, 3, 4, 5].map((i) => {
                const isActive = step === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive ? 'w-8 bg-[#704FE5]' : 'w-2 bg-[#EDE9FC] hover:bg-[#D9CEFD]'
                    }`}
                    title={`Go to step ${i}`}
                    aria-label={`Step ${i}`}
                  />
                );
              })}
            </div>

            {/* Right: Step Action Buttons */}
            <div>
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-10 px-6 rounded-full bg-[#704FE5] hover:bg-[#5F3FDC] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {step > 1 && step < 5 && (
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="h-10 px-5 rounded-full border border-[#704FE5] text-[#704FE5] bg-[#F8FAFC] hover:bg-purple-50/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="h-10 px-6 rounded-full bg-[#704FE5] hover:bg-[#5F3FDC] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}

              {step === 5 && (
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="h-10 px-5 rounded-full border border-[#704FE5] text-[#704FE5] bg-[#F8FAFC] hover:bg-purple-50/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndComplete}
                    className="h-10 px-6 rounded-full bg-[#704FE5] hover:bg-[#5F3FDC] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>Complete Profile & Reveal Matches</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useApp();

  if (!isOnboardingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white animate-in fade-in duration-200">
      <OnboardingFlow 
        isStandalonePage={false} 
        onFinish={() => setIsOnboardingOpen(false)} 
      />
    </div>
  );
};
