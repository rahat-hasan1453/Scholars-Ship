import { NextResponse } from 'next/server';
import { fetchAllOpportunities } from '@/lib/ingest';
import { saveOpportunities } from '@/lib/opportunities';

// Daily refresh of the Opportunity Feed from public Mastodon and Bluesky position posts (scheduled in vercel.json).
// Vercel sends `Authorization: Bearer $CRON_SECRET`; once CRON_SECRET is set, other callers get 401.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const found = await fetchAllOpportunities();
    const added = await saveOpportunities(found);
    console.log(`[cron/opportunities] ${found.length} current posts, ${added} new`);
    return NextResponse.json({ success: true, found: found.length, added });
  } catch (error) {
    console.error('[cron/opportunities] import failed', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
