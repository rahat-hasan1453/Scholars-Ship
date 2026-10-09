import { NextResponse } from 'next/server';
import { fetchMastodonOpportunities } from '@/lib/ingest/mastodon';
import { saveOpportunities } from '@/lib/opportunities';

// Daily refresh of the Opportunity Feed from public Mastodon position posts (scheduled in vercel.json).
// Vercel sends `Authorization: Bearer $CRON_SECRET`; once CRON_SECRET is set, other callers get 401.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const found = await fetchMastodonOpportunities();
    const added = await saveOpportunities(found);
    console.log(`[cron/opportunities] ${found.length} current posts, ${added} new`);
    return NextResponse.json({ success: true, found: found.length, added });
  } catch (error) {
    console.error('[cron/opportunities] import failed', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
