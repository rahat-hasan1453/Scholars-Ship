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

// The list (every professor in one response) needs no papers: they are only shown on the details page
const { papers: _papers, ...LIST_INCLUDE } = INCLUDE;
void _papers;

type ProfessorRow = Prisma.ProfessorGetPayload<{ include: typeof INCLUDE }>;
type ProfessorListRow = Prisma.ProfessorGetPayload<{ include: typeof LIST_INCLUDE }>;

/** Maps a database row (with its university, lab, latest grant and papers) to the `Professor` shape the UI uses. */
export function toProfessor(row: ProfessorListRow & { papers?: ProfessorRow['papers'] }): Professor {
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
    recentPapers: (row.papers ?? []).map(({ paper }) => ({
      id: paper.id,
      title: paper.title,
      venue: paper.venue ?? undefined,
      year: paper.year ?? undefined,
    })),
    updatedAt: row.updatedAt.toISOString(),
  });
}

/**
 * A professor as sent in the big list: without the details-page extras (recent papers, contact steps)
 * and without the generated initials avatar (the browser makes it from the name). Keeps the response small.
 */
export function toListProfessor(row: ProfessorListRow): Professor {
  const { recentPapers: _recentPapers, contactSteps: _contactSteps, ...rest } = toProfessor(row);
  void _recentPapers;
  void _contactSteps;
  return { ...rest, avatarUrl: row.avatarUrl ?? '' };
}

/** All faculty from the database, slimmed for the list. Empty when the DB is down (the UI shows its empty state). */
export async function getProfessors(): Promise<Professor[]> {
  try {
    const rows = await prisma.professor.findMany({ include: LIST_INCLUDE, orderBy: [{ hIndex: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }] });
    return rows.map(toListProfessor);
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

/** Candidates for "Similar faculty": same country or a shared research tag (the page only shows 3, so a few dozen is plenty). */
export async function getSimilarCandidates(p: Pick<Professor, 'id' | 'country' | 'researchTags'>, limit = 60): Promise<Professor[]> {
  try {
    const rows = await prisma.professor.findMany({
      where: { id: { not: p.id }, OR: [{ researchTags: { hasSome: p.researchTags } }, { country: p.country }] },
      include: INCLUDE,
      orderBy: [{ hIndex: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
      take: limit,
    });
    return rows.map(toProfessor);
  } catch (error) {
    console.error('[professors] database read failed', error);
    return [];
  }
}
