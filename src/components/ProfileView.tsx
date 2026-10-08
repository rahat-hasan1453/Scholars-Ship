'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, GraduationCap, Lock, User, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import type { DegreeLevel, ResearchPaper } from '@/types';
import { WORLD_COUNTRIES } from '@/data/countries';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';
import { initialResearchPapers } from '@/data/researchPapers';
import { useOpportunityBookmarks } from '@/hooks/useOpportunityBookmarks';
import { ScholarshipRadarCard } from '@/components/ScholarshipRadarCard';
import { UniversityOpportunityCard } from '@/components/opportunity-feed/UniversityOpportunityCard';
import { FacultyLabCard } from '@/components/FacultyLabCard';
import { ResearchPaperCard } from '@/components/ResearchPaperCard';
import { PROFILE_VIEW_EVENT, consumeProfileViewRequest, type ProfileViewRequest } from '@/components/layout/ProfileMenuDropdown';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { ResearchPaperDetailsModal } from '@/components/research-paper-details/ResearchPaperDetailsModal';
import {
  AccountCards,
  Card,
  CardHead,
  CardTitle,
  Chip,
  DocumentsCard,
  OutlineButton,
  PrimaryButton,
  SelectField,
  TextAreaField,
  TextField,
  ReadOnlyField,
} from '@/components/profile/parts';

// My Profile (Figma 281:5648) + Edit Profile / Settings (Figma 281:5309)

type ProfileTab = 'overview' | 'saved' | 'pipeline' | 'documents' | 'account';
type SettingsSection = 'personal' | 'academic' | 'preferences' | 'documents' | 'account';


const DEGREE_LABELS: Record<DegreeLevel, string> = {
  Bachelors: 'Bachelors (BS / BSc)',
  Masters: 'Masters (MS / MSc)',
  PhD: 'PhD',
};

const flagFor = (country: string) =>
  WORLD_COUNTRIES.find((c) => c.value === country || c.label === country)?.flag ?? '🌍';

// Demo content shown until these parts of the profile are stored in the database
const UPCOMING_DEADLINES = [
  { title: 'DAAD Study Scholarship', meta: 'Applying · due 15 Oct 2026 · 11 days left', match: '85%' },
  { title: 'Chevening Scholarship', meta: 'Wishlist · due 5 Nov 2026 · 32 days left', match: '78%' },
  { title: 'Erasmus Mundus HCI', meta: 'Wishlist · due 10 Jan 2027', match: '92%' },
];

const ASK_AI_PROMPTS = [
  'Which scholarships fit my profile?',
  'Improve my Statement of Purpose',
  'Which score would raise my chances?',
  'Find professors in my field',
];

const SETTINGS_NAV: { key: SettingsSection; label: string; icon: LucideIcon }[] = [
  { key: 'personal', label: 'Personal info', icon: User },
  { key: 'academic', label: 'Academic background', icon: GraduationCap },
  { key: 'preferences', label: 'Study preferences', icon: BookOpen },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'account', label: 'Account & sign-in', icon: Lock },
];
/** Shrinks an uploaded photo to a 256px JPEG data URL, small enough to save with the profile */
function resizePhoto(file: File, size = 256): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

const DEFAULT_BIO =
  'UX designer with 3 years of industry experience, looking for a funded Master’s in HCI. Interested in accessible interfaces and in how AI tools change the way designers prototype and test.';

// ---------------------------------------------------------------------------

const TopBar: React.FC<{ label: string; showShare?: boolean }> = ({ label, showShare }) => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'My Scholars’ ship profile', url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled the share sheet
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      <p className="text-[14px] leading-[20px] font-medium text-[#95a3b6] whitespace-pre">{label}</p>
      {showShare ? (
        <button
          type="button"
          onClick={share}
          className="flex items-start gap-[4px] rounded-[6px] border border-[#e1e8f0] px-[12px] py-[6px] text-[12px] leading-[16px] font-medium text-[#95a3b6] transition-colors hover:bg-[#fafafa]"
        >
          {copied ? 'Link copied' : 'Share'}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/share.svg" alt="" width={16} height={16} />
        </button>
      ) : (
        <div className="h-[30px] w-[86px]" />
      )}
    </div>
  );
};

