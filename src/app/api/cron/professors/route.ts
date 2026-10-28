import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BATCH_SIZE, fetchAuthors, gap, mergeTags, sliceForDay, sliceOf } from '@/lib/professors/refresh';

// Daily refresh of h-index, works count and topics for a seventh of the professors that have an OpenAlex id (scheduled in vercel.json, 30 minutes after the papers cron).
// Never creates or deletes a professor, so it cannot clash with the seed. Subject tags stay; only OpenAlex topics are renewed.
// Vercel sends `Authorization: Bearer $CRON_SECRET`; once CRON_SECRET is set, other callers get 401.
export const maxDuration = 300;

/** Stop starting OpenAlex requests after this long; the professors left over come back in next week's run */
const BUDGET_MS = 240_000;
const WRITES_AT_ONCE = 10;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const started = Date.now();
    const slice = sliceForDay(started);
    const all = await prisma.professor.findMany({
      where: { openAlexId: { not: null } },
      select: { id: true, openAlexId: true, hIndex: true, publicationCount: true, researchTags: true },
    });
    const today = all.filter((p) => sliceOf(p.openAlexId!) === slice);

    let fetched = 0;
    let updated = 0;
    let failedBatches = 0;
    let timedOut = false;
    for (let i = 0; i < today.length; i += BATCH_SIZE) {
      if (Date.now() - started >= BUDGET_MS) {
        timedOut = true;
        console.warn(`[cron/professors] time limit reached at batch ${i / BATCH_SIZE}`);
        break;
      }
      const batch = today.slice(i, i + BATCH_SIZE);
      const authors = await fetchAuthors(batch.map((p) => p.openAlexId!));
      if (!authors) {
        failedBatches++;
        console.warn(`[cron/professors] batch ${i / BATCH_SIZE} failed, skipped`);
        continue;
      }
      const writes = batch.flatMap((p) => {
        const a = authors.get(p.openAlexId!);
        if (!a) return [];
        fetched++;
        const data: { hIndex?: number; publicationCount?: number; researchTags?: string[] } = {};
        const h = a.summary_stats?.h_index;
        if (typeof h === 'number' && h !== p.hIndex) data.hIndex = h;
        if (typeof a.works_count === 'number' && a.works_count !== p.publicationCount) data.publicationCount = a.works_count;
        const topics = (a.topics ?? []).map((t) => t.display_name);
        if (topics.length) {
          const tags = mergeTags(p.researchTags, topics);
          if (tags.join('|') !== p.researchTags.join('|')) data.researchTags = tags;
        }
        return Object.keys(data).length ? [{ id: p.id, data }] : [];
      });
      for (let w = 0; w < writes.length; w += WRITES_AT_ONCE) {
        await Promise.all(writes.slice(w, w + WRITES_AT_ONCE).map(({ id, data }) => prisma.professor.update({ where: { id }, data })));
      }
      updated += writes.length;
      await gap();
    }
    console.log(
      `[cron/professors] slice ${slice}: ${today.length} of ${all.length} professors, ${fetched} found on OpenAlex, ${updated} updated, ${failedBatches} failed batches${timedOut ? ', stopped at time limit' : ''}`,
    );
    return NextResponse.json({ success: true, slice, professors: today.length, fetched, updated, failedBatches, timedOut });
  } catch (error) {
    console.error('[cron/professors] refresh failed', error);
    return NextResponse.json({ success: false, error: 'Refresh failed' }, { status: 500 });
  }
}
