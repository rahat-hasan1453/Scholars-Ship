'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, CircleHelp, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DegreeLevel } from '@/types';
import { WORLD_COUNTRIES } from '@/data/countries';
import { BrandLogo } from '@/components/auth/auth-layout';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { cn } from '@/lib/utils';

// Onboarding — Figma section 161:2348 (frames 159:559, 159:1101, 159:838, 161:1602, 161:2058).
// Radii are explicit because the app's legacy :root --radius-* tokens override Tailwind's rounded-* scale.

const TOTAL_STEPS = 5;

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
];

// Country values shown in the Figma grid (161:1944); the rest sit behind "Other".
const FIGMA_COUNTRY_VALUES = [
  'USA', 'United Kingdom', 'Germany', 'Canada',
  'Sweden', 'France', 'Switzerland', 'Japan',
  'South Korea', 'Singapore', 'Australia', 'Ireland',
  'Italy', 'Turkey', 'Netherlands', 'New Zealand',
];
const MAIN_COUNTRIES = FIGMA_COUNTRY_VALUES.map((v) => WORLD_COUNTRIES.find((c) => c.value === v)!).filter(Boolean);
const OTHER_COUNTRIES = WORLD_COUNTRIES.filter((c) => !FIGMA_COUNTRY_VALUES.includes(c.value));

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

/* Title/2 + Body/1 R — shared heading block */
function StepHeading({ title, subtitle, titleClass }: { title: string; subtitle: string; titleClass?: string }) {
  return (
    <div className="flex w-full flex-col gap-2 break-words">
      <h1 className={cn('text-2xl font-[510] leading-8 text-black', titleClass)}>{title}</h1>
      <p className="text-base leading-5 text-text-secondary">{subtitle}</p>
    </div>
  );
}

/* Floating-label field 159:760 */
function FloatingField({
  label,
  className,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full">
      <Input
        aria-label={label}
        className={cn(
          'mt-[7px] h-12 rounded-[8px] border-stroke-default bg-surface-white px-2 py-1 text-base leading-5 text-text-primary shadow-none placeholder:text-slate-400 focus-visible:ring-0 md:text-base',
          className,
        )}
        {...props}
      />
      <span className="pointer-events-none absolute left-[3.32%] top-0 bg-surface-white px-1 text-[11px] italic leading-[16.5px] tracking-[-0.1275px] text-slate-400">
        {label}
      </span>
    </div>
  );
}

/* Chip 161:2664 */
function SpecializationChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-[14px] py-1.5 text-xs leading-4 tracking-[-0.192px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        selected
          ? 'bg-brand-primary font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)]'
          : 'bg-chip-bg font-medium text-slate-700',
      )}
    >
      {label}
      {selected ? <Check className="size-[14px]" /> : <span>+</span>}
    </button>
  );
}

/* Country cell 161:1945 */
function CountryCell({
  flag,
  label,
  selected,
  onClick,
}: {
  flag: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex h-[46px] min-w-0 items-center gap-2 overflow-hidden rounded-[8px] border p-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        selected ? 'border-brand-primary' : 'border-slate-200',
      )}
    >
      <span className="text-base leading-6 tracking-[-0.5045px] text-brand-primary">{flag}</span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs leading-4 tracking-[-0.192px] text-brand-primary',
          selected ? 'font-[590]' : 'font-medium',
        )}
      >
        {label}
      </span>
      {selected && <Check className="size-[14px] shrink-0 text-brand-primary" />}
    </button>
  );
}

/* Score card 161:2297 */
function ScoreCard({
  label,
  hint,
  value,
  onChange,
  tall,
}: {
  label: React.ReactNode;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  tall?: boolean;
}) {
  return (
    <div className="flex h-[142px] min-w-0 flex-1 flex-col rounded-[20px] border border-slate-200 bg-slate-50/40 p-4">
      <label className="block text-xs font-bold leading-4 tracking-[-0.192px] text-slate-700">
        {label}
        <div className="py-2">
          <Input
            inputMode="decimal"
            value={value}
            placeholder="0"
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="h-9 rounded-[8px] border-transparent bg-surface-white px-3 py-1.5 text-xs font-semibold leading-4 tracking-[-0.192px] text-slate-900 shadow-[0_1px_0_rgba(0,0,0,0.05)] focus-visible:border-brand-primary focus-visible:ring-0 md:text-xs"
          />
        </div>
      </label>
      <p className={cn('pt-1 text-[11px] font-normal leading-[16.5px] tracking-[-0.1275px] text-slate-500', tall && 'h-10')}>
        {hint}
      </p>
    </div>
  );
}

