import { describe, expect, it } from 'vitest';
import { LEGACY_DEMO_SOURCES, staleDemoOpportunitiesWhere } from '@/lib/opportunities';

describe('seed delete rule for opportunities', () => {
  it('only targets old demo sources and keeps ids that are still in the seed data', () => {
    expect(staleDemoOpportunitiesWhere(['a', 'b'])).toEqual({ id: { notIn: ['a', 'b'] }, source: { in: LEGACY_DEMO_SOURCES } });
  });

  it('never removes live sources', () => {
    for (const live of ['mastodon', 'bluesky', 'university']) expect(LEGACY_DEMO_SOURCES).not.toContain(live);
    for (const demo of ['linkedin', 'twitter', 'lab_website', 'web', 'reddit']) expect(LEGACY_DEMO_SOURCES).toContain(demo);
  });
});
