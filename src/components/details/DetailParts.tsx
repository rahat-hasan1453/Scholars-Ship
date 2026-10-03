'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Building blocks for every details page (Figma 249:2596). Pages pass data only; layout lives here.
// Figma warning text #b76e00 is darkened to #7a4100 for WCAG AA.

/** `live`: status chips such as "● Accepting Students" (Figma 258:3576) */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'live';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-[#f0f3f4] text-[#101828]',
  success: 'bg-[#ebfdef] text-[#1b806a]',
  warning: 'bg-[#fffae5] text-[#7a4100]',
  live: 'bg-[#ebfdef] text-[#047857]',
};

export function DetailChip({ tone = 'neutral', children }: { tone?: ChipTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-start px-2.5 py-[3px] rounded-full text-[12px] leading-[18px] font-medium italic whitespace-nowrap ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

export interface DetailHeaderProps {
  /** Line above the title, e.g. the provider or university */
  eyebrow: string;
  /** Small italic line under the eyebrow, e.g. "🇩🇪 Germany · Added 3 days ago" */
  meta?: string;
  title: string;
  /** Round photo next to the title, e.g. the professor (Figma 262:4434) */
  avatarUrl?: string;
  chips?: { label: string; tone?: ChipTone }[];
}

export function DetailHeader({ eyebrow, meta, title, avatarUrl, chips = [] }: DetailHeaderProps) {
  const heading = <h1 className="text-[24px] leading-8 font-semibold text-[#101828]">{title}</h1>;
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-[14px] leading-5 font-medium text-[#101828]">{eyebrow}</p>
        {meta && <p className="text-[12px] leading-[18px] italic text-[#627181] whitespace-pre-wrap">{meta}</p>}
      </div>
      {avatarUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={avatarUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full border-2 border-white object-cover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
          />
          {heading}
        </div>
      ) : (
        heading
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <DetailChip key={c.label} tone={c.tone}>
              {c.label}
            </DetailChip>
          ))}
        </div>
      )}
    </header>
  );
}

/** `href` turns the value into an external link, e.g. a lab website */
export type Fact = { icon: string; label: string; value: string; href?: string };

