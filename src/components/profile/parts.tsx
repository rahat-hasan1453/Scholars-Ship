'use client';

import React, { useRef, useState } from 'react';
import { Check, Eye, Trash2, Upload } from 'lucide-react';
import { uploadPresigned as uploadToBlob } from '@vercel/blob/client';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

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
// Documents card (Figma 279:8715) + Upload Documents popup (Figma 327:7787)
// Files live in memory for this visit only; there is no file storage backend yet.

export type DocKind = 'cv' | 'sop' | 'transcripts' | 'letters';

const DOC_KINDS: { key: DocKind; title: string; option: string }[] = [
  { key: 'cv', title: 'CV / Resume', option: 'Resume' },
  { key: 'sop', title: 'Statement of Purpose', option: 'SOP' },
  { key: 'transcripts', title: 'Transcripts', option: 'Transcripts' },
  { key: 'letters', title: 'Recommendation letters', option: 'letters' },
];

const LETTERS_NEEDED = 3;
const MAX_DOC_BYTES = 10 * 1024 * 1024;

interface StoredDoc {
  id: string;
  kind: DocKind;
  name: string;
  size: number;
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function checkPdf(file: File): string | null {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return 'Only PDF files are supported.';
  if (file.size > MAX_DOC_BYTES) return 'That file is larger than 10 MB.';
  return null;
}

/** Dashed drop zone shared by the card and the popup */
const DropZone: React.FC<{
  onFile: (file: File) => void;
  onBrowse: () => void;
  withIcon?: boolean;
  children?: React.ReactNode;
}> = ({ onFile, onBrowse, withIcon, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <button
      type="button"
      onClick={onBrowse}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        'flex w-full flex-col items-center gap-[4px] rounded-[12px] border-[1.5px] border-dashed border-[#c4b5fd] px-4 py-[28px] text-center transition-colors',
        isDragging ? 'bg-[#f4f2fd]' : 'bg-[#faf9fe] hover:bg-[#f4f2fd]',
      )}
    >
      {withIcon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/profile/upload-cloud.svg" alt="" width={20} height={20} />
      )}
      <span className="text-[14px] leading-[20px] font-[510] text-[#101828] whitespace-pre-wrap">
        {withIcon ? 'Drag & drop a PDF here, or browse files' : '⬆  Drag & drop a PDF here, or browse files'}
      </span>
      <span className="text-[12px] leading-[18px] italic text-[#627181]">
        CV, SOP, transcripts, letters · max 10 MB
      </span>
      {children}
    </button>
  );
};

