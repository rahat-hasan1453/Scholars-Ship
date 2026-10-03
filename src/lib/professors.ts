import type { Prisma } from '@prisma/client';
import type { LookingFor, Professor, ProfessorPaper } from '@/types';
import { prisma } from '@/lib/prisma';
import { degreeFromDb } from '@/lib/scholarships';
import { withFacultyDefaults } from '@/lib/professorDetails';
import { mockProfessors } from '@/data/mockData';
import { initialResearchPapers } from '@/data/researchPapers';

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

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

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
    openPositions: lab?.openPositions ?? row.openPositions,
    recentGrants: row.recentGrants ?? undefined,
    email: row.email ?? undefined,
    linkedInUrl: row.linkedInUrl ?? undefined,
    googleScholar: row.googleScholar ?? undefined,
    labWebsite: lab?.website ?? row.labWebsite ?? undefined,
    avatarUrl: row.avatarUrl ?? FALLBACK_AVATAR,
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

/** "Dr. Sarah Jenkins" and "Sarah Jenkins" are the same author */
const plainName = (name: string) =>
  name
    .split(' ')
    .filter((x) => !x.endsWith('.'))
    .join(' ')
    .toLowerCase();

/** Mock papers this professor co-authored, newest first */
function mockPapersFor(name: string): ProfessorPaper[] {
  const me = plainName(name);
  return initialResearchPapers
    .filter((p) => p.authors.some((a) => plainName(a.name) === me))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 3)
    .map((p) => ({ id: p.id, title: p.title, venue: p.venue, year: p.year }));
}

const fromMock = (p: Professor): Professor => withFacultyDefaults({ ...p, recentPapers: mockPapersFor(p.name) });

/** All faculty from the database, or the mock list while the table is empty or the DB is down. */
export async function getProfessors(): Promise<Professor[]> {
  try {
    const rows = await prisma.professor.findMany({ include: INCLUDE, orderBy: { id: 'asc' } });
    if (rows.length > 0) return rows.map(toProfessor);
  } catch (error) {
    console.error('[professors] database read failed, serving mock data', error);
  }
  return mockProfessors.map(fromMock);
}

/** One professor by id, with the same mock fallback. */
export async function getProfessor(id: string): Promise<Professor | null> {
  try {
    const row = await prisma.professor.findUnique({ where: { id }, include: INCLUDE });
    if (row) return toProfessor(row);
    if ((await prisma.professor.count()) > 0) return null;
  } catch (error) {
    console.error('[professors] database read failed, serving mock data', error);
  }
  const mock = mockProfessors.find((p) => p.id === id);
  return mock ? fromMock(mock) : null;
}
