'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HiringOpportunity, Opportunity } from '@/types';
import { useApp } from '@/context/AppContext';
import { useOpportunityBookmarks } from '@/hooks/useOpportunityBookmarks';
import { countryFlagEmoji, daysUntil, formatDeadline } from '@/lib/scholarshipDetails';
import {
  eligibilityRows,
  fundingKind,
  isFullyFunded,
  matchBreakdown,
  matchScore,
  postedLine,
  primaryDegree,
  similarOpportunities,
  sourceLabel,
} from '@/lib/opportunityDetails';
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
  opportunity: Opportunity;
  /** Other listings, used for "Similar opportunities" */
  others: Opportunity[];
}

/** "Prof. Dr. Rainer Malaka" → "Prof. Dr. Malaka" */
function shortName(name: string): string {
  const parts = name.split(' ');
  const titles = parts.filter((p) => p.endsWith('.'));
  return [...titles, parts[parts.length - 1]].join(' ');
}

/** The outreach pipeline still stores the older post shape */
function toHiringOpportunity(o: Opportunity): HiringOpportunity {
  return {
    id: o.id,
    authorName: o.authorName,
    authorTitle: o.authorTitle,
    authorAvatar: o.authorAvatar,
    institution: o.institution,
    labName: o.labName,
    source: o.source,
    sourceUrl: o.sourceUrl,
    postedAgo: '',
    postedDate: o.postedAt.slice(0, 10),
    title: o.title,
    content: o.content,
    funding: o.funding,
    degrees: o.degreeLevels,
    fieldTags: o.fieldTags,
    contactEmail: o.contactEmail,
    country: o.country,
    minCgpa: o.minCgpa,
    officialUrl: o.officialUrl,
  };
}

// Figma: Opportunity Feed details page (258:3269)
export const OpportunityDetailsView: React.FC<Props> = ({ opportunity: o, others }) => {
  const router = useRouter();
  const { profile, outreachRecords, saveOpportunityToOutreach } = useApp();
  const { bookmarks, toggleBookmark } = useOpportunityBookmarks();
  const saved = bookmarks.has(o.id);
  const tracked = outreachRecords.some((r) => r.opportunityId === o.id);

  const match = matchScore(o, profile);
  const left = o.deadline ? daysUntil(o.deadline) : null;
  const deadline = o.deadline ? formatDeadline(o.deadline) : null;
  const similar = useMemo(() => similarOpportunities(o, others, profile), [o, others, profile]);

  const deadlineChip: { label: string; tone: ChipTone } | null =
    left === null
      ? null
      : left > 0
        ? { label: `⏰ Apply by ${deadline}`, tone: 'warning' }
        : { label: 'Applications closed', tone: 'warning' };
  const meta = [`${countryFlagEmoji(o.country)} ${o.country}`.trim(), postedLine(o)].join(' · ');
  const location = [o.city, o.country].filter(Boolean).join(', ');
  const contactHref = o.contactEmail ? `mailto:${o.contactEmail}` : o.sourceUrl;
  const person = shortName(o.authorName);

  const main = (
    <>
      <DetailHeader
        eyebrow={`${o.authorName} · ${o.institution}`}
        meta={meta}
        title={o.title}
        chips={[
          { label: `${match}% Match`, tone: 'success' },
          { label: primaryDegree(o.degreeLevels) },
          ...(o.fundingTags.length ? [{ label: isFullyFunded(o) ? '$ Fully Funded' : '$ Funded' }] : []),
          ...(deadlineChip ? [deadlineChip] : []),
        ]}
      />
      <FactsGrid
        facts={[
          { icon: '💼', label: 'Position Type', value: o.positionType ?? o.degreeLevels.map((d) => (d === 'PhD' ? 'PhD position' : `${d} position`)).join(' / ') },
          { icon: '📚', label: 'Research Area', value: o.fieldTags.slice(0, 2).join(' & ') || 'Not stated' },
          { icon: '💰', label: 'Funding', value: o.source === 'university' ? 'See programme details' : o.fundingTags.length ? fundingKind(o.funding) : 'Not stated' },
          { icon: '🗓', label: 'Start Date', value: o.startDate ?? 'Not stated' },
          { icon: '📍', label: 'Location', value: location },
          { icon: '🔬', label: 'Lab', value: o.labName ?? '—' },
        ]}
      />
      {o.fieldTags.length > 0 && (
        <DetailSection label="Keywords">
          <ChipList items={o.fieldTags} />
        </DetailSection>
      )}
      <DetailSection label={o.source === 'university' ? 'About the programme' : 'Original Post'}>
        <ExpandableText
          text={o.content}
          link={{ label: o.source === 'university' ? 'View the official programme page ↗' : `View original post on ${sourceLabel(o.source)} ↗`, href: o.sourceUrl }}
        />
      </DetailSection>
      {o.positionDetails.length > 0 && (
        <DetailSection label="Position Details">
          <ValueRows rows={o.positionDetails} />
        </DetailSection>
      )}
      <DetailSection label="Eligibility">
        <CheckList rows={eligibilityRows(o, profile)} />
      </DetailSection>
      {o.aboutLab && (
        <DetailSection label="About the Lab">
          <DetailText>{o.aboutLab}</DetailText>
        </DetailSection>
      )}
      {o.applySteps.length > 0 && (
        <DetailSection label="How to Apply">
          <StepList steps={o.applySteps} />
        </DetailSection>
      )}
    </>
  );

  const sidebar = (
    <>
      <ActionCard
        title="Apply for this position"
        note={
          left === null
            ? o.source === 'university'
              ? 'Deadlines depend on the intake; check the official programme page before applying'
              : 'The post gives no deadline; check the original post before applying'
            : left > 0
              ? `⏰ Closes ${deadline}  ·  ${left} day${left === 1 ? '' : 's'} left`
              : `⏰ Closed on ${deadline}`
        }
        primary={{ label: 'Contact Professor', href: contactHref }}
        secondary={[
          { label: saved ? '🔖 Saved' : '🔖 Save', onClick: () => toggleBookmark(o.id), pressed: saved },
          {
            label: tracked ? '✓ In Pipeline' : '+ Track in Pipeline',
            onClick: () => {
              saveOpportunityToOutreach(toHiringOpportunity(o));
              router.push('/?tab=tracker');
            },
          },
        ]}
      />
      <MatchCard score={match} rows={matchBreakdown(o, profile)} />
      <AskAiCard
        prompts={[
          'Am I a good fit for this lab?',
          `Draft an email to ${person}`,
          'Summarise their recent papers',
          'Write my research statement',
        ]}
      />
      <SimilarCard
        title="Similar opportunities"
        items={similar.map((it) => ({ ...it, href: `/opportunities/${it.id}` }))}
      />
    </>
  );

  return (
    <DetailPageShell
      activeTab="opportunities"
      back={{ href: '/?tab=opportunities', label: 'Back to Opportunity Feed' }}
      onSave={() => toggleBookmark(o.id)}
      saved={saved}
      main={main}
      sidebar={sidebar}
    />
  );
};
