'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ChevronRight, Download, ExternalLink } from 'lucide-react';
import type { Opportunity, Professor, ResearchPaper, Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { useOpportunityBookmarks, useProfessorBookmarks } from '@/hooks/useOpportunityBookmarks';
import { calculateMatchScore } from '@/lib/utils';
import { INSTITUTION_NOT_STATED, countryFlagSrc, countryShortLabel, matchScore as opportunityMatch } from '@/lib/opportunityDetails';
import { isRecentlyFunded, matchScore as professorMatch } from '@/lib/professorDetails';
import { relevance } from '@/lib/researchPapers';
import { initialsAvatar } from '@/lib/initialsAvatar';
import {
  CountryCell,
  DeadlineCell,
  FeedTable,
  MatchPill,
  Pill,
  TitleCell,
  deadlineGroup,
  tableActionClass,
  type FeedColumn,
} from '@/components/feed/FeedTable';

// List views for the four feeds, all built on FeedTable (shadcn Table).

function SaveButton({ saved, label, onClick }: { saved: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? `Remove ${label} from saved` : `Save ${label}`} className={tableActionClass}>
      <Bookmark aria-hidden className="size-4" strokeWidth={1.5} fill={saved ? '#7150e7' : 'none'} color={saved ? '#7150e7' : 'currentColor'} />
    </button>
  );
}

function ExternalAction({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={tableActionClass}>
      <ExternalLink aria-hidden className="size-4" strokeWidth={1.5} />
    </a>
  );
}

function OpenAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className={tableActionClass}>
      <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
    </Link>
  );
}

const actionsCol = 'w-[112px] text-right';
const Actions = ({ children }: { children: React.ReactNode }) => <div className="flex items-center justify-end gap-1">{children}</div>;

// Funding tags also hold filter-only values such as "Safe Regional"; show the one that describes the money
const fundingLabel = (o: Opportunity) =>
  o.fundingTags.find((t) => /fund|assistant|waiver|stipend/i.test(t)) ?? (fundingTone(o.funding) === 'success' ? 'Funded' : 'Partial');

const fundingTone = (s: string) => (/full|waiver|100%/i.test(s) ? 'success' : /partial/i.test(s) ? 'warning' : 'neutral');

/* ---------------- Opportunity Feed ---------------- */

export function OpportunityTable({ rows }: { rows: Opportunity[] }) {
  const { profile } = useApp();
  const { bookmarks, toggleBookmark } = useOpportunityBookmarks();
  const columns: FeedColumn<Opportunity>[] = [
    { key: 'name', header: 'University / Subject', cell: (o) => <TitleCell title={o.institution === INSTITUTION_NOT_STATED ? o.title : o.institution} subtitle={o.fieldTags.slice(0, 2).join(', ')} />, sortValue: (o) => o.institution },
    { key: 'country', header: 'Country', cell: (o) => <CountryCell flagSrc={countryFlagSrc(o.country)} label={countryShortLabel(o.country)} />, hideBelow: 'md' },
    { key: 'funding', header: 'Funding', cell: (o) => <Pill tone={fundingTone(o.funding)}>{fundingLabel(o)}</Pill>, hideBelow: 'lg' },
    { key: 'admission', header: 'Admission', cell: (o) => <span className="block max-w-[220px] truncate text-[#627181]" title={o.admission}>{o.admission ?? '—'}</span>, hideBelow: 'xl' },
    { key: 'accept', header: 'Accept.', cell: (o) => (o.acceptanceRate === undefined ? '—' : `${o.acceptanceRate}%`), sortValue: (o) => o.acceptanceRate ?? -1, hideBelow: 'lg' },
    { key: 'deadline', header: 'Deadline', cell: (o) => <DeadlineCell iso={o.deadline} />, sortValue: (o) => (o.deadline ? new Date(o.deadline).getTime() : Number.MAX_SAFE_INTEGER), hideBelow: 'md' },
    { key: 'match', header: 'Match', cell: (o) => <MatchPill value={opportunityMatch(o, profile)} />, sortValue: (o) => opportunityMatch(o, profile) },
    {
      key: 'actions', header: '', className: actionsCol, cell: (o) => (
        <Actions>
          <SaveButton saved={bookmarks.has(o.id)} label={o.institution} onClick={() => toggleBookmark(o.id)} />
          <ExternalAction href={o.officialUrl ?? o.sourceUrl} label={`${o.institution} official link`} />
          <OpenAction href={`/opportunities/${o.id}`} label={`Explore ${o.institution}`} />
        </Actions>
      ),
    },
  ];
  return (
    <FeedTable
      caption="Opportunities"
      rows={rows}
      columns={columns}
      getKey={(o) => o.id}
      getRowLabel={(o) => o.institution}
      getHref={(o) => `/opportunities/${o.id}`}
      groupBy={(o) => deadlineGroup(o.deadline)}
      defaultSort={{ key: 'deadline', dir: 'asc' }}
    />
  );
}