export function FactsGrid({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-[8px] bg-[#fafafa]">
      {facts.map((f) => (
        <div key={f.label} className="flex flex-col gap-0.5 min-w-0">
          <dt className="text-[12px] leading-[18px] text-[#627181]">
            <span aria-hidden>{f.icon} </span>
            {f.label}
          </dt>
          <dd className="text-[14px] leading-5 font-medium text-[#101828] truncate" title={f.value}>
            {f.href ? (
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#7150e7] hover:underline">
                {f.value}
              </a>
            ) : (
              f.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pt-5 border-t border-[#f1f1f1]">
      <h2 className="w-[150px] shrink-0 text-[12px] leading-[18px] font-semibold tracking-[0.6px] text-[#627181]">{label}</h2>
      <div className="flex flex-1 min-w-0 w-full flex-col gap-2">{children}</div>
    </section>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((k) => (
        <DetailChip key={k}>{k}</DetailChip>
      ))}
    </div>
  );
}

const textLink = 'self-start text-[13px] leading-[18px] font-medium text-[#7150e7] hover:underline cursor-pointer';

/** Long text clamped to 3 lines with a "Show more" toggle, plus an optional external link below it */
export function ExpandableText({ text, link }: { text: string; link?: { label: string; href: string } }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280;
  return (
    <>
      <p className={`text-[14px] leading-[18px] text-[#101828] ${long && !open ? 'line-clamp-3' : ''}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={textLink}>
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
      {link && (
        <a href={link.href} target="_blank" rel="noopener noreferrer" className={textLink}>
          {link.label}
        </a>
      )}
    </>
  );
}

/** Plain paragraph for short sections such as "About the Lab" */
export function DetailText({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-[18px] text-[#101828]">{children}</p>;
}

export function ValueRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-col gap-2 text-[14px] text-[#101828]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start justify-between gap-4">
          <dt className="leading-[18px]">{r.label}</dt>
          <dd className="leading-5 font-medium text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type CheckRow = { label: string; requirement: string; you: string; met: boolean };

export function CheckList({ rows }: { rows: CheckRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span aria-hidden className={`w-4 shrink-0 text-[14px] leading-5 font-semibold ${r.met ? 'text-[#1b806a]' : 'text-[#7a4100]'}`}>
            {r.met ? '✓' : '!'}
          </span>
          <span className="sr-only">{r.met ? 'Met:' : 'Not met:'}</span>
          <span className="w-[140px] shrink-0 text-[14px] leading-[18px] text-[#101828]">{r.label}</span>
          <span className="flex-1 min-w-0 text-[14px] leading-[18px] text-[#101828]">{r.requirement}</span>
          <span className={`shrink-0 text-[13px] leading-5 italic whitespace-nowrap ${r.met ? 'text-[#1b806a]' : 'text-[#7a4100]'}`}>
            {r.you}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-2 text-[14px] leading-[18px] text-[#101828]">
      {steps.map((s, i) => (
        <li key={s} className="whitespace-pre-wrap">{`${i + 1}.  ${s}`}</li>
      ))}
    </ol>
  );
}

/* ---------- Sidebar cards ---------- */

export function SidebarCard({ title, titleClassName = 'text-[#101828]', children }: { title: string; titleClassName?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 p-4 rounded-[12px] border border-[#f1f1f1] bg-white">
      <h2 className={`text-[16px] leading-[22px] font-semibold ${titleClassName}`}>{title}</h2>
      {children}
    </section>
  );
}

const sidebarButton =
  'flex min-w-0 items-center justify-center h-10 px-2 rounded-[6px] font-[family-name:var(--font-inter)] text-[13px] leading-4 font-medium transition-colors cursor-pointer';

export interface ActionCardProps {
  title: string;
  /** Deadline line, e.g. "⏰ Closes 15 Oct 2026 · 12 days left" */
  note?: string;
  /** `success` for good news such as "● Accepting PhD students" (Figma 258:3671) */
  noteTone?: 'warning' | 'success';
  primary: { label: string; href: string };
  secondary?: { label: string; onClick: () => void; pressed?: boolean }[];
}

export function ActionCard({ title, note, noteTone = 'warning', primary, secondary = [] }: ActionCardProps) {
  return (
    <SidebarCard title={title}>
      {note && (
        <p className={`text-[13px] leading-[18px] font-medium whitespace-pre-wrap ${noteTone === 'success' ? 'text-[#047857]' : 'text-[#7a4100]'}`}>
          {note}
        </p>
      )}
      <a
        href={primary.href}
        // mailto: links open the mail app; everything else opens in a new tab
        {...(primary.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        className={`${sidebarButton} w-full bg-[#7150e7] text-white hover:bg-[#5f3fd6]`}
      >
        {primary.label}
      </a>
      {secondary.length > 0 && (
        <div className="flex gap-2">
          {secondary.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.onClick}
              aria-pressed={b.pressed}
              className={`${sidebarButton} flex-1 border border-[#7150e7] text-[#7150e7] hover:bg-[#f4f2fd] aria-pressed:bg-[#f4f2fd]`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </SidebarCard>
  );
}

export function MatchCard({ score, rows }: { score: number; rows: { label: string; percent: number }[] }) {
  return (
    <section className="flex flex-col gap-3 p-4 rounded-[12px] border border-[#f1f1f1] bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] leading-[22px] font-semibold text-[#101828]">Your match</h2>
        <p className="text-[20px] leading-7 font-semibold text-[#1b806a]">{score}%</p>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1">
          <div className="flex items-start justify-between text-[13px] leading-[18px]">
            <span className="text-[#627181]">{r.label}</span>
            <span className="font-medium text-[#101828]">{r.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={r.label}
            aria-valuenow={r.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="relative h-1.5 rounded-[3px] bg-[#f0f3f4] overflow-hidden"
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-[3px] ${r.percent >= 80 ? 'bg-[#36b37e]' : 'bg-[#ffab00]'}`}
              style={{ width: `${r.percent}%` }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

/** AI prompts are shown but not wired up yet */
export function AskAiCard({ prompts }: { prompts: string[] }) {
  return (
    <SidebarCard title="✨ Ask Scholar AI" titleClassName="text-[#7150e7]">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled
          title="Scholar AI is coming soon"
          className="flex items-start w-full px-2.5 py-1.5 rounded-[6px] bg-[#eef2ff] text-left text-[13px] leading-[18px] font-medium text-[#101828] whitespace-pre cursor-not-allowed"
        >
          {`✦  ${p}`}
        </button>
      ))}
    </SidebarCard>
  );
}

export type SimilarItem = { href: string; title: string; subtitle: string; match: number };

export function SimilarCard({ title, items }: { title: string; items: SimilarItem[] }) {
  if (items.length === 0) return null;
  return (
    <SidebarCard title={title}>
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.href} className="pt-2 border-t border-[#fafafa]">
            <Link href={it.href} className="group flex items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="truncate text-[14px] leading-5 font-medium text-[#101828] group-hover:text-[#7150e7]">{it.title}</span>
                <span className="truncate text-[12px] leading-[18px] italic text-[#627181]">{it.subtitle}</span>
              </span>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#ebfdef] text-[12px] leading-4 font-medium italic text-[#1b806a]">
                {it.match}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarCard>
  );
}
