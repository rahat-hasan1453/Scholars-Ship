import type { Scholarship as ScholarshipRow, DegreeLevel as DbDegreeLevel } from '@prisma/client';
import type { DegreeLevel, FundingType, Scholarship } from '@/types';
import { prisma } from '@/lib/prisma';
import { mockScholarships } from '@/data/mockData';
import { withDetailDefaults, type FundingRow } from '@/lib/scholarshipDetails';

const DEGREE_TO_DB: Record<DegreeLevel, DbDegreeLevel> = { Bachelors: 'BACHELORS', Masters: 'MASTERS', PhD: 'PHD' };
const DEGREE_FROM_DB: Record<DbDegreeLevel, DegreeLevel> = { BACHELORS: 'Bachelors', MASTERS: 'Masters', PHD: 'PhD' };

export const degreeToDb = (d: DegreeLevel): DbDegreeLevel => DEGREE_TO_DB[d];

/** Maps a database row to the `Scholarship` shape the UI uses. */
export function toScholarship(row: ScholarshipRow): Scholarship {
  return withDetailDefaults({
    id: row.id,
    title: row.title,
    provider: row.provider,
    deadline: row.deadline.toISOString(),
    fundingAmount: row.fundingAmount,
    fundingType: row.fundingType as FundingType,
    degreeLevels: row.degreeLevels.map((d) => DEGREE_FROM_DB[d]),
    countries: row.countries,
    specializations: row.specializations,
    requirements: (row.requirementsJson as Scholarship['requirements'] | null) ?? {},
    admissionSummary: row.admissionSummary ?? undefined,
    livingCost: row.livingCost ?? undefined,
    providerShort: row.providerShort ?? undefined,
    fieldOfStudy: row.fieldOfStudy ?? undefined,
    fundingBreakdown: (row.fundingBreakdown as FundingRow[] | null) ?? undefined,
    applySteps: row.applySteps,
    createdAt: row.createdAt.toISOString(),
    officialUrl: row.officialUrl,
    description: row.description,
    featured: row.featured,
    tags: row.tags,
  });
}

/** All scholarships from the database, or the mock list while the table is empty or the DB is down. */
export async function getScholarships(): Promise<Scholarship[]> {
  try {
    const rows = await prisma.scholarship.findMany({ orderBy: [{ deadline: 'asc' }, { id: 'asc' }] });
    if (rows.length > 0) return rows.map(toScholarship);
  } catch (error) {
    console.error('[scholarships] database read failed, serving mock data', error);
  }
  return mockScholarships;
}

/** One scholarship by id, with the same mock fallback. */
export async function getScholarship(id: string): Promise<Scholarship | null> {
  try {
    const row = await prisma.scholarship.findUnique({ where: { id } });
    if (row) return toScholarship(row);
    if ((await prisma.scholarship.count()) > 0) return null;
  } catch (error) {
    console.error('[scholarships] database read failed, serving mock data', error);
  }
  return mockScholarships.find((s) => s.id === id) ?? null;
}