const UploadDocumentsDialog: React.FC<{
  initialFile: File | null;
  initialKinds: DocKind[];
  onClose: () => void;
  /** Resolves to an error message, or null when the upload worked */
  onUpload: (file: File, kinds: DocKind[]) => Promise<string | null>;
}> = ({ initialFile, initialKinds, onClose, onUpload }) => {
  // Mounted fresh for every open, so state starts from the props
  const [file, setFile] = useState<File | null>(() => (initialFile && !checkPdf(initialFile) ? initialFile : null));
  const [kinds, setKinds] = useState<DocKind[]>(initialKinds);
  const [error, setError] = useState(() => (initialFile ? (checkPdf(initialFile) ?? '') : ''));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File) => {
    const problem = checkPdf(f);
    setError(problem ?? '');
    setFile(problem ? null : f);
  };

  const canUpload = !!file && !error && kinds.length > 0 && !busy;

  const submit = async () => {
    if (!file || !canUpload) return;
    setBusy(true);
    const problem = await onUpload(file, kinds);
    setBusy(false);
    if (problem) setError(problem);
    else onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[465px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[20px] border-[#e1e8f0] p-0 shadow-xl sm:max-w-[465px]"
      >
        <div className="flex w-full flex-col gap-[40px] px-[16px] pt-[16px] pb-[40px]">
          <div className="flex w-full flex-col gap-[16px]">
            <DialogTitle className="text-[16px] leading-[22px] font-[590] text-[#101828]">Upload Documents</DialogTitle>
            <DialogDescription className="sr-only">Choose what this PDF is, then add the file.</DialogDescription>
            <div className="grid w-full grid-cols-2 gap-[8px] sm:grid-cols-4">
              {DOC_KINDS.map((k) => {
                const checked = kinds.includes(k.key);
                return (
                  <label
                    key={k.key}
                    className="flex min-w-0 cursor-pointer items-center gap-[8px] rounded-[10px] border border-[#e1e8f0] px-[8px] py-[6px] hover:bg-[#fafafa]"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setKinds((prev) => (v ? [...prev, k.key] : prev.filter((x) => x !== k.key)))
                      }
                      className="border-[#d0d5dd] bg-[rgba(229,229,229,0.3)] data-[state=checked]:border-[#7150e7] data-[state=checked]:bg-[#7150e7]"
                    />
                    <span
                      className={cn(
                        'min-w-0 truncate text-[13px] leading-[19.5px] tracking-[-0.0762px]',
                        checked ? 'font-medium text-[#7150e7]' : 'text-[#627181]',
                      )}
                    >
                      {k.option}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = '';
            }}
          />
          <div className="flex w-full flex-col gap-[8px]">
            <DropZone withIcon onFile={pick} onBrowse={() => inputRef.current?.click()}>
              {file && (
                <span className="mt-[6px] max-w-full truncate rounded-[999px] bg-white px-[10px] py-[3px] text-[12px] leading-[18px] font-[510] text-[#7150e7]">
                  {file.name} · {formatSize(file.size)}
                </span>
              )}
            </DropZone>
            {error && (
              <p role="alert" className="text-[12px] leading-[18px] text-[#f62752]">
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full items-center gap-[12px] border-t border-[#e1e8f0] p-[16px]">
          <OutlineButton className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </OutlineButton>
          <PrimaryButton className="flex-1" disabled={!canUpload} onClick={submit}>
            {busy ? 'Uploading…' : 'Upload'}
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** Pathname inside the user's own folder. The random part keeps names unique (the presigned flow cannot add a suffix). */
const blobPathFor = (prefix: string, fileName: string) => {
  const base = fileName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'document';
  return `${prefix}${crypto.randomUUID().slice(0, 8)}-${base}.pdf`;
};

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (res.status === 503) return 'File storage is not set up yet. Please try again later.';
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export const DocumentsCard: React.FC = () => {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [prefix, setPrefix] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<{ file: File | null; kinds: DocKind[] } | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch('/api/documents')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d?.documents) setDocs(d.documents);
        if (d?.uploadPrefix) setPrefix(d.uploadPrefix);
        if (d && d.storageReady === false) setStorageReady(false);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const openDialog = (file: File | null, kinds: DocKind[] = ['cv']) => {
    setNotice('');
    setDialog({ file, kinds });
  };

  const upload = async (file: File, kinds: DocKind[]): Promise<string | null> => {
    if (!prefix) return 'Please sign in to upload documents.';
    if (!storageReady) return 'File storage is not set up yet. Please try again later.';
    try {
      const blob = await uploadToBlob(blobPathFor(prefix, file.name), file, {
        access: 'private',
        handleUploadUrl: '/api/documents/upload',
        contentType: 'application/pdf',
      });
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pathname: blob.pathname, name: file.name, kinds }),
      });
      if (!res.ok) return await readError(res, 'We could not save that file. Please try again.');
      setDocs((await res.json()).documents);
      return null;
    } catch (err) {
      console.error('[documents] upload failed:', err);
      return 'The upload did not finish. Check your connection and try again.';
    }
  };

  const remove = async (kind: DocKind) => {
    setNotice('');
    const before = docs;
    setDocs((prev) => prev.filter((d) => d.kind !== kind));
    try {
      const res = await fetch(`/api/documents?kind=${kind}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setDocs((await res.json()).documents);
    } catch {
      setDocs(before);
      setNotice('We could not delete that file. Please try again.');
    }
  };

  return (
    <Card className="gap-[16px] p-[24px]">
      <CardHead
        title="Documents"
        description="Upload once and reuse for every application. PDF only, up to 10 MB each."
      />
      {/* Click or drop: both open the Upload Documents popup */}
      <DropZone onFile={(f) => openDialog(f)} onBrowse={() => openDialog(null)} />
      {notice && (
        <p role="alert" className="text-[12px] leading-[18px] text-[#f62752]">
          {notice}
        </p>
      )}
      <ul className="flex w-full flex-col" aria-busy={!loaded}>
        {DOC_KINDS.map((k) => {
          const files = docs.filter((d) => d.kind === k.key);
          const latest = files[files.length - 1];
          const isLetters = k.key === 'letters';
          const ready = isLetters ? files.length >= LETTERS_NEEDED : files.length > 0;
          const meta = !loaded
            ? 'Loading…'
            : !latest
              ? 'Not uploaded'
              : isLetters
                ? `${files.length} of ${LETTERS_NEEDED} letters uploaded`
                : `${latest.name} · ${formatSize(latest.size)}`;
          const chip = ready
            ? { tone: 'success' as const, label: '✓ Ready' }
            : isLetters && files.length > 0
              ? { tone: 'warning' as const, label: `! ${LETTERS_NEEDED - files.length} missing` }
              : { tone: 'warning' as const, label: '! Missing' };
          return (
            <li key={k.key} className="flex w-full items-center gap-[16px] border-t border-[#f1f1f1] py-[14px]">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[16px] gap-y-[4px]">
                <div className="flex min-w-0 flex-col items-start gap-[2px]">
                  <p className="text-[14px] leading-[20px] font-[510] text-[#101828] whitespace-pre">{`📄  ${k.title}`}</p>
                  <p className="max-w-full truncate text-[12px] leading-[18px] italic text-[#627181]">{meta}</p>
                </div>
                {loaded && <Chip tone={chip.tone}>{chip.label}</Chip>}
              </div>
              <div className="flex shrink-0 items-center gap-[16px]">
                <button
                  type="button"
                  disabled={!latest}
                  onClick={() => latest && window.open(`/api/documents/${latest.id}/file`, '_blank', 'noopener')}
                  className="inline-flex h-[36px] w-[88px] items-center justify-center gap-[4px] rounded-[6px] border border-[#7150e7] px-[8px] text-[14px] leading-[20px] font-[510] text-[#7150e7] transition-colors hover:bg-[#f4f2fd] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  View
                  <Eye size={12} strokeWidth={1.5} aria-hidden />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`More actions for ${k.title}`}
                    className="flex size-[24px] items-center justify-center rounded-[6px] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-[#7150e7]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/profile/doc-more.svg" alt="" width={24} height={24} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={() => openDialog(null, [k.key])}>
                      <Upload strokeWidth={1.5} aria-hidden />
                      Upload
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" disabled={!latest} onSelect={() => remove(k.key)}>
                      <Trash2 strokeWidth={1.5} aria-hidden />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
        })}
      </ul>
      {dialog && (
        <UploadDocumentsDialog
          initialFile={dialog.file}
          initialKinds={dialog.kinds}
          onClose={() => setDialog(null)}
          onUpload={upload}
        />
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Account & sign-in card (Figma 281:5574) + Delete account card

const NOTIFICATIONS = [
  { key: 'deadlines', title: 'Deadline reminders', description: '7 days and 2 days before each saved deadline' },
  { key: 'digest', title: 'New matches digest', description: 'Weekly summary of new scholarships and positions' },
] as const;

const SignInMethod: React.FC<{ icon: string; label: string; checked: boolean; width: string }> = ({
  icon,
  label,
  checked,
  width,
}) => (
  <div className={cn('flex h-[48px] items-center gap-[8px] rounded-[10px] border border-[#e1e8f0] p-[8px]', width)}>
    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={20} height={20} className="size-[20px] shrink-0 object-cover" />
      <span className="truncate text-[14px] leading-[18px] text-[#627181]">{label}</span>
    </div>
    <span
      role="img"
      aria-label={checked ? 'Connected' : 'Not connected'}
      className={cn(
        'flex size-[16px] shrink-0 items-center justify-center rounded-[4px]',
        checked ? 'bg-[#7150e7] text-white' : 'border border-[#e5e5e5]',
      )}
    >
      {checked && <Check size={14} strokeWidth={1.5} aria-hidden />}
    </span>
  </div>
);

export const AccountCards: React.FC = () => {
  const { profile, saveProfile } = useApp();
  // Both reminders are on until the user turns one off (saved in the profile's details)
  const notifs = profile.details?.notifications ?? { deadlines: true, digest: true };
  const toggle = (key: 'deadlines' | 'digest') =>
    void saveProfile({ details: { ...profile.details, notifications: { ...notifs, [key]: !notifs[key] } } });
  // Google is connected when the account has a Google id; otherwise the user signs in with an email code
  const [usesGoogle, setUsesGoogle] = useState<boolean | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => alive && setUsesGoogle(!!d?.user?.googleId))
      .catch(() => alive && setUsesGoogle(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Card className="gap-[20px] p-[24px]">
        <CardHead
          title="Account & sign-in"
          description="Manage how you sign in, what we send you, and who can see your profile."
        />
        <div className="flex w-full flex-col items-start gap-[6px]">
          <p className="text-[14px] leading-[20px] font-[510] text-[#627181]">Sign-in method</p>
          <div className="flex flex-wrap items-start gap-[20px]">
            <SignInMethod icon="/profile/signin-google.svg" label="Google" checked={usesGoogle === true} width="w-[200px]" />
            <SignInMethod
              icon="/profile/signin-email.png"
              label="Email/ OTP Confirmation"
              checked={usesGoogle === false}
              width="w-[240px]"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-[12px]">
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
                  onClick={() => toggle(n.key)}
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
