'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Shared building blocks for My Profile (Figma 281:5648) and Edit Profile (Figma 281:5309).
// Colors come from the Figma tokens: Text/Primary #101828, Text/Secondary #627181,
// Brand/Primary #7150E7, Neutral/150 #F0F3F4, Stroke/Divider #F1F1F1, Stroke/Default #E1E8F0.

export type ChipTone = 'neutral' | 'success' | 'warning' | 'brand';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-[#f0f3f4] text-[#101828]',
  success: 'bg-[#ebfdef] text-[#1b806a]',
  warning: 'bg-[#fffae5] text-[#b76e00]',
  brand: 'bg-[#f4f2fd] text-[#7150e7] border border-[#7150e7]',
};

/** Pill chip: SF Pro Medium Italic 12/18 */
export const Chip: React.FC<{
  tone?: ChipTone;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'neutral', compact = false, className, children }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-start rounded-[999px] text-[12px] italic font-[508] whitespace-pre',
      compact ? 'px-[8px] py-[2px] leading-[16px]' : 'px-[10px] py-[3px] leading-[18px]',
      CHIP_TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);

/** White card with divider stroke (Stroke/Divider #F1F1F1) */
export const Card: React.FC<{ className?: string; children: React.ReactNode; danger?: boolean }> = ({
  className,
  children,
  danger,
}) => (
  <section
    className={cn(
      'flex w-full flex-col items-start overflow-hidden rounded-[12px] border bg-white',
      danger ? 'border-[#fdcaca]' : 'border-[#f1f1f1]',
      className,
    )}
  >
    {children}
  </section>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={cn('text-[16px] leading-[22px] font-[590] text-[#101828]', className)}>{children}</h3>
);

export const CardHead: React.FC<{ title: React.ReactNode; description: React.ReactNode }> = ({
  title,
  description,
}) => (
  <div className="flex flex-col items-start gap-[4px]">
    <CardTitle>{title}</CardTitle>
    <p className="text-[12px] leading-[18px] text-[#627181]">{description}</p>
  </div>
);

/** Inter Medium 13/16 buttons, 6px radius */
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => (
  <button
    type="button"
    {...props}
    className={cn(
      'inline-flex h-[40px] shrink-0 items-center justify-center gap-[4px] rounded-[6px] bg-[#7150e7] px-[8px] font-[family-name:var(--font-inter)] text-[13px] leading-[16px] font-medium text-white transition-colors hover:bg-[#6040d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7150e7]/40 disabled:opacity-60',
      className,
    )}
  >
    {children}
  </button>
);

export const OutlineButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }> = ({
  className,
  children,
  danger,
  ...props
}) => (
  <button
    type="button"
    {...props}
    className={cn(
      'inline-flex h-[40px] shrink-0 items-center justify-center gap-[4px] rounded-[6px] border bg-white px-[8px] font-[family-name:var(--font-inter)] text-[13px] leading-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
      danger
        ? 'border-[#bf2121] text-[#bf2121] hover:bg-[#fef3f2] focus-visible:ring-[#bf2121]/30'
        : 'border-[#7150e7] text-[#7150e7] hover:bg-[#f4f2fd] focus-visible:ring-[#7150e7]/40',
      className,
    )}
  >
    {children}
  </button>
);

/** Form label: Body/2 M (SF Pro Medium 14/20) */
export const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-[510] text-[#101828] whitespace-nowrap">
    {children}
  </label>
);

const INPUT_BASE =
  'h-[44px] w-full min-w-0 rounded-[10px] border border-[#e5e5e5] bg-white px-[10px] py-[4px] text-[14px] leading-[18px] text-[#0a0a0a] placeholder:text-[#737373] outline-none transition-[border-color,box-shadow] focus-visible:border-[#7150e7] focus-visible:ring-[3px] focus-visible:ring-[#7150e7]/20 disabled:cursor-not-allowed disabled:bg-[rgba(229,229,229,0.5)] disabled:opacity-50';

