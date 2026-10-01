'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CircleHelp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DegreeLevel } from '@/types';
import { WORLD_COUNTRIES } from '@/data/countries';
import { BrandLogo } from '@/components/auth/auth-layout';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
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
const countryOption = (value: string) =>
  WORLD_COUNTRIES.find((c) => c.value === value) ?? { value, label: value, flag: '🌐' };

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

/* Title/2 + Body/1 R — shared heading block */
function StepHeading({ title, subtitle, titleClass }: { title: string; subtitle: string; titleClass?: string }) {
  return (
    <div className="flex w-full flex-col gap-2 break-words">
      <h1 className={cn('text-2xl font-normal leading-8 text-black', titleClass)}>{title}</h1>
      <p className="text-base leading-5 text-text-secondary">{subtitle}</p>
    </div>
  );
}

/* Input 203:557 — shadcn Input, 44px, radius-lg 10, Body/2 R */
const fieldClass =
  'h-11 rounded-[10px] bg-background px-2.5 py-1 text-sm leading-[18px] text-foreground shadow-none placeholder:text-muted-foreground md:text-sm';

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

/* Card/cell that hosts a Checkbox (itself a <button>), so it can't be a <button> too */
const pressableProps = (onClick: () => void) => ({
  tabIndex: 0,
  onClick,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  },
});

/* Checkbox 203:573 — visual only; the whole card/cell is the control */
function SelectCheckbox({ checked }: { checked: boolean }) {
  return <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" className="pointer-events-none shadow-none" />;
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
    <div
      role="checkbox"
      aria-checked={selected}
      {...pressableProps(onClick)}
      className={cn(
        'flex h-[46px] min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-[10px] border p-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        selected ? 'border-brand-primary' : 'border-slate-200',
      )}
    >
      <span className="w-4 shrink-0 text-base leading-6 tracking-[-0.5045px] text-brand-primary">{flag}</span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs leading-4 tracking-[-0.192px] text-brand-primary',
          selected ? 'font-[590]' : 'font-medium',
        )}
      >
        {label}
      </span>
      <SelectCheckbox checked={selected} />
    </div>
  );
}

