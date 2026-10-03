import type { Opportunity as OpportunityRow } from '@prisma/client';
import type { Opportunity } from '@/types';
import { prisma } from '@/lib/prisma';
import { degreeFromDb } from '@/lib/scholarships';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';

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
    admission: row.admission,
    livingCost: row.livingCost,
    rankRange: row.rankRange,
    acceptanceRate: row.acceptanceRate,
    positionType: row.positionType,
    startDate: row.startDate,
    deadline: row.deadline.toISOString(),
    positionDetails: (row.positionDetails as Opportunity['positionDetails'] | null) ?? [],
    aboutLab: row.aboutLab,
    applySteps: row.applySteps,
    contactEmail: row.contactEmail ?? undefined,
    officialUrl: row.officialUrl ?? undefined,
  };
}

const ORDER = [{ postedAt: 'desc' as const }, { id: 'asc' as const }];

/** All listings from the database, or the mock list while the table is empty or the DB is down. */
export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    const rows = await prisma.opportunity.findMany({ orderBy: ORDER });
    if (rows.length > 0) return rows.map(toOpportunity);
  } catch (error) {
    console.error('[opportunities] database read failed, serving mock data', error);
  }
  return OPPORTUNITY_LISTINGS;
}

/** One listing by id, with the same mock fallback. */
export async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const row = await prisma.opportunity.findUnique({ where: { id } });
    if (row) return toOpportunity(row);
    if ((await prisma.opportunity.count()) > 0) return null;
  } catch (error) {
    console.error('[opportunities] database read failed, serving mock data', error);
  }
  return OPPORTUNITY_LISTINGS.find((o) => o.id === id) ?? null;
}
