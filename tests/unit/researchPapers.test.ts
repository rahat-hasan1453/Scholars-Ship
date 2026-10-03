import { describe, expect, it } from 'vitest';
import type { ResearchPaper } from '@/types';
import {
  authorsSummary,
  leadInstitution,
  metaLine,
  parseFindings,
  publishedLabel,
  relevance,
  topicChips,
  venueLine,
  whyItMatters,
} from '@/lib/researchPapers';

const paper = (over: Partial<ResearchPaper> = {}): ResearchPaper => ({
  id: 'p1',
  title: 'A Paper',
  authors: [
    { name: 'Dr. Sarah Jenkins', institution: 'Stanford University' },
    { name: 'Alex Mercer' },
    { name: 'Prof. Hiroshi Tanaka', institution: 'University of Tokyo' },
  ],
  abstract: 'Abstract',
  publicationDate: '2026-04-10',
  year: 2026,
  venue: 'ACM CHI Conference on Human Factors in Computing Systems (CHI 2026)',
  citationCount: 142,
  fieldsOfStudy: ['UX Design', 'Human-Computer Interaction'],
  tags: ['Prototyping', 'ux design'],
  googleScholarUrl: 'https://scholar.google.com',
  isOpenAccess: true,
  venueShort: 'CHI 2026',
  paperType: 'Conference paper',
  ...over,
});

describe('research paper details helpers', () => {
  it('builds the venue and meta lines from Figma 261:3390', () => {
    expect(venueLine(paper())).toBe('CHI 2026 · ACM CHI Conference on Human Factors in Computing Systems');
    expect(venueLine(paper({ venueShort: undefined, venue: 'Nature Physics' }))).toBe('Nature Physics');
    expect(metaLine(paper())).toBe('📄 Conference paper · Published April 2026');
    expect(metaLine(paper({ paperType: undefined, publicationDate: '', year: 0 }))).toBeUndefined();
  });

  it('formats the published month in UTC', () => {
    expect(publishedLabel(paper({ publicationDate: '2025-01-01' }))).toBe('January 2025');
    expect(publishedLabel(paper({ publicationDate: '', year: 2023 }))).toBe('2023');
  });

  it('summarises authors and picks the lead institution', () => {
    expect(authorsSummary(paper())).toBe('Dr. Sarah Jenkins +2');
    expect(authorsSummary(paper({ authors: [{ name: 'Solo' }] }))).toBe('Solo');
    expect(leadInstitution(paper())).toBe('Stanford University');
    expect(leadInstitution(paper({ institution: 'MIT' }))).toBe('MIT');
  });

  it('lists fields as hashtags, then tags, without duplicates', () => {
    expect(topicChips(paper())).toEqual(['#UX Design', '#Human-Computer Interaction', 'Prototyping']);
  });

  it('relevance is the share of the student interests the paper covers', () => {
    expect(relevance(paper(), { specializations: ['UX Design', 'HCI', 'Robotics', 'Economics'] })).toBe(50);
    expect(relevance(paper(), { specializations: ['Economics'] })).toBeNull();
    expect(relevance(paper(), { specializations: [] })).toBeNull();
  });

  it('why it matters names matched interests and a linked professor, else hides', () => {
    const linked = paper({ authors: [{ name: 'Prof. Hiroshi Tanaka', professorId: 'prof_1' }] });
    expect(whyItMatters(linked, { specializations: ['UX Design'] })).toBe(
      'Matches your interests in UX Design. Prof. Hiroshi Tanaka is in Faculty & Research Labs — see their lab for open positions.',
    );
    expect(whyItMatters(paper(), { specializations: ['Economics'] })).toBeNull();
  });

  it('keeps only well-formed key findings', () => {
    expect(parseFindings(null)).toBeUndefined();
    expect(parseFindings([{ label: 'Speed', text: 't', value: '−38%', met: true }, { label: 'bad' }])).toEqual([
      { label: 'Speed', text: 't', value: '−38%', met: true },
    ]);
    expect(parseFindings([{ label: 'bad' }])).toBeUndefined();
  });
});
