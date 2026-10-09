import { describe, expect, it } from 'vitest';
import { blueskyToPost } from '@/lib/ingest/bluesky';
import { postToOpportunity } from '@/lib/ingest/mastodon';

const now = new Date('2026-10-09T00:00:00Z');
const bsky = (text: string, createdAt = '2026-09-27T10:00:00Z') => ({
  uri: 'at://did:plc:abc/app.bsky.feed.post/3mwc2jnup2d2z',
  indexedAt: createdAt,
  author: { did: 'did:plc:abc', handle: 'hcilab.bsky.social', displayName: 'HCI Lab', avatar: 'https://cdn.example/a.jpg' },
  record: {
    text,
    createdAt,
    facets: [
      { index: { byteStart: 0, byteEnd: 1 }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://uni.example/jobs/42' }] },
      { index: { byteStart: 0, byteEnd: 1 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'HCI' }] },
    ],
  },
});

describe('Bluesky post parsing', () => {
  it('turns an HCI PhD ad into a Bluesky listing with its link, tags and post URL', () => {
    const o = postToOpportunity(
      blueskyToPost(bsky("Universität Hamburg's Human-Computer Interaction Group is recruiting a PhD Researcher for a fully funded position. Apply by 31 October 2026 <here>.")),
      now,
      'bluesky',
    )!;
    expect(o.source).toBe('bluesky');
    expect(o.id.startsWith('bluesky_')).toBe(true);
    expect(o.sourceUrl).toBe('https://bsky.app/profile/hcilab.bsky.social/post/3mwc2jnup2d2z');
    expect(o.officialUrl).toBe('https://uni.example/jobs/42');
    expect(o.country).toBe('Germany');
    expect(o.subjectTags).toContain('Human-Computer Interaction (HCI)');
    expect(o.content).toContain('<here>');
  });

  it('skips posts that are not student position ads or are too old', () => {
    expect(postToOpportunity(blueskyToPost(bsky('Great talk today about human-computer interaction and the future of design research!')), now, 'bluesky')).toBeNull();
    expect(
      postToOpportunity(blueskyToPost(bsky('We are recruiting PhD students in HCI, apply now through the department portal please.', '2025-12-01T00:00:00Z')), now, 'bluesky'),
    ).toBeNull();
  });
});