export const TextField: React.FC<
  { id: string; label: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>
> = ({ id, label, className, ...props }) => (
  <div className={cn('flex min-w-0 flex-1 flex-col items-start gap-[6px]', className)}>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <input id={id} className={INPUT_BASE} {...props} />
  </div>
);

export const TextAreaField: React.FC<
  { id: string; label: string } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>
> = ({ id, label, ...props }) => (
  <div className="flex w-full flex-col items-start gap-[6px]">
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <textarea id={id} className={cn(INPUT_BASE, 'h-[139px] resize-none py-[8px]')} {...props} />
  </div>
);

export const SelectField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}> = ({ id, label, value, onChange, options, placeholder, className }) => (
  <div className={cn('flex min-w-0 flex-1 flex-col items-start gap-[6px]', className)}>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <div className="relative w-full">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_BASE, 'appearance-none pr-[34px]', !value && 'text-[#737373]')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/profile/arrow-down.svg"
        alt=""
        width={16}
        height={16}
        className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
      />
    </div>
  </div>
);

/** Read-only field (disabled look from Figma: 50% opacity on a grey fill) */
export const ReadOnlyField: React.FC<{ id: string; label: string; value: string }> = ({ id, label, value }) => (
  <TextField id={id} label={label} value={value} disabled readOnly />
);

// ---------------------------------------------------------------------------
// Documents card (shared by My Profile → Documents and Edit Profile → Documents)

type DocStatus = 'ready' | 'partial' | 'missing';
interface DocItem {
  key: string;
  title: string;
  meta: string;
  status: DocStatus;
  statusLabel: string;
  action: 'Replace' | 'Request' | 'Upload';
}

const INITIAL_DOCS: DocItem[] = [
  { key: 'cv', title: 'CV / Resume', meta: 'cv-ingrid-bergman.pdf · updated 2 days ago', status: 'ready', statusLabel: '✓ Ready', action: 'Replace' },
  { key: 'sop', title: 'Statement of Purpose', meta: 'sop-draft-v3.pdf · 920 words', status: 'ready', statusLabel: '✓ Ready', action: 'Replace' },
  { key: 'transcripts', title: 'Transcripts', meta: 'bachelor-transcript.pdf · 1.2 MB', status: 'ready', statusLabel: '✓ Ready', action: 'Replace' },
  { key: 'letters', title: 'Recommendation letters', meta: '2 of 3 letters confirmed', status: 'partial', statusLabel: '! 1 missing', action: 'Request' },
  { key: 'passport', title: 'Passport', meta: 'Not uploaded', status: 'missing', statusLabel: '! Missing', action: 'Upload' },
];

