import type { Prisma } from '@prisma/client';
import type { LookingFor, Professor, ProfessorPaper } from '@/types';
import { prisma } from '@/lib/prisma';
import { degreeFromDb } from '@/lib/scholarships';
import { withFacultyDefaults } from '@/lib/professorDetails';
import { initialsAvatar } from '@/lib/initialsAvatar';

const INCLUDE = {
  universityRef: true,
  lab: true,
  grants: { orderBy: [{ year: 'desc' as const }, { createdAt: 'desc' as const }], take: 1 },
  papers: {
    include: { paper: { select: { id: true, title: true, venue: true, year: true } } },
    orderBy: { paper: { year: 'desc' as const } },
    take: 3,
  },
  _count: { select: { papers: true } },
} satisfies Prisma.ProfessorInclude;

type ProfessorRow = Prisma.ProfessorGetPayload<{ include: typeof INCLUDE }>;

/** Maps a database row (with its university, lab, latest grant and papers) to the `Professor` shape the UI uses. */
export function toProfessor(row: ProfessorRow): Professor {
  const lab = row.lab;
  const grant = row.grants[0];
  return withFacultyDefaults({
    id: row.id,
    name: row.name,
    title: row.title,
    university: row.university,
    department: row.department,
    country: row.country,
    labName: lab?.name ?? row.labName ?? undefined,
    researchTags: row.researchTags,
    // Without a lab row nobody has told us about hiring: `false` in the column means unknown, not "closed"
    openPositions: lab ? lab.openPositions : row.openPositions || undefined,
    recentGrants: row.recentGrants ?? undefined,
    email: row.email ?? undefined,
    linkedInUrl: row.linkedInUrl ?? undefined,
    googleScholar: row.googleScholar ?? undefined,
    labWebsite: lab?.website ?? row.labWebsite ?? undefined,
    avatarUrl: row.avatarUrl ?? initialsAvatar(row.name),
    acceptingTerms: lab?.acceptingTerms.length ? lab.acceptingTerms : row.acceptingTerms,
    bio: row.bio ?? undefined,
    fundingSummary: lab?.fundingSummary ?? undefined,
    fundingType: (lab?.fundingType as Professor['fundingType']) ?? undefined,
    fundingSource: lab?.fundingSource ?? undefined,
    degreeLevels: lab?.degreeLevels.map(degreeFromDb),
    school: row.school ?? undefined,
    city: row.universityRef?.city ?? undefined,
    phdStudents: lab?.phdStudents ?? undefined,
    postdocs: lab?.postdocs ?? undefined,
    publicationCount: row.publicationCount ?? (row._count.papers || undefined),
    hIndex: row.hIndex ?? undefined,
    openPositionCount: lab?.openPositionCount ?? undefined,
    recentGrant: grant ? { amount: grant.amount, title: grant.title, year: grant.year ?? undefined } : undefined,
    lookingFor: (row.lookingFor as LookingFor | null) ?? undefined,
    contactSteps: row.contactSteps,
    recentPapers: row.papers.map(({ paper }) => ({
      id: paper.id,
      title: paper.title,
      venue: paper.venue ?? undefined,
      year: paper.year ?? undefined,
    })),
    updatedAt: row.updatedAt.toISOString(),
  });
}

/** All faculty from the database. Empty when the DB is down (the UI shows its empty state). */
export async function getProfessors(): Promise<Professor[]> {
  try {
    const rows = await prisma.professor.findMany({ include: INCLUDE, orderBy: [{ hIndex: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }] });
    return rows.map(toProfessor);
  } catch (error) {
    console.error('[professors] database read failed', error);
    return [];
  }
}

/** One professor by id. */
export async function getProfessor(id: string): Promise<Professor | null> {
  try {
    const row = await prisma.professor.findUnique({ where: { id }, include: INCLUDE });
    return row ? toProfessor(row) : null;
  } catch (error) {
    console.error('[professors] database read failed', error);
    return null;
  }
}
