import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchWorks } from '@/lib/papers/openalex';
import { CRON_PAPER_TYPES, MIN_YEAR, savePapers, selectRecentPapers } from '@/lib/papers/save';

// Daily import of our professors' new papers from OpenAlex (scheduled in vercel.json, 30 minutes after the opportunities cron).
// The first run (no cron papers yet) backfills all of MIN_YEAR onwards; later runs look at the last RECENT_DAYS days.
// Vercel sends `Authorization: Bearer $CRON_SECRET`; once CRON_SECRET is set, other callers get 401.
export const maxDuration = 300;

const RECENT_DAYS = 10;
/** Stop starting OpenAlex requests after this long, leaving time to save */
const FETCH_BUDGET_MS = 200_000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const started = Date.now();
    const professors = await prisma.professor.findMany({ where: { openAlexId: { not: null } }, select: { id: true, openAlexId: true } });
    const profByAuthor = new Map(professors.map((p) => [p.openAlexId!, p.id]));

    const backfill = (await prisma.researchPaper.count({ where: { importedBy: 'cron' } })) === 0;
    const recent = new Date(started - RECENT_DAYS * 86_400_000).toISOString().slice(0, 10);
    const fromDate = backfill ? `${MIN_YEAR}-01-01` : [`${MIN_YEAR}-01-01`, recent].sort()[1];

    const works = await fetchWorks([...profByAuthor.keys()], {
      fromDate,
      perPage: 100,
      sort: 'publication_date:desc',
      types: CRON_PAPER_TYPES,
      pages: backfill ? 2 : 1,
      stopAt: started + FETCH_BUDGET_MS,
    });
    const papers = selectRecentPapers(works.values(), profByAuthor);
    const { added, updated, skipped } = await savePapers(papers);
    console.log(
      `[cron/papers] ${professors.length} professors, ${works.size} works since ${fromDate}, ${papers.length} kept, ${added} new, ${updated} updated, ${skipped} duplicate DOIs`,
    );
    return NextResponse.json({ success: true, fromDate, works: works.size, kept: papers.length, added, updated, skipped });
  } catch (error) {
    console.error('[cron/papers] import failed', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