/* Nav button 159:814 / 161:2780 */
function NavButtons({
  step,
  onPrev,
  onNext,
}: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const last = step === TOTAL_STEPS;
  return (
    <div className="flex items-center gap-6">
      {step > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="h-10 gap-2 rounded-[20px] border-brand-primary bg-slate-50 px-3 py-2 text-xs font-bold leading-4 tracking-[-0.192px] text-brand-primary shadow-none hover:bg-brand-light hover:text-brand-primary"
        >
          <ChevronLeft className="size-[18px]" />
          Previous
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        className={cn(
          'h-10 gap-2 rounded-[20px] bg-brand-primary px-[14px] py-2 text-xs font-bold leading-4 tracking-[-0.192px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-brand-primary/90',
          !last && 'w-[160.833px]',
        )}
      >
        {last ? 'Complete Profile & Reveal Matches' : 'Next Step'}
        <ChevronRight className="size-[18px]" />
      </Button>
    </div>
  );
}

/* Progress 161:1445 */
function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={cn('h-[6px] rounded-[16px]', i + 1 === step ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-light')}
        />
      ))}
    </div>
  );
}

interface OnboardingFlowProps {
  isStandalonePage?: boolean;
  onFinish?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onFinish }) => {
  const router = useRouter();
  const { profile, updateProfile, setIsOnboardingOpen } = useApp();

  // The context profile starts as mock demo data; only reuse the answers once a real onboarding saved them.
  const isDemo = !!profile?.email?.includes('alex.mercer');
  const saved = !isDemo && !!profile?.onboardingCompleted;

  const [step, setStep] = useState(1);
  // null = untouched, so the session profile (loaded after mount) fills the field until the user types.
  const [nameInput, setName] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const name = nameInput ?? (isDemo ? '' : profile?.name || '');
  const email = emailInput ?? (isDemo ? '' : profile?.email || '');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>(saved ? profile.degreeLevel : 'Masters');
  const [specializations, setSpecializations] = useState<string[]>(saved ? profile.specializations : []);
  const [countries, setCountries] = useState<string[]>(saved ? profile.targetCountries : []);
  const [cgpa, setCgpa] = useState(saved && profile.cgpa ? String(profile.cgpa) : '');
  const [ielts, setIelts] = useState(saved && profile.testScores?.ielts ? String(profile.testScores.ielts) : '');
  const [gre, setGre] = useState(saved && profile.testScores?.gre ? String(profile.testScores.gre) : '');

  const [showError, setShowError] = useState(false);
  const [showOtherSpec, setShowOtherSpec] = useState(false);
  const [customSpec, setCustomSpec] = useState('');
  const [showOtherCountries, setShowOtherCountries] = useState(false);

  const customSpecs = specializations.filter((s) => !AVAILABLE_SPECIALIZATIONS.includes(s));

  const addCustomSpec = () => {
    const value = customSpec.trim();
    if (value && !specializations.includes(value)) setSpecializations([...specializations, value]);
    setCustomSpec('');
  };

  const canNext =
    step === 1 ? name.trim().length > 0 && /\S+@\S+\.\S+/.test(email.trim())
    : step === 3 ? specializations.length > 0
    : step === 4 ? countries.length > 0
    : true;

  const handleSaveAndComplete = async () => {
    const finalName = name.trim() || profile?.name || 'Scholar User';
    const finalEmail = email.trim() || profile?.email || 'scholar@highscholar.io';

    const profilePayload = {
      name: finalName,
      email: finalEmail,
      degreeLevel,
      specializations,
      targetCountries: countries,
      cgpa: Number(cgpa) || 0,
      testScores: {
        ...profile?.testScores,
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

  const goTo = (n: number) => {
    setShowError(false);
    setStep(n);
  };

  const next = () => {
    if (!canNext) {
      setShowError(true);
      return;
    }
    if (step === TOTAL_STEPS) handleSaveAndComplete();
    else goTo(step + 1);
  };

  const errorMessage =
    step === 1 ? 'Enter your full name and a valid email to continue.'
    : step === 3 ? 'Select at least one field of study.'
    : step === 4 ? 'Select at least one country.'
    : '';

  return (
    <div className="relative min-h-screen w-full select-none overflow-hidden bg-surface-white text-text-primary">
      {/* Decorative sails — 178:1166 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        <img
          src="/onboarding/sail-back.svg"
          alt=""
          className="absolute max-w-none opacity-[0.03]"
          style={{ left: '8.81%', top: '-8.27%', width: '50.39%', height: '120.77%' }}
        />
        <img
          src="/onboarding/sail-front.svg"
          alt=""
          className="absolute max-w-none opacity-[0.03]"
          style={{ left: '-19.91%', top: '-2.55%', width: '30.78%', height: '116.19%' }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[580px] flex-col px-4 pb-10 pt-12 xl:absolute xl:left-[46.296%] xl:top-[200px] xl:mx-0 xl:block xl:max-w-none xl:p-0">
        <div className="flex w-full flex-col items-start gap-12 xl:w-[580px]">
          <BrandLogo />

          {step === 1 && (
            <div className="flex w-full flex-col gap-[14px]">
              <div className="flex w-full flex-col gap-5">
                <StepHeading
                  title="Let’s begin with your scholar profile"
                  subtitle="Enter your name and contact details to register your application dashboard."
                  titleClass="max-w-[211px]"
                />
                <div className="flex w-full flex-col gap-4">
                  <FloatingField label="Full Name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <FloatingField label="Email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <p className="w-full text-xs leading-4 text-text-secondary">
                Used for deadline alerts and application tracking summaries.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="flex w-full flex-col gap-[14px]">
              <StepHeading
                title="Which academic degree are you targeting?"
                subtitle="Selecting Master’s or PhD activates the Professor & Research Lab matching engine."
              />
              <div className="flex w-full flex-col gap-4" role="radiogroup" aria-label="Target degree">
                {DEGREE_OPTIONS.map((opt) => {
                  const selected = degreeLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setDegreeLevel(opt.id)}
                      className={cn(
                        'flex w-full items-center gap-4 overflow-hidden rounded-[20px] border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                        selected ? 'border-brand-primary' : 'border-slate-200',
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={cn('text-base font-[510] leading-6', selected ? 'text-brand-primary' : 'text-text-primary')}>
                          {opt.title}
                        </span>
                        <span className="pt-0.5 text-xs leading-4 tracking-[-0.192px] text-text-secondary">{opt.subtitle}</span>
                      </span>
                      {selected && <Check className="size-6 shrink-0 text-brand-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex w-full flex-col gap-[14px]">
              <StepHeading
                title="What are your primary fields of research & study?"
                subtitle="Select your major and sub-specialisations to calculate match scores."
                titleClass="max-w-[437px]"
              />
              <div className="flex w-full flex-wrap gap-2">
                {[...AVAILABLE_SPECIALIZATIONS, ...customSpecs].map((tag) => (
                  <SpecializationChip
                    key={tag}
                    label={tag}
                    selected={specializations.includes(tag)}
                    onClick={() => setSpecializations(toggle(specializations, tag))}
                  />
                ))}
                {showOtherSpec ? (
                  <Input
                    autoFocus
                    value={customSpec}
                    placeholder="Add your field"
                    onChange={(e) => setCustomSpec(e.target.value)}
                    onBlur={() => {
                      addCustomSpec();
                      setShowOtherSpec(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCustomSpec();
                        setShowOtherSpec(false);
                      }
                    }}
                    className="h-7 w-44 rounded-full border-stroke-default px-[14px] text-xs shadow-none focus-visible:ring-0 md:text-xs"
                  />
                ) : (
                  <SpecializationChip label="Other" selected={false} onClick={() => setShowOtherSpec(true)} />
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex w-full flex-col gap-[14px]">
              <StepHeading
                title="Where in the world do you want to study?"
                subtitle="Choose countries matching your visa, stipend, and lifestyle preferences."
                titleClass="max-w-[437px]"
              />
              <div className="grid w-full grid-cols-2 gap-[10px] sm:grid-cols-4">
                {[...MAIN_COUNTRIES, ...(showOtherCountries ? OTHER_COUNTRIES : [])].map((c) => (
                  <CountryCell
                    key={c.value}
                    flag={c.flag}
                    label={c.value === 'USA' ? 'USA' : c.label}
                    selected={countries.includes(c.value)}
                    onClick={() => setCountries(toggle(countries, c.value))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setShowOtherCountries((v) => !v)}
                  aria-expanded={showOtherCountries}
                  className="flex h-[46px] min-w-0 items-center gap-2 overflow-hidden rounded-[8px] border border-stroke-default p-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-[590] leading-4 tracking-[-0.192px] text-text-primary">Other</span>
                  <Plus className={cn('size-4 shrink-0 text-slate-700', showOtherCountries && 'rotate-45')} />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex w-full flex-col gap-6">
              <StepHeading
                title="Academic Background & Test Scores"
                subtitle="These scores verify eligibility cut-offs (e.g. minimum CGPA, IELTS, GRE)."
                titleClass="max-w-[437px]"
              />
              <div className="flex w-full flex-col gap-6">
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
                  <ScoreCard label="Normalized CGPA (4.0 scale)" hint="e.g., 7.5 or 8.0" value={cgpa} onChange={setCgpa} />
                  <ScoreCard label="English Band (IELTS / TOEFL)" hint="e.g., 7.5 or 8.0" value={ielts} onChange={setIelts} />
                  <ScoreCard
                    label={<>GRE /<br />GMAT Total</>}
                    hint="e.g., 324 (Quant 168)"
                    value={gre}
                    onChange={setGre}
                    tall
                  />
                </div>
                <div className="flex w-full items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 p-3">
                  <CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="min-w-0 flex-1 text-xs leading-4 tracking-[-0.192px] text-amber-900">
                    HighScholar automatically matches your scores against historical admission cut-offs and flags scholarships where you exceed requirements!
                  </p>
                </div>
              </div>
            </div>
          )}
          {showError && !canNext && (
            <p role="alert" className="-mt-8 text-xs leading-4 text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer — progress 162:2797 + buttons 159:814 */}
        <div className="mt-10 flex w-full items-center justify-between xl:absolute xl:left-0 xl:top-[537px] xl:mt-0 xl:w-[580px]">
          <ProgressDots step={step} />
          <NavButtons step={step} onPrev={() => goTo(step - 1)} onNext={next} />
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
      <OnboardingFlow isStandalonePage={false} onFinish={() => setIsOnboardingOpen(false)} />
    </div>
  );
};