/* Score card 161:2297 */
function ScoreCard({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: React.ReactNode;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex h-[142px] min-w-0 flex-1 flex-col justify-between rounded-[10px] bg-surface-bg px-2 py-4">
      <span className="text-xs font-bold leading-4 tracking-[-0.192px] text-slate-700">{label}</span>
      <span className="flex flex-col gap-1">
        <Input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className={fieldClass}
        />
        <span className="text-[11px] font-normal leading-[16.5px] tracking-[-0.1275px] text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

/* Footer buttons 203:605 (Back) / 203:613 (Next) — shadcn Button, 36px, radius-sm 6, Body/2 M */
const navButtonClass = 'h-9 gap-1 rounded-[6px] px-2 text-sm font-[510] leading-5 shadow-none';

function NavButtons({
  step,
  saving,
  onPrev,
  onNext,
}: {
  step: number;
  saving: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const last = step === TOTAL_STEPS;
  return (
    <div className="flex items-center gap-4">
      {step > 1 && (
        <Button type="button" variant="secondary" onClick={onPrev} disabled={saving} className={cn(navButtonClass, 'w-[140px] text-foreground')}>
          <ArrowLeft className="size-3" />
          Back
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={saving}
        className={cn(navButtonClass, 'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90', !last && 'w-[140px]')}
      >
        {last ? (saving ? 'Saving...' : 'Complete Profile & Reveal Matches') : 'Next'}
        <ArrowRight className="size-3" />
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
  /** Signed-in account from /api/auth/me; pre-fills name (editable) and email (read-only). */
  account?: { name?: string | null; email?: string | null } | null;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onFinish, account }) => {
  const router = useRouter();
  const { profile, updateProfile, setIsOnboardingOpen } = useApp();

  // The context profile starts as mock demo data; only reuse the answers once a real onboarding saved them.
  const isDemo = !!profile?.email?.includes('alex.mercer');
  const saved = !isDemo && !!profile?.onboardingCompleted;

  const [step, setStep] = useState(1);
  // null = untouched, so the session profile (loaded after mount) fills the field until the user types.
  const [nameInput, setName] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const name = nameInput ?? (account?.name || (isDemo ? '' : profile?.name) || '');
  const email = emailInput ?? (account?.email || (isDemo ? '' : profile?.email) || '');
  const emailLocked = !!(account?.email || (!isDemo && profile?.email));
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>(saved ? profile.degreeLevel : 'Masters');
  const [specializations, setSpecializations] = useState<string[]>(saved ? profile.specializations : []);
  const [countries, setCountries] = useState<string[]>(saved ? profile.targetCountries : []);
  const [cgpa, setCgpa] = useState(saved && profile.cgpa ? String(profile.cgpa) : '');
  const [ielts, setIelts] = useState(saved && profile.testScores?.ielts ? String(profile.testScores.ielts) : '');
  const [gre, setGre] = useState(saved && profile.testScores?.gre ? String(profile.testScores.gre) : '');

  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showOtherSpec, setShowOtherSpec] = useState(false);
  const [customSpec, setCustomSpec] = useState('');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  // Items added through "Other" stay visible (even if later unticked) until the flow is left.
  const [extraSpecs, setExtraSpecs] = useState<string[]>(() =>
    specializations.filter((s) => !AVAILABLE_SPECIALIZATIONS.includes(s)),
  );
  const [extraCountries, setExtraCountries] = useState<string[]>(() =>
    countries.filter((c) => !FIGMA_COUNTRY_VALUES.includes(c)),
  );

  const closeCustomSpec = () => {
    const value = customSpec.trim();
    if (value) {
      const exists = [...AVAILABLE_SPECIALIZATIONS, ...extraSpecs].find((t) => t.toLowerCase() === value.toLowerCase());
      if (!exists) setExtraSpecs((prev) => [...prev, value]);
      const tag = exists ?? value;
      setSpecializations((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    }
    setCustomSpec('');
    setShowOtherSpec(false);
  };

  const addCountry = (value: string) => {
    setExtraCountries((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCountries((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCountryPickerOpen(false);
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

    // Save on the server first; only mark the user onboarded once it succeeded (BUG-17).
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });
      if (!res.ok) {
        setSaveError(
          res.status === 401
            ? 'Your session has expired. Please sign in again.'
            : 'We couldn’t save your profile. Please try again.',
        );
        return;
      }
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
      setSaveError('We couldn’t save your profile. Check your connection and try again.');
      return;
    } finally {
      setSaving(false);
    }

    updateProfile(profilePayload);

    if (typeof window !== 'undefined' && finalEmail) {
      localStorage.setItem(`highscholar_onboarded_${finalEmail}`, 'true');
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
    setSaveError('');
    setStep(n);
  };

  const next = () => {
    if (!canNext) {
      setShowError(true);
      return;
    }
    if (saving) return;
    if (step === TOTAL_STEPS) handleSaveAndComplete();
    else goTo(step + 1);
  };

  const errorMessage =
    step === 1 ? 'Enter your full name and a valid email to continue.'
    : step === 3 ? 'Select at least one field of study.'
    : step === 4 ? 'Select at least one country.'
    : '';

  return (
    <div className="relative flex min-h-screen w-full select-none flex-col overflow-hidden bg-surface-white text-text-primary">
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

      {/* Content starts at y=200; the footer sits at y=737 (200 + 497 + 40 gap) unless a long list pushes it down */}
      <div className="relative mx-auto flex w-full max-w-[612px] flex-1 flex-col px-4 pt-12 sm:pt-[200px] xl:mx-0 xl:ml-[46.296%] xl:w-[580px] xl:max-w-none xl:px-0">
        <div className="flex w-full flex-col items-start gap-12 sm:min-h-[497px]">
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
                  <Input aria-label="Full name" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
                  <Input
                    aria-label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    // Verified sign-in email: read-only once the session provides it (the API saves the session email anyway).
                    readOnly={emailLocked}
                    aria-readonly={emailLocked}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(fieldClass, 'placeholder:text-text-placeholder', emailLocked && 'cursor-default text-text-placeholder')}
                  />
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
                    <div
                      key={opt.id}
                      role="radio"
                      aria-checked={selected}
                      {...pressableProps(() => setDegreeLevel(opt.id))}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[10px] border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                        selected ? 'border-brand-primary' : 'border-slate-200',
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={cn('text-base font-[510] leading-6', selected ? 'text-brand-primary' : 'text-text-primary')}>
                          {opt.title}
                        </span>
                        <span className="pt-0.5 text-xs leading-4 tracking-[-0.192px] text-text-secondary">{opt.subtitle}</span>
                      </span>
                      <SelectCheckbox checked={selected} />
                    </div>
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
                {[...AVAILABLE_SPECIALIZATIONS, ...extraSpecs].map((tag) => (
                  <SpecializationChip
                    key={tag}
                    label={tag}
                    selected={specializations.includes(tag)}
                    onClick={() => setSpecializations((prev) => toggle(prev, tag))}
                  />
                ))}
                {showOtherSpec ? (
                  <span className="flex h-7 w-52 items-center gap-1 rounded-full border border-brand-primary pl-[14px] pr-1 focus-within:ring-[3px] focus-within:ring-ring/50">
                    <Input
                      autoFocus
                      value={customSpec}
                      placeholder="Add your field"
                      aria-label="New field of study"
                      onChange={(e) => setCustomSpec(e.target.value)}
                      onBlur={closeCustomSpec}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') closeCustomSpec();
                        if (e.key === 'Escape') {
                          setCustomSpec('');
                          setShowOtherSpec(false);
                        }
                      }}
                      className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-xs leading-4 tracking-[-0.192px] shadow-none focus-visible:ring-0 md:text-xs"
                    />
                    <Button
                      type="button"
                      size="icon-xs"
                      aria-label="Add field"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={closeCustomSpec}
                      className="size-5 shrink-0 rounded-full bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
                    >
                      <Check className="size-3" />
                    </Button>
                  </span>
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
                {[...MAIN_COUNTRIES, ...extraCountries.map(countryOption)].map((c) => (
                  <CountryCell
                    key={c.value}
                    flag={c.flag}
                    label={c.value === 'USA' ? 'USA' : c.label}
                    selected={countries.includes(c.value)}
                    onClick={() => setCountries((prev) => toggle(prev, c.value))}
                  />
                ))}
                <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-[46px] min-w-0 items-center gap-2 overflow-hidden rounded-[10px] border border-stroke-default p-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-[590] leading-4 tracking-[-0.192px] text-text-primary">Other</span>
                      <span className="shrink-0 text-base font-medium leading-4 tracking-[-0.192px] text-slate-700">+</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="w-64 rounded-[10px] border-stroke-default p-0">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        {OTHER_COUNTRIES.filter((c) => !extraCountries.includes(c.value)).map((c) => (
                          <CommandItem key={c.value} value={c.label} onSelect={() => addCountry(c.value)}>
                            <span className="text-base leading-6">{c.flag}</span>
                            {c.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <ScoreCard label="CGPA (4.0 scale)" hint="e.g., 3.50 of 4.00" placeholder="3.79" value={cgpa} onChange={setCgpa} />
                  <ScoreCard label="English Band (IELTS / TOEFL)" hint="e.g., 7.5 or 8.0" placeholder="7.5" value={ielts} onChange={setIelts} />
                  <ScoreCard
                    label={<>GRE /<br />GMAT Total</>}
                    hint="e.g., 324 (Quant 168)"
                    placeholder="279"
                    value={gre}
                    onChange={setGre}
                  />
                </div>
                <div className="flex w-full items-start gap-2 rounded-[8px] border border-warning-main bg-warning-lightest p-3">
                  <CircleHelp className="mt-0.5 size-3 shrink-0 text-warning-main" />
                  <p className="min-w-0 flex-1 text-xs leading-4 tracking-[-0.192px] text-warning-darker">
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
          {saveError && (
            <p role="alert" className="-mt-8 text-xs leading-4 text-destructive">
              {saveError}
              {saveError.startsWith('Your session') && (
                <>
                  {' '}
                  <Link href="/login" className="font-[510] underline underline-offset-2">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        {/* Footer — progress 162:2797 + buttons 159:814 */}
        <div className="sticky bottom-0 mt-auto flex w-full items-center justify-between bg-surface-white py-4 sm:static sm:mt-10 sm:bg-transparent sm:pb-[110px] sm:pt-0">
          <ProgressDots step={step} />
          <NavButtons step={step} saving={saving} onPrev={() => goTo(step - 1)} onNext={next} />
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
