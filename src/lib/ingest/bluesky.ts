// Public Bluesky posts about student positions (HCI-focused searches) → Opportunity Feed listings.
// Uses the public AppView search, no login. It rate-limits bursts, so queries run one at a time.
import type { Opportunity } from '@/types';
import { postToOpportunity, type MastodonPost } from '@/lib/ingest/mastodon';

const SEARCH_URL = 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts';
// HCI / UX and related fields; each is searched as "PhD <topic>" and the shared parser keeps only position ads
const TOPICS = [
  // UX and design
  'UX design', 'user experience', 'interaction design', 'product design', 'service design', 'UX research',
  'user research', 'usability', 'design research', 'human-centered design', 'participatory design', 'co-design',
  'information architecture',
  // HCI fields
  'HCI', 'human-computer interaction', 'CSCW', 'social computing', 'ubiquitous computing', 'pervasive computing',
  'tangible interaction', 'wearable computing', 'human-AI interaction', 'human-centered AI', 'human-robot interaction',
  'conversational agents', 'voice interfaces',
  // visual and immersive
  'information visualization', 'data visualization', 'visual analytics', 'virtual reality', 'augmented reality',
  'mixed reality', 'game design', 'games user research', 'creativity support',
  // people, behaviour, accessibility
  'accessibility', 'inclusive design', 'assistive technology', 'cognitive science', 'human factors', 'ergonomics',
  'behavior change', 'persuasive technology', 'digital health',
  // interfaces and systems
  'interactive systems', 'user interface', 'learning sciences', 'educational technology', 'usable security',
];
const QUERIES = [
  ...TOPICS.map((t) => `PhD ${t}`),
  'recruiting PhD students HCI',
  'HCI lab hiring PhD',
  'PhD position',
  'funded PhD',
  'recruiting PhD students',
  'accepting PhD students',
];
const DELAY_MS = 1000;

type Facet = { index: { byteStart: number; byteEnd: number }; features: { $type: string; uri?: string; tag?: string }[] };
export type BlueskyPost = {
  uri: string;
  indexedAt: string;
  author: { did: string; handle: string; displayName?: string; avatar?: string };
  record: { text?: string; createdAt?: string; facets?: Facet[]; embed?: { external?: { uri?: string } } };
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Bluesky post → the shape the shared post parser reads */
export function blueskyToPost(p: BlueskyPost): MastodonPost {
  const text = p.record.text ?? '';
  const features = (p.record.facets ?? []).flatMap((f) => f.features);
  const links = [
    ...features.filter((f) => f.$type === 'app.bsky.richtext.facet#link' && f.uri).map((f) => f.uri!),
    ...(p.record.embed?.external?.uri ? [p.record.embed.external.uri] : []),
  ];
  const tags = features.filter((f) => f.$type === 'app.bsky.richtext.facet#tag' && f.tag).map((f) => ({ name: f.tag! }));
  const rkey = p.uri.split('/').pop();
  return {
    id: p.uri,
    uri: p.uri,
    url: `https://bsky.app/profile/${p.author.handle}/post/${rkey}`,
    created_at: p.record.createdAt ?? p.indexedAt,
    content: `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>${links.map((u) => `<a href="${escapeHtml(u)}"></a>`).join('')}`,
    language: null,
    account: {
      display_name: p.author.displayName ?? '',
      username: p.author.handle,
      acct: p.author.handle,
      avatar: p.author.avatar ?? '',
      url: `https://bsky.app/profile/${p.author.handle}`,
    },
    tags,
  };
}

async function search(q: string): Promise<BlueskyPost[]> {
  const url = `${SEARCH_URL}?${new URLSearchParams({ q, limit: '100', sort: 'latest' })}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ScholarsShip/1.0 (+opportunity feed)' } });
      if (res.ok) {
        const body = (await res.json()) as { posts?: BlueskyPost[] };
        return Array.isArray(body.posts) ? body.posts : [];
      }
    } catch {}
    await new Promise((r) => setTimeout(r, DELAY_MS * 3));
  }
  return [];
}

/** Current student position ads found by the tracked searches, newest first, one per post */
export async function fetchBlueskyOpportunities(now = new Date()): Promise<Opportunity[]> {
  const byUri = new Map<string, BlueskyPost>();
  for (const q of QUERIES) {
    for (const p of await search(q)) if (p?.uri && !byUri.has(p.uri)) byUri.set(p.uri, p);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return [...byUri.values()]
    .map((p) => postToOpportunity(blueskyToPost(p), now, 'bluesky'))
    .filter((o): o is Opportunity => o !== null)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