const MAX_DOC_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const DocumentsCard: React.FC = () => {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targetKey = useRef<string | null>(null);

  const acceptFile = (file: File, key: string | null) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError('That file is larger than 10 MB.');
      return;
    }
    setError('');
    setDocs((prev) => {
      // Dropped files without a target fill the first missing slot, else replace the CV
      const slot = key ?? prev.find((d) => d.status === 'missing')?.key ?? 'cv';
      return prev.map((d) =>
        d.key === slot
          ? { ...d, meta: `${file.name} · ${formatSize(file.size)}`, status: 'ready', statusLabel: '✓ Ready', action: 'Replace' }
          : d,
      );
    });
  };

  const openPicker = (key: string | null) => {
    targetKey.current = key;
    inputRef.current?.click();
  };

  return (
    <Card className="gap-[16px] p-[24px]">
      <CardHead
        title="Documents"
        description="Upload once and reuse for every application. PDF only, up to 10 MB each."
      />
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) acceptFile(file, targetKey.current);
          e.target.value = '';
        }}
      />
      <ul className="flex w-full flex-col">
        {docs.map((d) => (
          <li key={d.key} className="flex w-full items-center gap-[16px] border-t border-[#f1f1f1] py-[14px]">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
              <p className="text-[14px] leading-[20px] font-[510] text-[#101828] whitespace-pre">{`📄  ${d.title}`}</p>
              <p className="max-w-full truncate text-[12px] leading-[18px] italic text-[#627181]">{d.meta}</p>
            </div>
            <Chip tone={d.status === 'ready' ? 'success' : 'warning'}>{d.statusLabel}</Chip>
            <OutlineButton
              className="h-[36px] w-[110px]"
              onClick={() => (d.action === 'Request' ? undefined : openPicker(d.key))}
            >
              {d.action}
            </OutlineButton>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => openPicker(null)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) acceptFile(file, null);
        }}
        className={cn(
          'flex w-full flex-col items-center gap-[4px] rounded-[12px] border-[1.5px] border-dashed border-[#c4b5fd] py-[28px] transition-colors',
          isDragging ? 'bg-[#f4f2fd]' : 'bg-[#faf9fe] hover:bg-[#f4f2fd]',
        )}
      >
        <span className="text-[14px] leading-[20px] font-[510] text-[#101828] whitespace-pre">
          {'⬆  Drag & drop a PDF here, or browse files'}
        </span>
        <span className="text-[12px] leading-[18px] italic text-[#627181]">
          CV, SOP, transcripts, letters, passport · max 10 MB
        </span>
      </button>
      {error && (
        <p role="alert" className="text-[12px] leading-[18px] text-[#f62752]">
          {error}
        </p>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Account & sign-in card + Delete account card

const NOTIFICATIONS = [
  { key: 'deadlines', title: 'Deadline reminders', description: '7 days and 2 days before each saved deadline', on: true },
  { key: 'digest', title: 'New matches digest', description: 'Weekly summary of new scholarships and positions', on: true },
  { key: 'replies', title: 'Professor replies', description: 'When a professor you contacted replies', on: true },
  { key: 'news', title: 'Product news', description: 'New features and tips', on: false },
];

export const AccountCards: React.FC<{ email: string; signInMethod?: string }> = ({
  email,
  signInMethod = 'Google  ·  connected',
}) => {
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.key, n.on])),
  );
  const [visibility, setVisibility] = useState('Only me');
  const [language, setLanguage] = useState('English');

  return (
    <>
      <Card className="gap-[16px] p-[24px]">
        <CardHead
          title="Account & sign-in"
          description="Manage how you sign in, what we send you, and who can see your profile."
        />
        <div className="flex w-full flex-col gap-[16px] md:flex-row">
          <ReadOnlyField id="account-email" label="Email" value={email} />
          <ReadOnlyField id="account-signin" label="Sign-in method" value={signInMethod} />
        </div>
        <hr className="w-full border-0 border-t border-[#f1f1f1]" />
        <CardTitle>Email notifications</CardTitle>
        <div className="grid w-full grid-cols-1 gap-[16px] md:grid-cols-2">
          {NOTIFICATIONS.map((n) => {
            const on = notifs[n.key];
            return (
              <button
                key={n.key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                className="flex min-w-0 items-center gap-[16px] rounded-[8px] border border-[#e1e8f0] p-[16px] text-left transition-colors hover:bg-[#fafafa]"
              >
                <span className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                  <span className="text-[14px] leading-[20px] font-[510] text-[#101828]">{n.title}</span>
                  <span className="max-w-full truncate text-[12px] leading-[18px] italic text-[#627181]">
                    {n.description}
                  </span>
                </span>
                <Chip tone={on ? 'success' : 'neutral'}>{on ? '● On' : '○ Off'}</Chip>
              </button>
            );
          })}
        </div>
        <div className="flex w-full flex-col gap-[16px] md:flex-row">
          <SelectField
            id="account-visibility"
            label="Profile visibility"
            value={visibility}
            onChange={setVisibility}
            options={['Only me', 'Professors I contact', 'Everyone']}
          />
          <SelectField
            id="account-language"
            label="Language"
            value={language}
            onChange={setLanguage}
            options={['English', 'বাংলা']}
          />
        </div>
      </Card>
      <Card danger className="gap-[16px] p-[24px]">
        <CardHead
          title="Delete account"
          description="Permanently removes your profile, saved items and pipeline. This cannot be undone."
        />
        <OutlineButton
          danger
          className="w-[160px]"
          onClick={() =>
            window.alert('To delete your account, please contact support. Self-serve deletion is coming soon.')
          }
        >
          Delete account
        </OutlineButton>
      </Card>
    </>
  );
};
