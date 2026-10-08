import type { Opportunity as OpportunityRow, Prisma } from '@prisma/client';
import type { Opportunity } from '@/types';
import { prisma } from '@/lib/prisma';
import { degreeFromDb, degreeToDb } from '@/lib/scholarships';
import { MAX_AGE_DAYS } from '@/lib/ingest/mastodon';

/** Maps a database row to the `Opportunity` shape the UI uses. */
export function toOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    title: row.title,
    authorName: row.authorName,
    authorTitle: row.authorTitle,
    authorAvatar: row.authorAvatar ?? undefined,
    institution: row.institution,
    labName: row.labName ?? undefined,
    country: row.country,
    city: row.city ?? undefined,
    source: row.source as Opportunity['source'],
    sourceUrl: row.sourceUrl,
    postedAt: row.postedAt.toISOString(),
    content: row.content,
    funding: row.funding,
    fundingTags: row.fundingTags,
    degreeLevels: row.degreeLevels.map(degreeFromDb),
    fieldTags: row.fieldTags,
    subjectTags: row.subjectTags,
    minCgpa: row.minCgpa ?? undefined,
    minIelts: row.minIelts ?? undefined,
    publications: row.publications as Opportunity['publications'],
    admission: row.admission ?? undefined,
    livingCost: row.livingCost ?? undefined,
    rankRange: row.rankRange ?? undefined,
    acceptanceRate: row.acceptanceRate ?? undefined,
    positionType: row.positionType ?? undefined,
    startDate: row.startDate ?? undefined,
    deadline: row.deadline?.toISOString(),
    positionDetails: (row.positionDetails as Opportunity['positionDetails'] | null) ?? [],
    aboutLab: row.aboutLab ?? undefined,
    applySteps: row.applySteps,
    contactEmail: row.contactEmail ?? undefined,
    officialUrl: row.officialUrl ?? undefined,
  };
}

/** The reverse of `toOpportunity`: the columns to write for one listing (seed and cron import). */
export function toOpportunityData(o: Opportunity): Omit<Prisma.OpportunityUncheckedCreateInput, 'id'> {
  return {
    title: o.title,
    authorName: o.authorName,
    authorTitle: o.authorTitle,
    authorAvatar: o.authorAvatar ?? null,
    institution: o.institution,
    labName: o.labName ?? null,
    country: o.country,
    city: o.city ?? null,
    source: o.source,
    sourceUrl: o.sourceUrl,
    postedAt: new Date(o.postedAt),
    content: o.content,
    funding: o.funding,
    fundingTags: o.fundingTags,
    degreeLevels: o.degreeLevels.map(degreeToDb),
    fieldTags: o.fieldTags,
    subjectTags: o.subjectTags,
    minCgpa: o.minCgpa ?? null,
    minIelts: o.minIelts ?? null,
    publications: o.publications,
    admission: o.admission ?? null,
    livingCost: o.livingCost ?? null,
    rankRange: o.rankRange ?? null,
    acceptanceRate: o.acceptanceRate ?? null,
    positionType: o.positionType ?? null,
    startDate: o.startDate ?? null,
    deadline: o.deadline ? new Date(o.deadline) : null,
    positionDetails: o.positionDetails,
    aboutLab: o.aboutLab ?? null,
    applySteps: o.applySteps,
    contactEmail: o.contactEmail ?? null,
    officialUrl: o.officialUrl ?? null,
  };
}

/** Upserts listings by id; returns how many were new. */
export async function saveOpportunities(list: Opportunity[]): Promise<number> {
  const existing = new Set(
    (await prisma.opportunity.findMany({ where: { id: { in: list.map((o) => o.id) } }, select: { id: true } })).map((r) => r.id),
  );
  for (const o of list) {
    const data = toOpportunityData(o);
    await prisma.opportunity.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
  }
  return list.filter((o) => !existing.has(o.id)).length;
}

/** Still open: deadline in the future, or no stated deadline and posted within MAX_AGE_DAYS. */
export function currentWhere(now = new Date()): Prisma.OpportunityWhereInput {
  return {
    OR: [
      { deadline: { gte: now } },
      { deadline: null, postedAt: { gte: new Date(now.getTime() - MAX_AGE_DAYS * 86_400_000) } },
    ],
  };
}

const ORDER = [{ postedAt: 'desc' as const }, { id: 'asc' as const }];

/** Open listings from the database, newest first. An empty list when the DB is down (the UI shows its empty state). */
export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    const rows = await prisma.opportunity.findMany({ where: currentWhere(), orderBy: ORDER });
    return rows.map(toOpportunity);
  } catch (error) {
    console.error('[opportunities] database read failed', error);
    return [];
  }
}

/** One listing by id, closed ones included (a saved listing must still open). */
export async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const row = await prisma.opportunity.findUnique({ where: { id } });
    return row ? toOpportunity(row) : null;
  } catch (error) {
    console.error('[opportunities] database read failed', error);
    return null;
  }
}
