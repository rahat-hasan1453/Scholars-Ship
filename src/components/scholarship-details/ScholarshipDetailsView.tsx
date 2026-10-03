'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateMatchScore } from '@/lib/utils';
import {
  countryFlagEmoji,
  daysUntil,
  eligibilityRows,
  formatDeadline,
  matchBreakdown,
  similarScholarships,
} from '@/lib/scholarshipDetails';
import { DetailPageShell } from '@/components/details/DetailPageShell';
import {
  ActionCard,
  AskAiCard,
  ChipList,
  CheckList,
  DetailHeader,
  DetailSection,
  ExpandableText,
  FactsGrid,
  MatchCard,
  SimilarCard,
  StepList,
  ValueRows,
  type ChipTone,
} from '@/components/details/DetailParts';

interface Props {
  scholarship: Scholarship;
  /** Other listings, used for "Similar scholarships" */
  others: Scholarship[];
}

function addedAgo(iso?: string): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Added today';
  return days === 1 ? 'Added 1 day ago' : `Added ${days} days ago`;
}

// Figma: Scholarship Radar details page (249:2596)
export const ScholarshipDetailsView: React.FC<Props> = ({ scholarship: s, others }) => {
  const router = useRouter();
  const { profile, applications, saveScholarshipToTracker } = useApp();
  const saved = applications.some((a) => a.scholarshipId === s.id);
  const match = calculateMatchScore(s, profile);
  const country = s.countries[0] ?? 'Global';
  const left = daysUntil(s.deadline);
  const deadline = formatDeadline(s.deadline);
  const funded = s.fundingType === 'FULL' ? 'Fully Funded' : 'Partial Funding';

  const similar = useMemo(() => similarScholarships(s, others, profile), [s, others, profile]);
  const deadlineChip: { label: string; tone: ChipTone } =
    left > 0 ? { label: `⏰ Deadline in ${left} day${left === 1 ? '' : 's'}`, tone: 'warning' } : { label: 'Deadline passed', tone: 'warning' };

  const keywords = [...new Set([...s.specializations, ...s.tags])].slice(0, 8);
  const meta = [`${countryFlagEmoji(country)} ${country}`.trim(), addedAgo(s.createdAt)].filter(Boolean).join('  ·  ');
  const save = () => saveScholarshipToTracker(s);

  const main = (
    <>
      <DetailHeader
        eyebrow={s.provider}
        meta={meta}
        title={s.title}
        chips={[
          { label: `${match}% Match`, tone: 'success' },
          { label: s.degreeLevels[0] ?? 'Masters' },
          { label: `$ ${funded}` },
          deadlineChip,
        ]}
      />
      <FactsGrid
        facts={[
          { icon: '🎓', label: 'Degree Level', value: s.degreeLevels.join(', ') },
          { icon: '📚', label: 'Field of Study', value: s.fieldOfStudy ?? '—' },
          { icon: '💰', label: 'Funding', value: funded },
          { icon: '🗓', label: 'Deadline', value: deadline },
          { icon: '🌍', label: 'Country', value: s.countries.join(', ') },
          { icon: '🏛', label: 'Provider', value: s.providerShort ?? s.provider },
        ]}
      />
      {keywords.length > 0 && (
        <DetailSection label="Keywords">
          <ChipList items={keywords} />
        </DetailSection>
      )}
      <DetailSection label="Overview">
        <ExpandableText text={s.description} />
      </DetailSection>
      {s.fundingBreakdown && s.fundingBreakdown.length > 0 && (
        <DetailSection label="Funding">
          <ValueRows rows={s.fundingBreakdown} />
        </DetailSection>
      )}
      <DetailSection label="Eligibility">
        <CheckList rows={eligibilityRows(s, profile)} />
      </DetailSection>
      {s.livingCost && (
        <DetailSection label="Living Cost">
          <p className="text-[14px] leading-[18px] text-[#101828]">{s.livingCost}</p>
        </DetailSection>
      )}
      {s.applySteps && s.applySteps.length > 0 && (
        <DetailSection label="How to Apply">
          <StepList steps={s.applySteps} />
        </DetailSection>
      )}
    </>
  );

  const sidebar = (
    <>
      <ActionCard
        title="Apply for this scholarship"
        note={left > 0 ? `⏰ Closes ${deadline}  ·  ${left} day${left === 1 ? '' : 's'} left` : `⏰ Closed on ${deadline}`}
        primary={{ label: 'Official Link', href: s.officialUrl }}
        secondary={[
          { label: saved ? '🔖 Saved' : '🔖 Save', onClick: save, pressed: saved },
          {
            label: '+ Track in Pipeline',
            onClick: () => {
              save();
              router.push('/?tab=tracker');
            },
          },
        ]}
      />
      <MatchCard score={match} rows={matchBreakdown(s, profile)} />
      <AskAiCard
        prompts={[
          'Am I eligible for this?',
          'Write my motivation letter',
          `Tailor my CV for ${s.providerShort ?? 'this scholarship'}`,
          'What documents do I need?',
        ]}
      />
      <SimilarCard
        title="Similar scholarships"
        items={similar.map((it) => ({ ...it, href: `/scholarships/${it.id}` }))}
      />
    </>
  );

  return (
    <DetailPageShell
      activeTab="scholarships"
      back={{ href: '/?tab=scholarships', label: 'Back to Scholarship Radar' }}
      onSave={save}
      saved={saved}
      main={main}
      sidebar={sidebar}
    />
  );
};
