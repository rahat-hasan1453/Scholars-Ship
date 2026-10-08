'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Professor } from '@/types';
import { useApp } from '@/context/AppContext';
import { useProfessorBookmarks } from '@/hooks/useOpportunityBookmarks';
import { countryFlagEmoji } from '@/lib/scholarshipDetails';
import {
  degreesOffered,
  isRecentlyFunded,
  glanceRows,
  locationLine,
  lookingForRows,
  matchBreakdown,
  matchScore,
  shortName,
  similarFaculty,
  updatedLine,
  websiteLabel,
} from '@/lib/professorDetails';
import { DetailPageShell } from '@/components/details/DetailPageShell';
import {
  ActionCard,
  AskAiCard,
  ChipList,
  CheckList,
  DetailHeader,
  DetailSection,
  DetailText,
  ExpandableText,
  FactsGrid,
  MatchCard,
  SimilarCard,
  StepList,
  ValueRows,
  type ChipTone,
} from '@/components/details/DetailParts';

interface Props {
  professor: Professor;
  /** Other faculty, used for "Similar faculty" */
  others: Professor[];
}

// Non-breaking spaces keep the Figma "  ·  " gaps between papers
const PAPER_GAP = '  ·  ';

// Figma: Faculty & Research Labs details page (258:3503)
export const ProfessorDetailsView: React.FC<Props> = ({ professor: p, others }) => {
  const router = useRouter();
  const { profile, outreachRecords, saveProfessorToOutreach } = useApp();
  const { bookmarks, toggleBookmark } = useProfessorBookmarks();
  const saved = bookmarks.has(p.id);
  const tracked = outreachRecords.some((r) => r.professorId === p.id);

  const match = matchScore(p, profile);
  const degrees = degreesOffered(p);
  const nextIntake = p.acceptingTerms[0];
  const person = shortName(p.name);
  const similar = useMemo(() => similarFaculty(p, others, profile), [p, others, profile]);
  const glance = glanceRows(p);

  const meta = [`${countryFlagEmoji(p.country)} ${p.country}`.trim(), updatedLine(p.updatedAt)].filter(Boolean).join(' · ');
  const chips: { label: string; tone?: ChipTone }[] = [
    { label: `${match}% Match`, tone: 'success' },
    { label: degrees.join(' · ') },
  ];
  if (p.fundingType) chips.push({ label: p.fundingType === 'PARTIAL' ? '$ Partially Funded' : '$ Funded Positions' });
  if (p.openPositions) chips.push({ label: '● Accepting Students', tone: 'live' });
  else if (isRecentlyFunded(p)) chips.push({ label: '$ Recently Funded', tone: 'success' });

  const website = p.labWebsite;
  const papers = p.recentPapers ?? [];
  const paperLine = papers
    .map((x) => [x.title, [x.venue, x.year].filter(Boolean).join(' ')].filter(Boolean).join(' — '))
    .join(PAPER_GAP);
  const contactHref = p.email ? `mailto:${p.email}` : website || p.googleScholar || p.linkedInUrl || '#';

  const main = (
    <>
      <DetailHeader
        eyebrow={p.school ? `${p.university} · ${p.school}` : p.university}
        meta={meta}
        avatarUrl={p.avatarUrl}
        title={p.labName ? `${p.name} — ${p.labName}` : p.name}
        chips={chips}
      />
      <FactsGrid
        facts={[
          { icon: '👤', label: 'Title', value: p.title },
          { icon: '🏛', label: 'Department', value: p.department },
          { icon: '💰', label: 'Funding Source', value: p.fundingSource ?? '—' },
          { icon: '🗓', label: 'Next Intake', value: nextIntake ?? '—' },
          { icon: '📍', label: 'Location', value: locationLine(p) },
          website
            ? { icon: '🌐', label: 'Lab Website', value: websiteLabel(website), href: website }
            : { icon: '🌐', label: 'Lab Website', value: '—' },
        ]}
      />
      {p.researchTags.length > 0 && (
        <DetailSection label="Research Areas">
          <ChipList items={p.researchTags} />
        </DetailSection>
      )}
      {p.bio && (
        <DetailSection label="About">
          <ExpandableText text={p.bio} />
        </DetailSection>
      )}
      {glance.length > 0 && (
        <DetailSection label="Lab at a Glance">
          <ValueRows rows={glance} />
        </DetailSection>
      )}
      <DetailSection label="What They Look For">
        <CheckList rows={lookingForRows(p, profile)} />
      </DetailSection>
      <DetailSection label="Recent Papers">
        {papers.length > 0 ? (
          <DetailText>{paperLine}</DetailText>
        ) : (
          <ExpandableText
            text="No papers in our library yet."
            link={{
              label: 'View publications on Google Scholar ↗',
              href: p.googleScholar || `https://scholar.google.com/scholar?q=${encodeURIComponent(p.name)}`,
            }}
          />
        )}
      </DetailSection>
      {p.contactSteps && p.contactSteps.length > 0 && (
        <DetailSection label="How to Contact">
          <StepList steps={p.contactSteps} />
        </DetailSection>
      )}
    </>
  );

  const sidebar = (
    <>
      <ActionCard
        title={`Contact ${person}`}
        note={
          p.openPositions
            ? `● Accepting ${degrees[0] ?? 'PhD'} students${nextIntake ? ` for ${nextIntake}` : ''}`
            : p.openPositions === false
              ? 'Not taking new students right now'
              : isRecentlyFunded(p)
                ? `New ${p.recentGrant!.year} grant: a good time to ask about openings`
                : 'Hiring status not published: ask about openings in your email'
        }
        noteTone={p.openPositions || (p.openPositions === undefined && isRecentlyFunded(p)) ? 'success' : 'warning'}
        primary={{ label: p.email ? 'Email Professor' : 'Visit Lab Website', href: contactHref }}
        secondary={[
          { label: saved ? '🔖 Saved' : '🔖 Save', onClick: () => toggleBookmark(p.id), pressed: saved },
          {
            label: tracked ? '✓ In Pipeline' : '+ Track in Pipeline',
            onClick: () => {
              saveProfessorToOutreach(p);
              router.push('/?tab=tracker');
            },
          },
        ]}
      />
      <MatchCard score={match} rows={matchBreakdown(p, profile)} />
      <AskAiCard
        prompts={[
          'Am I a good fit for this lab?',
          `Write a cold email to ${person}`,
          'Which of their papers should I read?',
          'Suggest research questions',
        ]}
      />
      <SimilarCard
        title="Similar faculty"
        items={similar.map((it) => ({ ...it, href: `/professors/${it.id}` }))}
      />
    </>
  );

  return (
    <DetailPageShell
      activeTab="professors"
      back={{ href: '/?tab=professors', label: 'Back to Faculty & Research Labs' }}
      onSave={() => toggleBookmark(p.id)}
      saved={saved}
      main={main}
      sidebar={sidebar}
    />
  );
};
