import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FEED_LIMIT, toResearchPaper } from '@/lib/researchPapers';
/** Most ids one `?ids=` request may ask for */
const MAX_IDS = 200;

// Papers from the database. Without `ids`: the Research Paper tab, newest year first, then most cited, at most FEED_LIMIT.
// With `?ids=a,b`: just those papers (the Saved and Profile pages), so a saved paper outside the tab's list still shows.
export async function GET(request: Request) {
  const idsParam = new URL(request.url).searchParams.get('ids');
  try {
    const ids = idsParam?.split(',').filter(Boolean).slice(0, MAX_IDS);
    if (ids && ids.length === 0) return NextResponse.json({ success: true, source: 'database', count: 0, data: [] });
    const rows = await prisma.researchPaper.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      take: ids ? undefined : FEED_LIMIT,
      include: { authors: { orderBy: { position: 'asc' } } },
      orderBy: [{ year: { sort: 'desc', nulls: 'last' } }, { citationCount: 'desc' }, { id: 'asc' }],
    });
    const data = rows.map(toResearchPaper);
    return NextResponse.json({ success: true, source: 'database', count: data.length, data });
  } catch (error) {
    console.error('[research/papers] database read failed', error);
    return NextResponse.json({ success: false, error: 'Papers are unavailable right now', data: [] }, { status: 503 });
  }
}