/* ---------------- Scholarship Radar ---------------- */

export function ScholarshipTable({ rows }: { rows: Scholarship[] }) {
  const { profile, applications, saveScholarshipToTracker } = useApp();
  const tracked = new Set(applications.map((a) => a.scholarshipId));
  const country = (s: Scholarship) => s.countries?.[0] || 'Global';
  const columns: FeedColumn<Scholarship>[] = [
    { key: 'name', header: 'Scholarship / Provider', cell: (s) => <TitleCell title={s.title} subtitle={s.provider} />, sortValue: (s) => s.title },
    { key: 'country', header: 'Country', cell: (s) => <CountryCell flagSrc={countryFlagSrc(country(s))} label={countryShortLabel(country(s))} />, hideBelow: 'md' },
    { key: 'funding', header: 'Funding', cell: (s) => <Pill tone={s.fundingType === 'FULL' ? 'success' : 'warning'}>{s.fundingType === 'FULL' ? 'Fully Funded' : 'Partial'}</Pill>, hideBelow: 'lg' },
    { key: 'degree', header: 'Degree', cell: (s) => s.degreeLevels?.join(', ') || '—', hideBelow: 'xl' },
    { key: 'deadline', header: 'Deadline', cell: (s) => <DeadlineCell iso={s.deadline} estimated={s.deadlineEstimated} />, sortValue: (s) => new Date(s.deadline).getTime(), hideBelow: 'md' },
    { key: 'match', header: 'Match', cell: (s) => <MatchPill value={calculateMatchScore(s, profile)} />, sortValue: (s) => calculateMatchScore(s, profile) },
    {
      key: 'actions', header: '', className: actionsCol, cell: (s) => (
        <Actions>
          <SaveButton saved={tracked.has(s.id)} label={s.title} onClick={() => saveScholarshipToTracker(s)} />
          <ExternalAction href={s.officialUrl} label={`${s.title} official link`} />
          <OpenAction href={`/scholarships/${s.id}`} label={`Explore ${s.title}`} />
        </Actions>
      ),
    },
  ];
  return (
    <FeedTable
      caption="Scholarships"
      rows={rows}
      columns={columns}
      getKey={(s) => s.id}
      getRowLabel={(s) => s.title}
      getHref={(s) => `/scholarships/${s.id}`}
      groupBy={(s) => deadlineGroup(s.deadline, s.deadlineEstimated)}
      defaultSort={{ key: 'deadline', dir: 'asc' }}
    />
  );
}

/* ---------------- Faculty & Research Labs ---------------- */


