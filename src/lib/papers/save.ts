import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { workToPaper, type OpenAlexWork, type PaperData } from '@/lib/papers/openalex';

// Picks the new papers the daily cron keeps and writes them to the database.

/** Work types the cron keeps: journal articles, conference papers and preprints */
export const CRON_PAPER_TYPES = ['article', 'proceedings-article', 'preprint'];
/** Older work is history and already comes from the seed */
export const MIN_YEAR = 2025;
/** Most recent papers kept per professor in one run, so the database stays small */
export const PER_PROFESSOR = 10;

/** Rows the seed may delete: its own papers that are no longer in papers.json. Cron papers are never touched. */
export function staleSeedPapersWhere(keepIds: string[]): Prisma.ResearchPaperWhereInput {
  return { id: { notIn: keepIds }, importedBy: 'seed' };
}

/**
 * Works → papers worth keeping: a kept type, published MIN_YEAR or later, a usable abstract, and at least one of our
 * professors among the authors. Newest first, at most `perProfessor` per professor.
 */
export function selectRecentPapers(
  works: Iterable<OpenAlexWork>,
  profByAuthor: Map<string, string>,
  { minYear = MIN_YEAR, perProfessor = PER_PROFESSOR } = {},
): PaperData[] {
  const candidates = [...works]
    .filter((w) => w.type && CRON_PAPER_TYPES.includes(w.type) && (w.publication_year ?? 0) >= minYear)
    .flatMap((w) => workToPaper(w, profByAuthor) ?? [])
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || b.citationCount - a.citationCount);

  const perProf = new Map<string, number>();
  const kept: PaperData[] = [];
  for (const p of candidates) {
    const profs = [...new Set(p.authors.flatMap((a) => a.professorId ?? []))];
    if (!profs.some((id) => (perProf.get(id) ?? 0) < perProfessor)) continue;
    for (const id of profs) perProf.set(id, (perProf.get(id) ?? 0) + 1);
    kept.push(p);
  }
  return kept;
}

/**
 * New papers are created with their authors (importedBy = 'cron'); papers already stored only get a fresh citation count.
 * A paper whose DOI already belongs to another row is skipped. Running twice adds nothing the second time.
 */
export async function savePapers(papers: PaperData[]): Promise<{ added: number; updated: number; skipped: number }> {
  if (papers.length === 0) return { added: 0, updated: 0, skipped: 0 };
  const existing = await prisma.researchPaper.findMany({
    where: { OR: [{ id: { in: papers.map((p) => p.id) } }, { openAlexId: { in: papers.map((p) => p.openAlexId) } }] },
    select: { id: true, openAlexId: true, citationCount: true },
  });
  const byId = new Map(existing.map((r) => [r.id, r]));
  const byOpenAlex = new Map(existing.flatMap((r) => (r.openAlexId ? [[r.openAlexId, r] as const] : [])));
  const dois = papers.flatMap((p) => p.doi ?? []);
  const doiOwner = new Map(
    (await prisma.researchPaper.findMany({ where: { doi: { in: dois } }, select: { id: true, doi: true } })).map((r) => [r.doi, r.id]),
  );

  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const p of papers) {
    const row = byId.get(p.id) ?? byOpenAlex.get(p.openAlexId);
    if (row) {
      if (row.citationCount !== p.citationCount) {
        await prisma.researchPaper.update({ where: { id: row.id }, data: { citationCount: p.citationCount } });
        updated++;
      }
      continue;
    }
    if (p.doi && doiOwner.has(p.doi)) {
      skipped++;
      continue;
    }
    await prisma.researchPaper.create({
      data: {
        id: p.id,
        openAlexId: p.openAlexId,
        importedBy: 'cron',
        title: p.title,
        abstract: p.abstract,
        year: p.year,
        publishedAt: p.publishedAt ? new Date(`${p.publishedAt}T00:00:00Z`) : null,
        venue: p.venue,
        citationCount: p.citationCount,
        doi: p.doi,
        pdfUrl: p.pdfUrl,
        fieldsOfStudy: p.fieldsOfStudy,
        tags: p.tags,
        isOpenAccess: p.isOpenAccess,
        paperType: p.paperType,
        peerReviewed: p.paperType === 'Preprint' ? false : null,
        institution: p.institution,
        funding: p.funding,
        authors: { create: p.authors },
      },
    });
    if (p.doi) doiOwner.set(p.doi, p.id);
    added++;
  }
  return { added, updated, skipped };
}
