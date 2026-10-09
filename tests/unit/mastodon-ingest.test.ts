import { describe, expect, it } from 'vitest';
import { countryFor, deadlineFor, fundingFor, institutionFor, postToOpportunity } from '@/lib/ingest/mastodon';
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED } from '@/lib/opportunityDetails';
import { initials, initialsAvatar } from '@/lib/initialsAvatar';

const now = new Date('2026-10-09T00:00:00Z');
const post = (content: string, created_at = '2026-10-01T10:00:00Z') => ({
  id: '1',
  uri: 'https://example.social/users/lab/statuses/1',
  url: 'https://example.social/@lab/1',
  created_at,
  content,
  language: 'en',
  account: { display_name: 'Some Lab', username: 'lab', acct: 'lab@example.social', avatar: '', url: '' },
  tags: [],
});

describe('Mastodon post parsing', () => {
  it('reads deadlines in the common formats and ignores past or far-off dates', () => {
    const posted = new Date('2026-09-01T00:00:00Z');
    expect(deadlineFor('Deadline: 15 October 2026', posted)?.slice(0, 10)).toBe('2026-10-15');
    expect(deadlineFor('Please apply by Nov 3, 2026.', posted)?.slice(0, 10)).toBe('2026-11-03');
    expect(deadlineFor('Applications until 30.10.2026', posted)?.slice(0, 10)).toBe('2026-10-30');
    expect(deadlineFor('Deadline: 1 January 2020', posted)).toBeUndefined();
    expect(deadlineFor('We met on 15 October 2026', posted)).toBeUndefined();
  });

  it('finds institutions, places and funding only when the post states them', () => {
    expect(institutionFor('Open PhD position at Heidelberg University in cell biology')).toBe('Heidelberg University');
    expect(institutionFor('Join TU Braunschweig for a PhD')).toBe('TU Braunschweig');
    expect(institutionFor('A PhD in our lab, apply now')).toBeUndefined();
    expect(countryFor('based in Amsterdam')).toBe('Netherlands');
    expect(countryFor('somewhere nice')).toBeUndefined();
    expect(fundingFor('This is a fully funded 4-year PhD position.')).toMatch(/^fully funded 4-year PhD position/);
    expect(fundingFor('A PhD position in physics.')).toBeUndefined();
  });

  it('turns a PhD ad into a listing and leaves unknown facts unset', () => {
    const o = postToOpportunity(post('<p>Open PhD position in machine learning for robust perception models. Please apply by 31 December 2026.</p>'), now)!;
    expect(o.degreeLevels).toEqual(['PhD']);
    expect(o.institution).toBe(INSTITUTION_NOT_STATED);
    expect(o.country).toBe(LOCATION_NOT_STATED);
    expect(o.deadline?.slice(0, 10)).toBe('2026-12-31');
    expect(o.fundingTags).toEqual([]);
    expect(o.acceptanceRate).toBeUndefined();
    expect(o.rankRange).toBeUndefined();
    expect(o.subjectTags).toContain('Machine Learning');
  });

  it('skips postdoc and faculty ads, old posts and closed positions', () => {
    expect(postToOpportunity(post('<p>Postdoc position available in our lab. PhD required. Apply now!</p>'), now)).toBeNull();
    expect(postToOpportunity(post('<p>Open PhD position in physics, apply now at our institute please.</p>', '2025-01-01T00:00:00Z'), now)).toBeNull();
    expect(postToOpportunity(post('<p>Open PhD position in physics. Deadline: 5 October 2026. Apply now.</p>'), now)).toBeNull();
  });
});

describe('initials avatar', () => {
  it('uses first and last initials and skips titles', () => {
    expect(initials('Dr. Jodi Forlizzi')).toBe('JF');
    expect(initials('Madonna')).toBe('M');
    expect(initialsAvatar('Jodi Forlizzi')).toMatch(/^data:image\/svg\+xml;utf8,/);
  });
});
