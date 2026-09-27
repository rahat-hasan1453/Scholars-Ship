'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DegreeLevel } from '@/types';
import { 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  User,
  Mail,
  HelpCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const DEGREE_OPTIONS: { id: DegreeLevel; title: string; subtitle: string; icon: string }[] = [
  {
    id: 'Bachelors',
    title: 'Bachelor’s Degree',
    subtitle: 'Undergraduate study, fully funded merit & entrance awards',
    icon: '🎓',
  },
  {
    id: 'Masters',
    title: 'Master’s Degree',
    subtitle: 'Coursework & research MS, departmental assistantships & fellowships',
    icon: '🏛️',
  },
  {
    id: 'PhD',
    title: 'Doctoral / PhD',
    subtitle: 'Research labs, advisor funding, fully funded RA/TA positions',
    icon: '🔬',
  },
];

const AVAILABLE_SPECIALIZATIONS = [
  'Computer Science',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Biotechnology & Genomics',
  'Biomedical Engineering',
  'Electrical & Computer Engineering',
  'Mechanical & Aerospace Engineering',
  'Renewable Energy & Sustainability',
  'Physics & Quantum Computing',
  'Economics & Quantitative Finance',
  'Public Health & Epidemiology',
  'Public Policy & Governance',
  'Robotics & Autonomous Systems',
  'Materials Science & Nanotechnology',
  'Human-Computer Interaction (HCI) & UX',
  'Software Engineering & Distributed Systems',
  'Neuroscience & Neurotechnology',
  'Chemistry & Molecular Sciences',
  'Civil & Environmental Engineering'
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

export const OnboardingModal: React.FC = () => {
  const { profile, updateProfile, isOnboardingOpen, setIsOnboardingOpen } = useApp();

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>(profile.degreeLevel);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(profile.specializations);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(profile.targetCountries);
  const [cgpa, setCgpa] = useState<number>(profile.cgpa || 3.8);
  const [ielts, setIelts] = useState<number>(profile.testScores?.ielts || 7.5);
  const [gre, setGre] = useState<number>(profile.testScores?.gre || 320);

  if (!isOnboardingOpen) return null;

  const toggleSpecialization = (tag: string) => {
    if (selectedSpecializations.includes(tag)) {
      setSelectedSpecializations(selectedSpecializations.filter((t) => t !== tag));
    } else {
      setSelectedSpecializations([...selectedSpecializations, tag]);
    }
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleSaveAndComplete = () => {
    updateProfile({
      name: name.trim() || 'Alex Mercer',
      email: email.trim() || 'alex.mercer@scholar.io',
      degreeLevel,
      specializations: selectedSpecializations.length > 0 ? selectedSpecializations : ['UX Design', 'Computer Science'],
      targetCountries: selectedCountries.length > 0 ? selectedCountries : ['USA', 'United Kingdom', 'Germany'],
      cgpa: Number(cgpa),
      testScores: {
        ielts: Number(ielts),
        gre: Number(gre),
      },
      onboardingCompleted: true,
    });
    setIsOnboardingOpen(false);
  };

  const totalSteps = 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Scholar Profile Creation & Matching</h2>
              <p className="text-xs text-slate-500">Step {step} of {totalSteps} • Personalizing your higher education discovery</p>
            </div>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-[#1E3A8A] h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: Applicant Identity & Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Let’s begin with your scholar profile</h3>
                <p className="text-sm text-slate-600">
                  Enter your name and contact details to register your application dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <Input
                    placeholder="e.g. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. alex.mercer@scholar.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Used for deadline alerts and application tracking summaries.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Degree Level */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left mb-4">
                <h3 className="text-lg font-bold text-slate-900">Which academic degree are you targeting?</h3>
                <p className="text-sm text-slate-600">
                  Selecting Master’s or PhD activates the Professor & Research Lab matching engine.
                </p>
              </div>

              <div className="grid gap-3">
                {DEGREE_OPTIONS.map((opt) => {
                  const isSelected = degreeLevel === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setDegreeLevel(opt.id)}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1E3A8A] bg-indigo-50/70 shadow-sm ring-1 ring-[#1E3A8A]'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className="text-2xl p-1 bg-white rounded-lg border border-slate-100 shadow-2xs">
                        {opt.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{opt.title}</span>
                          {isSelected && <Check className="w-5 h-5 text-[#1E3A8A]" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {degreeLevel !== 'Bachelors' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <span className="font-semibold">Graduate Mode Active:</span>
                  <span>Research labs and grant-holding professors will be prioritized in your feed.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Subject & Specializations */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-slate-900">What are your primary fields of research & study?</h3>
                <p className="text-sm text-slate-600">
                  Select your major and sub-specializations (including UX Design, HCI, AI, etc.) to calculate match scores.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {AVAILABLE_SPECIALIZATIONS.map((tag) => {
                  const isSelected = selectedSpecializations.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleSpecialization(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1E3A8A] text-white shadow-2xs font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      {tag}
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <span>+</span>}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Selected {selectedSpecializations.length} specializations. We will compute match scores based on these tags.
              </div>
            </div>
          )}

          {/* STEP 4: Target Countries */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-slate-900">Where in the world do you want to study?</h3>
                <p className="text-sm text-slate-600">
                  Choose countries matching your visa, stipend, and lifestyle preferences.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {POPULAR_COUNTRIES.map((c) => {
                  const isSelected = selectedCountries.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleCountry(c.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        isSelected
                          ? 'border-[#1E3A8A] bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-[#1E3A8A]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Academic Background Scores */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-slate-900">Academic Background & Test Scores</h3>
                <p className="text-sm text-slate-600">
                  These scores verify eligibility cut-offs (e.g. minimum CGPA, IELTS, GRE).
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* CGPA */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Normalized CGPA (4.0 scale)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="2.0"
                    max="4.0"
                    value={cgpa}
                    onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                    className="font-semibold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500">e.g., 3.85 / 4.00</span>
                </div>

                {/* IELTS */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    English Band (IELTS / TOEFL)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="5.0"
                    max="9.0"
                    value={ielts}
                    onChange={(e) => setIelts(parseFloat(e.target.value) || 0)}
                    className="font-semibold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500">e.g., 7.5 or 8.0</span>
                </div>

                {/* GRE */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    GRE / GMAT Total
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="260"
                    max="340"
                    value={gre}
                    onChange={(e) => setGre(parseInt(e.target.value) || 0)}
                    className="font-semibold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500">e.g., 324 (Quant 168)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  HighScholar automatically matches your scores against historical admission cut-offs and flags scholarships where you exceed requirements!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200/60"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSaveAndComplete}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-950 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Complete Profile & Reveal Matches</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