const ProfileBanner: React.FC<{
  name: string;
  subtitle: string;
  contact: string;
  avatar?: string;
  onUpdateResume: () => void;
  onEdit: () => void;
}> = ({ name, subtitle, contact, avatar, onUpdateResume, onEdit }) => (
  <div className="relative flex w-full flex-col gap-[24px] overflow-hidden rounded-[12px] bg-gradient-to-l from-white to-[#eef2ff] p-[24px] md:flex-row md:items-center">
    <div className="pointer-events-none absolute right-0 top-0 h-[144px] w-[262px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/profile/banner-decor.png"
        alt=""
        className="absolute left-[-0.36%] top-[1.45%] h-[98.55%] w-[100.73%] max-w-none"
      />
    </div>
    <div className="relative flex min-w-0 flex-1 items-center gap-[20px]">
      <UserAvatar src={avatar} name={name} email={contact} alt={name} className="size-[72px] md:size-[96px]" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px]">
        <h1 className="w-full truncate text-[24px] leading-[32px] font-semibold text-[#101828]">{name}</h1>
        <div className="flex min-w-0 flex-col items-start gap-[2px]">
          <p className="text-[16px] leading-[20px] text-[#101828]">{subtitle}</p>
          <p className="max-w-full truncate text-[12px] leading-[18px] italic text-[#627181]">{contact}</p>
        </div>
      </div>
    </div>
    <div className="relative flex shrink-0 flex-row gap-[12px] md:flex-col">
      <PrimaryButton className="flex-1 md:w-[200px] md:flex-none" onClick={onUpdateResume}>
        Update Resume
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/google-doc.svg" alt="" width={16} height={16} className="p-[1.33px_2.67px]" />
      </PrimaryButton>
      <OutlineButton className="flex-1 md:w-[200px] md:flex-none" onClick={onEdit}>
        Edit Profile
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/edit.svg" alt="" width={16} height={16} className="p-[1.33px]" />
      </OutlineButton>
    </div>
  </div>
);

const Tabs: React.FC<{
  tabs: { key: ProfileTab; label: string }[];
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}> = ({ tabs, active, onChange }) => (
  <div role="tablist" className="flex w-full gap-[28px] overflow-x-auto border-b border-[#e4e7ec] [scrollbar-width:none]">
    {tabs.map((t) => {
      const isActive = t.key === active;
      return (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(t.key)}
          className={cn(
            'shrink-0 border-b-2 pb-[12px] text-[16px] leading-[20px] whitespace-nowrap transition-colors',
            isActive ? 'border-[#7150e7] text-[#7150e7]' : 'border-transparent text-[#627181] hover:text-[#101828]',
          )}
        >
          {t.label}
        </button>
      );
    })}
  </div>
);

