import type { Opportunity } from '@/types';
import { fetchMastodonOpportunities } from '@/lib/ingest/mastodon';
import { fetchBlueskyOpportunities } from '@/lib/ingest/bluesky';

const titleKey = (o: Opportunity) => o.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Every source's current listings, newest first; a post cross-posted to both networks is kept once */
export async function fetchAllOpportunities(now = new Date()): Promise<Opportunity[]> {
  const [mastodon, bluesky] = await Promise.all([fetchMastodonOpportunities(now), fetchBlueskyOpportunities(now)]);
  const seen = new Set<string>();
  return [...mastodon, ...bluesky]
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .filter((o) => {
      const key = `${o.authorName.toLowerCase()}|${titleKey(o)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
