import { describe, expect, it } from 'vitest';
import { PROGRAM_OPPORTUNITIES } from '../../prisma/data/programs';
import { postedLine } from '@/lib/opportunityDetails';

describe('programme listings', () => {
  it('have unique ids, an official https link and a university source', () => {
    const ids = PROGRAM_OPPORTUNITIES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of PROGRAM_OPPORTUNITIES) {
      expect(o.source).toBe('university');
      expect(o.officialUrl).toMatch(/^https:\/\//);
      expect(o.sourceUrl).toBe(o.officialUrl);
      expect(o.degreeLevels.length).toBe(1);
      expect(o.fundingTags).toEqual([]);
    }
  });

  it('carry a subject tag so the Subject filter finds them (HCI / UX / Human Factors)', () => {
    for (const o of PROGRAM_OPPORTUNITIES) expect(o.subjectTags.length, o.title).toBeGreaterThan(0);
    const tags = new Set(PROGRAM_OPPORTUNITIES.flatMap((o) => o.subjectTags));
    expect(tags).toContain('Human-Computer Interaction (HCI)');
    expect(tags).toContain('UX & Product Design');
    expect(tags).toContain('Human Factors');
  });

  it('only checked programmes carry fee / deadline details; the rest point to the official page', () => {
    for (const o of PROGRAM_OPPORTUNITIES) {
      if (o.positionDetails.length === 0) expect(o.content).toContain('official programme page');
    }
    expect(PROGRAM_OPPORTUNITIES.filter((o) => o.deadline).map((o) => o.id)).toEqual(['prog_iowa_state_hci']);
  });

  it('read as a programme listing, not a post', () => {
    expect(postedLine(PROGRAM_OPPORTUNITIES[0], new Date('2026-10-10T00:00:00Z').getTime())).toBe('Programme listing · checked 1 day ago');
  });
});