export function FacultyTable({ rows }: { rows: Professor[] }) {
  const { profile } = useApp();
  const { bookmarks, toggleBookmark } = useProfessorBookmarks();
  const site = (p: Professor) => p.labWebsite || p.googleScholar || `https://www.google.com/search?q=${encodeURIComponent(`${p.name} ${p.university}`)}`;
  const columns: FeedColumn<Professor>[] = [
    {
      key: 'name', header: 'Professor / University', sortValue: (p) => p.name,
      cell: (p) => (
        <TitleCell
          title={p.name}
          subtitle={`${p.title} · ${p.university}`}
          leading={<img src={p.avatarUrl || initialsAvatar(p.name)} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />}
        />
      ),
    },
    { key: 'country', header: 'Country', cell: (p) => <CountryCell flagSrc={countryFlagSrc(p.country)} label={countryShortLabel(p.country)} />, hideBelow: 'md' },
    { key: 'lab', header: 'Lab', cell: (p) => <span className="block max-w-[220px] truncate" title={p.labName || p.department}>{p.labName || p.department}</span>, hideBelow: 'xl' },
    { key: 'funding', header: 'Funding', cell: (p) => <Pill tone={p.fundingType === 'PARTIAL' ? 'warning' : 'success'}>{p.fundingType === 'PARTIAL' ? 'Partial' : 'Fully Funded'}</Pill>, hideBelow: 'lg' },
    { key: 'open', header: 'Positions', cell: (p) =>
        p.openPositions ? (
          <Pill tone="success">Open</Pill>
        ) : p.openPositions === false ? (
          <span className="text-[#627181]">Closed</span>
        ) : isRecentlyFunded(p) ? (
          <Pill tone="success">Recently funded</Pill>
        ) : (
          <span className="text-[#627181]">—</span>
        ),
      sortValue: (p) => (p.openPositions ? 2 : isRecentlyFunded(p) ? 1 : 0), hideBelow: 'md' },
    { key: 'match', header: 'Match', cell: (p) => <MatchPill value={professorMatch(p, profile)} />, sortValue: (p) => professorMatch(p, profile) },
    {
      key: 'actions', header: '', className: actionsCol, cell: (p) => (
        <Actions>
          <SaveButton saved={bookmarks.has(p.id)} label={p.name} onClick={() => toggleBookmark(p.id)} />
          <ExternalAction href={site(p)} label={`${p.name} lab website`} />
          <OpenAction href={`/professors/${p.id}`} label={`Explore ${p.name}`} />
        </Actions>
      ),
    },
  ];
  return (
    <FeedTable
      caption="Faculty and research labs"
      rows={rows}
      columns={columns}
      getKey={(p) => p.id}
      getRowLabel={(p) => p.name}
      getHref={(p) => `/professors/${p.id}`}
      defaultSort={{ key: 'match', dir: 'desc' }}
    />
  );
}

/* ---------------- Research Papers ---------------- */

export function ResearchPaperTable({ rows, onOpen }: { rows: ResearchPaper[]; onOpen: (p: ResearchPaper) => void }) {
  const { profile, toggleSavePaper, isPaperSaved } = useApp();
  const pdf = (p: ResearchPaper) => p.pdfUrl || p.semanticScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(p.title)}`;
  const columns: FeedColumn<ResearchPaper>[] = [
    { key: 'title', header: 'Paper / Authors', cell: (p) => <TitleCell title={p.title} subtitle={p.authors.map((a) => a.name).join(', ')} />, sortValue: (p) => p.title },
    { key: 'venue', header: 'Venue', cell: (p) => {
      const v = p.venueShort || p.venue;
      return v.includes(String(p.year)) ? v : `${v} ${p.year}`;
    }, sortValue: (p) => p.year, hideBelow: 'md' },
    { key: 'citations', header: 'Citations', cell: (p) => p.citationCount.toLocaleString('en-US'), sortValue: (p) => p.citationCount, hideBelow: 'lg' },
    {
      key: 'topics', header: 'Topics', hideBelow: 'xl',
      cell: (p) => (
        <div className="flex gap-1">
          {[...p.fieldsOfStudy, ...p.tags].slice(0, 2).map((t) => (
            <Pill key={t}>
              <span className="block max-w-[120px] truncate">{t}</span>
            </Pill>
          ))}
        </div>
      ),
    },
    { key: 'match', header: 'Match', cell: (p) => <MatchPill value={relevance(p, profile)} />, sortValue: (p) => relevance(p, profile) ?? -1 },
    {
      key: 'actions', header: '', className: actionsCol, cell: (p) => (
        <Actions>
          <SaveButton saved={isPaperSaved(p.id)} label={p.title} onClick={() => toggleSavePaper(p.id)} />
          <a href={pdf(p)} target="_blank" rel="noopener noreferrer" aria-label={`Download ${p.title}`} className={tableActionClass}>
            <Download aria-hidden className="size-4" strokeWidth={1.5} />
          </a>
          <button type="button" onClick={() => onOpen(p)} aria-label={`See more about ${p.title}`} className={tableActionClass}>
            <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        </Actions>
      ),
    },
  ];
  return (
    <FeedTable
      caption="Research papers"
      rows={rows}
      columns={columns}
      getKey={(p) => p.id}
      getRowLabel={(p) => p.title}
      onOpen={onOpen}
      defaultSort={{ key: 'citations', dir: 'desc' }}
    />
  );
}