const ChipList: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="flex w-full flex-wrap content-start items-start gap-[8px]">
    {items.map((i) => (
      <Chip key={i}>{i}</Chip>
    ))}
  </div>
);

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
    <p className="text-[12px] leading-[18px] text-[#627181]">{label}</p>
    <p className="text-[14px] leading-[20px] font-medium text-[#101828]">{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Tabs content

const OverviewTab: React.FC<{
  degree: string;
  field: string;
  cgpa: string;
  english: string;
  gre: string;
  intake: string;
  interests: string[];
  countries: string[];
  bio: string;
  strength: number;
  degreeShort: string;
  onEditBio: () => void;
}> = (p) => (
  <>
    <div className="flex flex-wrap items-center gap-[8px]">
      <Chip tone="success">{p.strength}% Profile Strength</Chip>
      <Chip>{p.degreeShort}</Chip>
      <Chip>$ Funded only</Chip>
      <Chip tone="warning">⏰ Target intake: {p.intake}</Chip>
    </div>
    <div className="flex w-full flex-col items-start gap-[24px] lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-[16px]">
        <Card className="gap-[12px] p-[16px]">
          <CardTitle>Academic profile</CardTitle>
          <div className="flex w-full flex-col gap-[16px] rounded-[8px] bg-[#fafafa] p-[16px]">
            <div className="flex w-full flex-col gap-[16px] sm:flex-row">
              <Fact label="🎓 Degree Level" value={p.degree} />
              <Fact label="📚 Field of Study" value={p.field} />
              <Fact label="📊 CGPA" value={p.cgpa} />
            </div>
            <div className="flex w-full flex-col gap-[16px] sm:flex-row">
              <Fact label="🗣 English Test" value={p.english} />
              <Fact label="📝 GRE" value={p.gre} />
              <Fact label="🗓 Target Intake" value={p.intake} />
            </div>
          </div>
        </Card>
        <Card className="gap-[12px] p-[16px]">
          <CardTitle>Interests &amp; target countries</CardTitle>
          <p className="text-[12px] leading-[18px] text-[#627181]">Fields of interest</p>
          <ChipList items={p.interests} />
          <p className="text-[12px] leading-[18px] text-[#627181]">Target countries</p>
          <ChipList items={p.countries.map((c) => `${flagFor(c)} ${c}`)} />
        </Card>
        <Card className="gap-[12px] p-[16px]">
          <CardTitle>About me</CardTitle>
          <p className="text-[16px] leading-[20px] text-[#101828]">{p.bio}</p>
          <button
            type="button"
            onClick={p.onEditBio}
            className="text-[16px] leading-[20px] text-[#7150e7] hover:underline"
          >
            Edit bio
          </button>
        </Card>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-[16px] lg:w-[380px]">
        <Card className="gap-[12px] p-[16px]">
          <CardTitle>Upcoming deadlines</CardTitle>
          {UPCOMING_DEADLINES.map((d) => (
            <div key={d.title} className="flex w-full items-center justify-between gap-[8px] border-t border-[#fafafa] pt-[8px]">
              <div className="flex min-w-0 flex-col items-start gap-[2px]">
                <p className="text-[14px] leading-[20px] font-medium text-[#101828]">{d.title}</p>
                <p className="text-[12px] leading-[18px] italic text-[#627181]">{d.meta}</p>
              </div>
              <Chip tone="success" compact>
                {d.match}
              </Chip>
            </div>
          ))}
        </Card>
        <Card className="gap-[12px] p-[16px]">
          <CardTitle className="text-[#7150e7]">✨ Ask Scholar AI</CardTitle>
          {ASK_AI_PROMPTS.map((q) => (
            <div
              key={q}
              className="flex w-full items-start rounded-[6px] bg-[#eef2ff] px-[10px] py-[6px] text-[13px] leading-[18px] font-medium text-[#101828]"
            >
              ✦ {q}
            </div>
          ))}
        </Card>
      </div>
    </div>
  </>
);

type SavedFilter = 'all' | 'scholarships' | 'opportunities' | 'faculty' | 'papers';

const SavedTab: React.FC = () => {
  const { scholarships, professors } = useApp();
  const { bookmarks, toggleBookmark } = useOpportunityBookmarks();
  const [filter, setFilter] = useState<SavedFilter>('all');
  const [openPaper, setOpenPaper] = useState<ResearchPaper | null>(null);

  const items = useMemo(() => {
    const list: { key: string; type: Exclude<SavedFilter, 'all'>; node: React.ReactNode }[] = [];
    scholarships.slice(0, 2).forEach((s) =>
      list.push({ key: `s-${s.id}`, type: 'scholarships', node: <ScholarshipRadarCard scholarship={s} /> }),
    );
    OPPORTUNITY_LISTINGS.slice(0, 2).forEach((o) =>
      list.push({
        key: `o-${o.id}`,
        type: 'opportunities',
        node: <UniversityOpportunityCard opportunity={o} isBookmarked={bookmarks.has(o.id)} onToggleBookmark={toggleBookmark} />,
      }),
    );
    professors.slice(0, 1).forEach((p) =>
      list.push({ key: `f-${p.id}`, type: 'faculty', node: <FacultyLabCard professor={p} /> }),
    );
    initialResearchPapers.slice(0, 1).forEach((p) =>
      list.push({ key: `p-${p.id}`, type: 'papers', node: <ResearchPaperCard paper={p} onOpen={setOpenPaper} /> }),
    );
    // Design order: scholarship, scholarship, opportunity / opportunity, faculty, paper
    return list;
  }, [scholarships, professors, bookmarks, toggleBookmark]);

  const filters: { key: SavedFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: 12 },
    { key: 'scholarships', label: 'Scholarships', count: 5 },
    { key: 'opportunities', label: 'Opportunities', count: 3 },
    { key: 'faculty', label: 'Faculty & Labs', count: 3 },
    { key: 'papers', label: 'Research Papers', count: 1 },
  ];

  const visible = filter === 'all' ? items : items.filter((i) => i.type === filter);

  return (
    <>
      <div className="flex flex-wrap items-start gap-[8px]">
        {filters.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
            <Chip tone={filter === f.key ? 'brand' : 'neutral'}>{`${f.label}  ${f.count}`}</Chip>
          </button>
        ))}
      </div>
      <div className="grid w-full grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">
        {visible.map((i) => (
          <div key={i.key} className="min-w-0">
            {i.node}
          </div>
        ))}
      </div>
      {openPaper && <ResearchPaperDetailsModal paper={openPaper} onClose={() => setOpenPaper(null)} />}
    </>
  );
};

