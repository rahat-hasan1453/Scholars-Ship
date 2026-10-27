import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RorMatch } from '@/lib/ingest/ror';
import { postToOpportunity } from '@/lib/ingest/mastodon';
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED } from '@/lib/opportunityDetails';
import { rorFill } from '../../prisma/import/rorBackfill';

const matchInstitution = vi.hoisted(() => vi.fn<(text: string) => RorMatch | undefined>());
vi.mock('@/lib/ingest/ror', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ingest/ror')>()),
  matchInstitution,
}));

const now = new Date('2026-10-09T00:00:00Z');
const post = (content: string) => ({
  id: '1',
  uri: 'https://example.social/users/lab/statuses/1',
  url: 'https://example.social/@lab/1',
  created_at: '2026-10-01T10:00:00Z',
  content: `<p>${content}</p>`,
  language: 'en',
  account: { display_name: 'Some Lab', username: 'lab', acct: 'lab@example.social', avatar: '', url: '' },
  tags: [],
});
const bremen: RorMatch = { rorId: 'https://ror.org/04ers2y35', name: 'University of Bremen', country: 'Germany', city: 'Bremen' };

describe('ROR in ingest', () => {
  beforeEach(() => { matchInstitution.mockReset(); });

  it('takes institution and country from ROR when the post states no country', () => {
    matchInstitution.mockReturnValue(bremen);
    const o = postToOpportunity(post('Open PhD position at Uni Bremen in machine learning for robust perception. Please apply by 31 December 2026.'), now)!;
    expect(o).toMatchObject({ institution: 'University of Bremen', country: 'Germany', countrySource: 'ror', rorId: bremen.rorId, city: 'Bremen' });
  });

  it('keeps the country the post states over the ROR one', () => {
    matchInstitution.mockReturnValue(bremen);
    const o = postToOpportunity(post('Open PhD position in Amsterdam, Netherlands, in machine learning for robust perception. Please apply by 31 December 2026.'), now)!;
    expect(o).toMatchObject({ country: 'Netherlands', countrySource: 'post', institution: 'University of Bremen' });
    expect(o.city).toBeUndefined();
  });

  it('falls back to the old regexes when ROR finds nothing', () => {
    matchInstitution.mockReturnValue(undefined);
    const o = postToOpportunity(post('Open PhD position at Heidelberg University in machine learning for robust perception. Please apply by 31 December 2026.'), now)!;
    expect(o).toMatchObject({ institution: 'Heidelberg University', country: 'Germany', countrySource: 'post' });
    expect(o.rorId).toBeUndefined();
  });

  it('does not crash when the ROR index is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    matchInstitution.mockImplementation(() => {
      throw new Error('ENOENT: no such file');
    });
    const o = postToOpportunity(post('Open PhD position in machine learning for robust perception models. Please apply by 31 December 2026.'), now)!;
    expect(o).toMatchObject({ institution: INSTITUTION_NOT_STATED, country: LOCATION_NOT_STATED });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('ROR backfill', () => {
  const empty = { id: 'x', country: LOCATION_NOT_STATED, institution: INSTITUTION_NOT_STATED, rorId: null };

  it('fills only empty fields', () => {
    expect(rorFill(empty, bremen)).toEqual({ country: 'Germany', countrySource: 'ror', institution: 'University of Bremen', rorId: bremen.rorId });
  });

  it('never changes a value already there', () => {
    const full = { id: 'x', country: 'France', institution: 'Sorbonne University', rorId: 'https://ror.org/abc' };
    expect(rorFill(full, bremen)).toBeUndefined();
    expect(rorFill({ ...empty, country: 'France' }, bremen)).toEqual({ institution: 'University of Bremen', rorId: bremen.rorId });
  });

  it('leaves the country empty when ROR has none, and does nothing without a match', () => {
    expect(rorFill(empty, { ...bremen, country: undefined })).toEqual({ institution: 'University of Bremen', rorId: bremen.rorId });
    expect(rorFill(empty, undefined)).toBeUndefined();
  });
});