// ---------------------------------------------------------------------------
// Edit Profile (Settings)

interface SettingsForm {
  name: string;
  country: string;
  city: string;
  bio: string;
  degree: DegreeLevel;
  field: string;
  cgpa: string;
  scale: string;
  gradYear: string;
  ielts: string;
  toefl: string;
  gre: string;
  gmat: string;
  intake: string;
  funding: string;
  budget: string;
  uniSize: string;
  rank: string;
}

const COUNTRY_NAMES = WORLD_COUNTRIES.map((c) => c.label);

const SettingsView: React.FC<{
  section: SettingsSection;
  onSectionChange: (s: SettingsSection) => void;
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  email: string;
  avatar?: string;
  interests: string[];
  countries: string[];
  onChangePhoto: (dataUrl: string) => void;
  onRemovePhoto: () => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ section, onSectionChange, form, setForm, email, avatar, interests, countries, onChangePhoto, onRemovePhoto, onCancel, onSave }) => {
  const photoInput = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof SettingsForm>(key: K) => (value: SettingsForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const input = (key: keyof SettingsForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-[24px] lg:flex-row lg:gap-[32px]">
      <nav className="flex w-full shrink-0 gap-[4px] overflow-x-auto lg:w-[240px] lg:flex-col">
        {SETTINGS_NAV.map((n) => {
          const isActive = n.key === section;
          return (
            <button
              key={n.key}
              type="button"
              onClick={() => onSectionChange(n.key)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-[8px] rounded-[8px] px-[12px] py-[10px] text-left text-[16px] leading-[20px] whitespace-nowrap transition-colors lg:w-full',
                isActive ? 'bg-[#f4f2fd] text-[#7150e7]' : 'text-[#627181] hover:bg-[#fafafa]',
              )}
            >
              <n.icon size={18} strokeWidth={1.5} className="shrink-0" aria-hidden />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 w-full flex-1 flex-col items-start justify-between gap-[24px] self-stretch">
        <div className="flex w-full flex-col gap-[24px]">
          {section === 'personal' && (
            <Card className="gap-[16px] p-[24px]">
              <CardHead
                title="Personal info"
                description="This is how professors and providers see you when you contact them."
              />
              <div className="flex flex-wrap items-center gap-[16px]">
                <UserAvatar src={avatar} name={form.name} email={email} className="size-[64px]" />
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void resizePhoto(file).then((dataUrl) => dataUrl && onChangePhoto(dataUrl));
                    e.target.value = '';
                  }}
                />
                <OutlineButton className="w-[150px]" onClick={() => photoInput.current?.click()}>
                  Change photo
                </OutlineButton>
                <button type="button" onClick={onRemovePhoto} className="text-[16px] leading-[20px] text-[#7150e7] hover:underline">
                  Remove
                </button>
              </div>
              <div className="flex w-full flex-col gap-[16px] md:flex-row">
                <TextField id="settings-name" label="Full name" {...input('name')} />
                <ReadOnlyField id="settings-email" label="Email" value={email} />
              </div>
              <div className="flex w-full flex-col gap-[16px] md:flex-row">
                <SelectField id="settings-country" label="Country of residence" value={form.country} onChange={set('country')} options={COUNTRY_NAMES.includes(form.country) || !form.country ? COUNTRY_NAMES : [form.country, ...COUNTRY_NAMES]} />
                <SelectField id="settings-city" label="City" value={form.city} onChange={set('city')} options={['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Other']} />
              </div>
              <TextAreaField id="settings-bio" label="Short bio" {...input('bio')} />
            </Card>
          )}

          {section === 'academic' && (
            <>
              <Card className="gap-[16px] p-[24px]">
                <CardHead
                  title="Academic background"
                  description="Used to match you with scholarships and labs. Keep it up to date."
                />
                <div className="flex w-full flex-col gap-[16px] md:flex-row">
                  <SelectField
                    id="settings-degree"
                    label="Degree you are applying for"
                    value={DEGREE_LABELS[form.degree]}
                    onChange={(v) => set('degree')((Object.keys(DEGREE_LABELS) as DegreeLevel[]).find((k) => DEGREE_LABELS[k] === v) ?? 'Masters')}
                    options={Object.values(DEGREE_LABELS)}
                  />
                  <SelectField
                    id="settings-field"
                    label="Field of study"
                    value={form.field}
                    onChange={set('field')}
                    options={Array.from(new Set([form.field, 'UX Design & HCI', 'Computer Science', 'Artificial Intelligence', 'Data Science', 'Electrical Engineering', 'Business'].filter(Boolean)))}
                  />
                </div>
                <div className="flex w-full flex-col gap-[16px] md:flex-row">
                  <TextField id="settings-cgpa" label="CGPA" inputMode="decimal" {...input('cgpa')} />
                  <TextField id="settings-scale" label="Grading scale" inputMode="decimal" {...input('scale')} />
                  <TextField id="settings-grad" label="Graduation year" inputMode="numeric" {...input('gradYear')} />
                </div>
                <div className="flex w-full flex-col items-start gap-[8px]">
                  <p className="text-[14px] leading-[20px] font-medium text-[#101828]">Fields of interest</p>
                  <ChipList items={interests} />
                </div>
              </Card>
              <Card className="gap-[16px] p-[24px]">
                <CardHead title="Test scores" description="Add only the tests you have taken. Leave the rest empty." />
                <div className="flex w-full flex-col gap-[16px] md:flex-row">
                  <TextField id="settings-ielts" label="IELTS (overall)" inputMode="decimal" placeholder="Not taken" {...input('ielts')} />
                  <TextField id="settings-toefl" label="TOEFL iBT" inputMode="numeric" placeholder="Not taken" {...input('toefl')} />
                </div>
                <div className="flex w-full flex-col gap-[16px] md:flex-row">
                  <TextField id="settings-gre" label="GRE (total)" inputMode="numeric" placeholder="Not taken" {...input('gre')} />
                  <TextField id="settings-gmat" label="GMAT" inputMode="numeric" placeholder="Not taken" {...input('gmat')} />
                </div>
              </Card>
            </>
          )}

          {section === 'preferences' && (
            <Card className="gap-[16px] p-[24px]">
              <CardHead
                title="Study preferences"
                description="We use these to rank scholarships, labs and positions for you."
              />
              <div className="flex w-full flex-col gap-[16px] md:flex-row">
                <SelectField id="settings-intake" label="Target intake" value={form.intake} onChange={set('intake')} options={['Spring 2027', 'Fall 2027', 'Spring 2028', 'Fall 2028']} />
                <SelectField
                  id="settings-level"
                  label="Degree level"
                  value={DEGREE_LABELS[form.degree]}
                  onChange={(v) => set('degree')((Object.keys(DEGREE_LABELS) as DegreeLevel[]).find((k) => DEGREE_LABELS[k] === v) ?? 'Masters')}
                  options={Object.values(DEGREE_LABELS)}
                />
              </div>
              <div className="flex w-full flex-col gap-[16px] md:flex-row">
                <SelectField id="settings-funding" label="Funding I need" value={form.funding} onChange={set('funding')} options={['Full funding only', 'Partial funding is fine', 'Tuition waiver', 'Self-funded']} />
                <SelectField
                  id="settings-budget"
                  label="Max self-funded budget / year"
                  value={form.budget}
                  onChange={set('budget')}
                  placeholder="e.g. €5,000 (optional)"
                  options={['€5,000', '€10,000', '€20,000', '€30,000+']}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-[8px]">
                <p className="text-[14px] leading-[20px] font-medium text-[#101828]">Target countries</p>
                <ChipList items={countries.map((c) => `${flagFor(c)} ${c}`)} />
              </div>
              <div className="flex w-full flex-col items-start gap-[8px]">
                <p className="text-[14px] leading-[20px] font-medium text-[#101828]">Open to</p>
                <ChipList items={['Scholarships', 'Research assistantships', 'Teaching assistantships', 'Fully funded PhD']} />
              </div>
              <div className="flex w-full flex-col gap-[16px] md:flex-row">
                <SelectField id="settings-size" label="Preferred university size" value={form.uniSize} onChange={set('uniSize')} options={['Any', 'Small', 'Medium', 'Large']} />
                <SelectField id="settings-rank" label="Rank range" value={form.rank} onChange={set('rank')} options={['Top 50 (QS)', 'Top 100 (QS)', 'Top 200 (QS)', 'Top 500 (QS)', 'Any']} />
              </div>
            </Card>
          )}

          {section === 'documents' && <DocumentsCard />}
          {section === 'account' && <AccountCards />}
        </div>

        <div className="flex w-full justify-end gap-[12px]">
          <OutlineButton className="w-[140px]" onClick={onCancel}>
            Cancel
          </OutlineButton>
          <PrimaryButton className="w-[180px]" onClick={onSave}>
            Save changes
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const ProfileView: React.FC<{ onNavigateToTracker?: () => void }> = () => {
  const { profile, saveProfile, applications } = useApp();

  // A header menu request (Settings / My Applications) picks the first view
  const [initialRequest] = useState<ProfileViewRequest | null>(consumeProfileViewRequest);
  const [mode, setMode] = useState<'view' | 'edit'>(initialRequest === 'settings' ? 'edit' : 'view');
  const [tab, setTab] = useState<ProfileTab>(initialRequest === 'pipeline' ? 'pipeline' : 'overview');
  const [section, setSection] = useState<SettingsSection>('personal');
  const [saved, setSaved] = useState(false);

  const avatar = profile.avatar;
  const interests = profile.specializations?.length ? profile.specializations : ['UX Design', 'HCI'];
  const countries = profile.targetCountries?.length ? profile.targetCountries : ['Germany'];

  const initialForm = (): SettingsForm => ({
    name: profile.name || '',
    country: 'Bangladesh',
    city: 'Dhaka',
    bio: extra.bio,
    degree: profile.degreeLevel || 'Masters',
    field: extra.field || profile.specializations?.[0] || 'UX Design & HCI',
    cgpa: profile.cgpa ? String(profile.cgpa) : '',
    scale: '4.00',
    gradYear: extra.gradYear,
    ielts: profile.testScores?.ielts ? String(profile.testScores.ielts) : '',
    toefl: profile.testScores?.toefl ? String(profile.testScores.toefl) : '',
    gre: profile.testScores?.gre ? String(profile.testScores.gre) : '',
    gmat: profile.testScores?.gmat ? String(profile.testScores.gmat) : '',
    intake: extra.intake,
    funding: 'Full funding only',
    budget: '',
    uniSize: 'Any',
    rank: 'Top 200 (QS)',
  });

  // Bio / field / graduation year / intake are saved in the profile's `details` (defaults until the user edits them)
  const extra = {
    bio: profile.details?.bio ?? DEFAULT_BIO,
    field: profile.details?.field ?? 'UX Design & HCI',
    gradYear: profile.details?.gradYear ?? '2023',
    intake: profile.details?.intake ?? 'Fall 2027',
  };
  const [form, setForm] = useState<SettingsForm>(initialForm);

  // Header menu request while this page is already open
  useEffect(() => {
    const onRequest = () => {
      const view = consumeProfileViewRequest();
      if (view === 'settings') {
        setSection('personal');
        setMode('edit');
      } else if (view === 'pipeline') {
        setTab('pipeline');
        setMode('view');
      }
    };
    window.addEventListener(PROFILE_VIEW_EVENT, onRequest);
    return () => window.removeEventListener(PROFILE_VIEW_EVENT, onRequest);
  }, []);

  const openSettings = (s: SettingsSection = 'personal') => {
    setForm(initialForm());
    setSection(s);
    setMode('edit');
  };

  const num = (v: string) => {
    const n = Number(v);
    return v.trim() && Number.isFinite(n) ? n : undefined;
  };

  const save = async () => {
    setMode('view');
    const ok = await saveProfile({
      name: form.name.trim() || profile.name,
      degreeLevel: form.degree,
      cgpa: num(form.cgpa) ?? profile.cgpa,
      testScores: { ielts: num(form.ielts), toefl: num(form.toefl), gre: num(form.gre), gmat: num(form.gmat) },
      details: { ...profile.details, bio: form.bio, field: form.field, gradYear: form.gradYear, intake: form.intake },
    });
    if (!ok) return; // rolled back; AppContext shows the error message
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const strength = useMemo(() => {
    const checks = [
      profile.name,
      profile.email,
      profile.avatar,
      profile.degreeLevel,
      profile.cgpa,
      profile.testScores?.ielts || profile.testScores?.toefl,
      profile.testScores?.gre || profile.testScores?.gmat,
      profile.specializations?.length,
      profile.targetCountries?.length,
      extra.bio,
      extra.intake,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extra is derived from profile
  }, [profile]);

  const english = profile.testScores?.ielts
    ? `IELTS ${profile.testScores.ielts.toFixed(1)}`
    : profile.testScores?.toefl
      ? `TOEFL ${profile.testScores.toefl}`
      : 'Not added';

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'saved', label: 'Saved (12)' },
    { key: 'pipeline', label: `Pipeline (${applications.length})` },
    { key: 'documents', label: 'Documents' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <div className="relative flex min-h-full w-full flex-col items-start gap-[24px] rounded-[16px] bg-white px-4 pb-[32px] pt-[24px] sm:px-[32px]">
      {mode === 'edit' ? (
        <>
          <TopBar label="My Profile  ·  Settings" />
          <SettingsView
            section={section}
            onSectionChange={setSection}
            form={form}
            setForm={setForm}
            email={profile.email}
            avatar={avatar}
            interests={interests}
            countries={countries}
            onChangePhoto={(dataUrl) => void saveProfile({ avatar: dataUrl })}
            onRemovePhoto={() => void saveProfile({ avatar: '' })}
            onCancel={() => setMode('view')}
            onSave={save}
          />
        </>
      ) : (
        <>
          <TopBar label="My Profile" showShare />
          <ProfileBanner
            name={profile.name || 'Your name'}
            subtitle={`${profile.degreeLevel || 'Masters'} applicant · ${profile.specializations?.[0] || 'UX & HCI'}`}
            contact={profile.email}
            avatar={avatar}
            onUpdateResume={() => setTab('documents')}
            onEdit={() => openSettings('personal')}
          />
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          {tab === 'overview' && (
            <OverviewTab
              degree={DEGREE_LABELS[profile.degreeLevel] || 'Masters (MS / MSc)'}
              degreeShort={profile.degreeLevel || 'Masters'}
              field={extra.field}
              cgpa={profile.cgpa ? `${profile.cgpa.toFixed(2)} / 4.00` : 'Not added'}
              english={english}
              gre={profile.testScores?.gre ? `${profile.testScores.gre} / 340` : 'Not added'}
              intake={extra.intake}
              interests={interests}
              countries={countries}
              bio={extra.bio}
              strength={strength}
              onEditBio={() => openSettings('personal')}
            />
          )}
          {tab === 'saved' && <SavedTab />}
          {tab === 'pipeline' && <PipelineBoard embedded />}
          {tab === 'documents' && <DocumentsCard />}
          {tab === 'account' && <AccountCards />}
        </>
      )}
      {saved && (
        <div role="status" className="fixed bottom-6 right-6 z-50 rounded-[8px] bg-[#101828] px-4 py-3 text-[14px] text-white shadow-lg">
          Profile saved
        </div>
      )}
    </div>
  );
};
