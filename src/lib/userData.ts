// Server-side data access for the signed-in user's own data: profile, Pipeline (applications + outreach) and bookmarks.
// Every function takes the user's id or profile id from the session; ownership is part of each query's `where`.
import type {
  Application as ApplicationRow,
  ApplicationTask as TaskRow,
  OutreachRecord as OutreachRow,
  Prisma,
  Scholarship as ScholarshipRow,
  User as UserRow,
  UserProfile as ProfileRow,
} from '@prisma/client';
import type { z } from 'zod';
import type { Application, OutreachRecord, TestScores, UserProfile } from '@/types';
import { prisma } from '@/lib/prisma';
import { toScholarship } from '@/lib/scholarships';
import { gravatarUrl } from '@/lib/avatar';
import {
  applicationStatusFromDb,
  applicationStatusToDb,
  decisionFromDb,
  decisionToDb,
  degreeLevelFromDb,
  degreeLevelToDb,
  outreachStatusFromDb,
  outreachStatusToDb,
} from '@/lib/userDataMapping';
import type {
  applicationCreateSchema,
  applicationPatchSchema,
  BookmarkKind,
  onboardingSchema,
  outreachCreateSchema,
  outreachPatchSchema,
  ProfilePatch,
  taskCreateSchema,
  taskPatchSchema,
} from '@/lib/userDataSchemas';
import type { ImportPlan } from '@/lib/userDataImport';

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : undefined);
const toDate = (s: string | null | undefined) => (s === undefined ? undefined : s === null ? null : new Date(s));

// ---------------------------------------------------------------------------
// Profile

export type ProfileDetails = { bio?: string; field?: string; gradYear?: string; intake?: string };
export type ServerProfile = UserProfile & { details?: ProfileDetails };

/** Old onboarding saved everything in User.profileData (JSON); used until the user has a UserProfile row */
function legacyProfile(json: unknown): Partial<UserProfile> {
  if (!json || typeof json !== 'object') return {};
  const p = json as Record<string, unknown>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);
  return {
    degreeLevel: p.degreeLevel === 'Bachelors' || p.degreeLevel === 'Masters' || p.degreeLevel === 'PhD' ? p.degreeLevel : undefined,
    specializations: strings(p.specializations),
    targetCountries: strings(p.targetCountries),
    cgpa: typeof p.cgpa === 'number' ? p.cgpa : undefined,
    testScores: p.testScores && typeof p.testScores === 'object' ? (p.testScores as TestScores) : undefined,
  };
}

export function toUserProfile(user: UserRow, row: ProfileRow | null): ServerProfile {
  const legacy = row ? {} : legacyProfile(user.profileData);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: row?.photo || user.avatar || gravatarUrl(user.email),
    onboardingCompleted: user.onboardingCompleted,
    degreeLevel: row ? degreeLevelFromDb(row.degreeLevel) : (legacy.degreeLevel ?? 'Masters'),
    specializations: row?.specializations ?? legacy.specializations ?? [],
    targetCountries: row?.targetCountries ?? legacy.targetCountries ?? [],
    cgpa: row?.cgpa != null ? Number(row.cgpa) : (legacy.cgpa ?? 0),
    testScores: ((row?.testScores as TestScores | null) ?? legacy.testScores ?? {}) as TestScores,
    details: (row?.details as ProfileDetails | null) ?? undefined,
  };
}

export async function getProfile(userId: string): Promise<ServerProfile | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const row = await prisma.userProfile.findUnique({ where: { userId } });
  return toUserProfile(user, row);
}

/** The user's UserProfile id, creating the row (from the old onboarding JSON when present) on first write. */
export async function ensureProfileId(userId: string): Promise<string | null> {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const legacy = legacyProfile(user.profileData);
  const row = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      degreeLevel: degreeLevelToDb(legacy.degreeLevel ?? 'Masters'),
      specializations: legacy.specializations ?? [],
      targetCountries: legacy.targetCountries ?? [],
      cgpa: legacy.cgpa ?? null,
      testScores: (legacy.testScores as Prisma.InputJsonValue | undefined) ?? undefined,
    },
    update: {},
  });
  return row.id;
}

/** Read-only lookup: null when the user has never saved anything (then every list is empty) */
export async function findProfileId(userId: string): Promise<string | null> {
  const row = await prisma.userProfile.findUnique({ where: { userId } });
  return row?.id ?? null;
}

function profileColumns(patch: Omit<ProfilePatch, 'name'>) {
  const data: Prisma.UserProfileUncheckedUpdateInput = {};
  if (patch.degreeLevel) data.degreeLevel = degreeLevelToDb(patch.degreeLevel);
  if (patch.specializations) data.specializations = patch.specializations;
  if (patch.targetCountries) data.targetCountries = patch.targetCountries;
  if (patch.cgpa !== undefined) data.cgpa = patch.cgpa;
  if (patch.testScores) data.testScores = patch.testScores;
  if (patch.details) data.details = patch.details;
  if (patch.avatar !== undefined) data.photo = patch.avatar || null;
  return data;
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<ServerProfile | null> {
  const profileId = await ensureProfileId(userId);
  if (!profileId) return null;
  const { name, ...rest } = patch;
  if (name) await prisma.user.update({ where: { id: userId }, data: { name } });
  const data = profileColumns(rest);
  if (Object.keys(data).length > 0) await prisma.userProfile.update({ where: { userId }, data });
  return getProfile(userId);
}

/** Onboarding answers → UserProfile (also kept in User.profileData for older code paths) */
export async function saveOnboardingProfile(userId: string, input: z.infer<typeof onboardingSchema>) {
  const columns = profileColumns({
    degreeLevel: input.degreeLevel,
    specializations: input.specializations,
    targetCountries: input.targetCountries,
    cgpa: input.cgpa,
    testScores: input.testScores,
    details: input.details,
  });
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      degreeLevel: degreeLevelToDb(input.degreeLevel),
      specializations: input.specializations ?? [],
      targetCountries: input.targetCountries ?? [],
      cgpa: input.cgpa ?? null,
      testScores: input.testScores ?? undefined,
      details: input.details ?? undefined,
    },
    update: columns as Prisma.UserProfileUncheckedUpdateInput,
  });
}

// ---------------------------------------------------------------------------
// Pipeline: scholarship applications

type ApplicationWithRelations = ApplicationRow & { scholarship: ScholarshipRow; tasks: TaskRow[] };
const applicationInclude = { scholarship: true, tasks: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.ApplicationInclude;
const listOrder: Prisma.ApplicationOrderByWithRelationInput[] = [{ orderIndex: 'asc' }, { createdAt: 'desc' }];

export function toApplication(row: ApplicationWithRelations): Application {
  const scholarship = toScholarship(row.scholarship);
  return {
    id: row.id,
    scholarshipId: row.scholarshipId,
    scholarship,
    status: applicationStatusFromDb(row.status),
    decision: decisionFromDb(row.decision),
    notes: row.notes ?? '',
    deadline: iso(row.deadline) ?? scholarship.deadline,
    tasks: [...row.tasks]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((t) => ({ id: t.id, title: t.title, isCompleted: t.isCompleted, ...(t.dueDate ? { dueDate: iso(t.dueDate) } : {}) })),
    updatedAt: iso(row.updatedAt)!,
  };
}

export async function listApplications(profileId: string): Promise<Application[]> {
  const rows = await prisma.application.findMany({ where: { profileId }, orderBy: listOrder, include: applicationInclude });
  return (rows as ApplicationWithRelations[]).map(toApplication);
}

async function getOwnedApplication(profileId: string, id: string) {
  return (await prisma.application.findFirst({ where: { id, profileId }, include: applicationInclude })) as ApplicationWithRelations | null;
}

/** orderIndex for a card added at the top of the board */
async function topOrderIndex(model: 'application' | 'outreachRecord', profileId: string) {
  const first =
    model === 'application'
      ? await prisma.application.findFirst({ where: { profileId }, orderBy: { orderIndex: 'asc' }, select: { orderIndex: true } })
      : await prisma.outreachRecord.findFirst({ where: { profileId }, orderBy: { orderIndex: 'asc' }, select: { orderIndex: true } });
  return first ? first.orderIndex - 1 : 0;
}

export type CreateResult<T> = { status: 'created'; item: T } | { status: 'exists'; item: T } | { status: 'not_found' };

export async function createApplication(profileId: string, input: z.infer<typeof applicationCreateSchema>): Promise<CreateResult<Application>> {
  const scholarship = await prisma.scholarship.findUnique({ where: { id: input.scholarshipId }, select: { id: true } });
  if (!scholarship) return { status: 'not_found' };
  // One card per scholarship: saving it again is a no-op that returns the existing card
  const existing = await prisma.application.findFirst({ where: { profileId, scholarshipId: input.scholarshipId }, include: applicationInclude });
  if (existing) return { status: 'exists', item: toApplication(existing as ApplicationWithRelations) };

  const orderIndex = await topOrderIndex('application', profileId);
  const now = Date.now();
  const row = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        profileId,
        scholarshipId: input.scholarshipId,
        status: applicationStatusToDb(input.status ?? 'Wishlist'),
        decision: decisionToDb(input.decision ?? 'Pending'),
        notes: input.notes ?? null,
        deadline: toDate(input.deadline) ?? null,
        orderIndex,
      },
    });
    if (input.tasks?.length) {
      await tx.applicationTask.createMany({
        // createdAt keeps the checklist order (tasks are listed oldest first)
        data: input.tasks.map((t, i) => ({
          ...(t.id ? { id: t.id } : {}),
          applicationId: app.id,
          title: t.title,
          isCompleted: t.isCompleted ?? false,
          createdAt: new Date(now + i),
        })),
      });
    }
    return tx.application.findFirst({ where: { id: app.id }, include: applicationInclude });
  });
  return { status: 'created', item: toApplication(row as ApplicationWithRelations) };
}

export async function updateApplication(profileId: string, id: string, patch: z.infer<typeof applicationPatchSchema>): Promise<Application | null> {
  const owned = await getOwnedApplication(profileId, id);
  if (!owned) return null;
  const row = await prisma.application.update({
    where: { id },
    data: {
      ...(patch.status ? { status: applicationStatusToDb(patch.status) } : {}),
      ...(patch.decision ? { decision: decisionToDb(patch.decision) } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.deadline !== undefined ? { deadline: toDate(patch.deadline) } : {}),
    },
    include: applicationInclude,
  });
  return toApplication(row as ApplicationWithRelations);
}

export async function deleteApplication(profileId: string, id: string): Promise<boolean> {
  const { count } = await prisma.application.deleteMany({ where: { id, profileId } });
  return count > 0;
}

/** Saves the board order. Ids the user doesn't own are ignored, so this can't touch other users' rows. */
export async function reorder(model: 'application' | 'outreachRecord', profileId: string, ids: string[]): Promise<number> {
  const unique = [...new Set(ids)];
  const results = await prisma.$transaction(
    unique.map((id, orderIndex) =>
      model === 'application'
        ? prisma.application.updateMany({ where: { id, profileId }, data: { orderIndex } })
        : prisma.outreachRecord.updateMany({ where: { id, profileId }, data: { orderIndex } }),
    ),
  );
  return results.reduce((n, r) => n + r.count, 0);
}

export async function addTask(profileId: string, applicationId: string, input: z.infer<typeof taskCreateSchema>) {
  if (!(await getOwnedApplication(profileId, applicationId))) return null;
  const task = await prisma.applicationTask.create({
    data: { ...(input.id ? { id: input.id } : {}), applicationId, title: input.title, isCompleted: input.isCompleted ?? false },
  });
  await prisma.application.update({ where: { id: applicationId }, data: { updatedAt: new Date() } });
  return { id: task.id, title: task.title, isCompleted: task.isCompleted };
}

export async function updateTask(profileId: string, applicationId: string, taskId: string, patch: z.infer<typeof taskPatchSchema>) {
  if (!(await getOwnedApplication(profileId, applicationId))) return null;
  const task = await prisma.applicationTask.findFirst({ where: { id: taskId, applicationId } });
  if (!task) return null;
  const row = await prisma.applicationTask.update({ where: { id: taskId }, data: patch });
  await prisma.application.update({ where: { id: applicationId }, data: { updatedAt: new Date() } });
  return { id: row.id, title: row.title, isCompleted: row.isCompleted };
}

export async function deleteTask(profileId: string, applicationId: string, taskId: string): Promise<boolean> {
  if (!(await getOwnedApplication(profileId, applicationId))) return false;
  const { count } = await prisma.applicationTask.deleteMany({ where: { id: taskId, applicationId } });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Pipeline: professor outreach

export function toOutreachRecord(row: OutreachRow): OutreachRecord {
  return {
    id: row.id,
    ...(row.professorId ? { professorId: row.professorId } : {}),
    ...(row.opportunityId ? { opportunityId: row.opportunityId } : {}),
    professorName: row.professorName,
    ...(row.labName ? { labName: row.labName } : {}),
    institution: row.institution,
    status: outreachStatusFromDb(row.status),
    notes: row.notes ?? '',
    ...(row.lastContactDate ? { lastContactDate: iso(row.lastContactDate) } : {}),
    ...(row.nextFollowUpDate ? { nextFollowUpDate: iso(row.nextFollowUpDate) } : {}),
    coldEmailDraft: row.coldEmailDraft ?? '',
    ...(row.emailSubject ? { emailSubject: row.emailSubject } : {}),
    updatedAt: iso(row.updatedAt)!,
    ...(row.country ? { country: row.country } : {}),
    ...(row.sourceUrl ? { sourceUrl: row.sourceUrl } : {}),
  };
}

export async function listOutreach(profileId: string): Promise<OutreachRecord[]> {
  const rows = await prisma.outreachRecord.findMany({ where: { profileId }, orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }] });
  return rows.map(toOutreachRecord);
}

export async function createOutreach(profileId: string, input: z.infer<typeof outreachCreateSchema>): Promise<CreateResult<OutreachRecord>> {
  if (input.professorId) {
    const prof = await prisma.professor.findUnique({ where: { id: input.professorId }, select: { id: true } });
    if (!prof) return { status: 'not_found' };
    const existing = await prisma.outreachRecord.findFirst({ where: { profileId, professorId: input.professorId } });
    if (existing) return { status: 'exists', item: toOutreachRecord(existing) };
  } else if (input.opportunityId) {
    const existing = await prisma.outreachRecord.findFirst({ where: { profileId, opportunityId: input.opportunityId } });
    if (existing) return { status: 'exists', item: toOutreachRecord(existing) };
  }
  const row = await prisma.outreachRecord.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      profileId,
      professorId: input.professorId ?? null,
      opportunityId: input.opportunityId ?? null,
      professorName: input.professorName,
      labName: input.labName ?? null,
      institution: input.institution,
      country: input.country ?? null,
      sourceUrl: input.sourceUrl ?? null,
      status: outreachStatusToDb(input.status ?? 'Prospect'),
      notes: input.notes ?? '',
      coldEmailDraft: input.coldEmailDraft ?? null,
      emailSubject: input.emailSubject ?? null,
      lastContactDate: toDate(input.lastContactDate) ?? null,
      nextFollowUpDate: toDate(input.nextFollowUpDate) ?? null,
      orderIndex: await topOrderIndex('outreachRecord', profileId),
    },
  });
  return { status: 'created', item: toOutreachRecord(row) };
}

export async function updateOutreach(profileId: string, id: string, patch: z.infer<typeof outreachPatchSchema>): Promise<OutreachRecord | null> {
  const owned = await prisma.outreachRecord.findFirst({ where: { id, profileId } });
  if (!owned) return null;
  const row = await prisma.outreachRecord.update({
    where: { id },
    data: {
      ...(patch.status ? { status: outreachStatusToDb(patch.status) } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.coldEmailDraft !== undefined ? { coldEmailDraft: patch.coldEmailDraft } : {}),
      ...(patch.emailSubject !== undefined ? { emailSubject: patch.emailSubject } : {}),
      ...(patch.lastContactDate !== undefined ? { lastContactDate: toDate(patch.lastContactDate) } : {}),
      ...(patch.nextFollowUpDate !== undefined ? { nextFollowUpDate: toDate(patch.nextFollowUpDate) } : {}),
    },
  });
  return toOutreachRecord(row);
}

export async function deleteOutreach(profileId: string, id: string): Promise<boolean> {
  const { count } = await prisma.outreachRecord.deleteMany({ where: { id, profileId } });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Bookmarks (scholarships are "saved" by tracking them as an Application)

export interface Bookmarks {
  opportunities: string[];
  professors: string[];
  papers: string[];
}

export async function listBookmarks(profileId: string): Promise<Bookmarks> {
  const [opps, profs, papers] = await Promise.all([
    prisma.savedOpportunity.findMany({ where: { profileId }, orderBy: { createdAt: 'asc' }, select: { opportunityId: true } }),
    prisma.profFollow.findMany({ where: { profileId }, orderBy: { createdAt: 'asc' }, select: { professorId: true } }),
    prisma.savedPaper.findMany({ where: { profileId }, orderBy: { createdAt: 'asc' }, select: { paperId: true } }),
  ]);
  return { opportunities: opps.map((r) => r.opportunityId), professors: profs.map((r) => r.professorId), papers: papers.map((r) => r.paperId) };
}

async function targetExists(kind: BookmarkKind, id: string): Promise<boolean> {
  const select = { id: true } as const;
  if (kind === 'opportunities') return !!(await prisma.opportunity.findUnique({ where: { id }, select }));
  if (kind === 'professors') return !!(await prisma.professor.findUnique({ where: { id }, select }));
  return !!(await prisma.researchPaper.findUnique({ where: { id }, select }));
}

/** Idempotent: saving twice keeps one row. false when the item doesn't exist in the database. */
export async function addBookmark(profileId: string, kind: BookmarkKind, id: string): Promise<boolean> {
  if (!(await targetExists(kind, id))) return false;
  if (kind === 'opportunities') {
    await prisma.savedOpportunity.upsert({ where: { profileId_opportunityId: { profileId, opportunityId: id } }, create: { profileId, opportunityId: id }, update: {} });
  } else if (kind === 'professors') {
    await prisma.profFollow.upsert({ where: { profileId_professorId: { profileId, professorId: id } }, create: { profileId, professorId: id }, update: {} });
  } else {
    await prisma.savedPaper.upsert({ where: { profileId_paperId: { profileId, paperId: id } }, create: { profileId, paperId: id }, update: {} });
  }
  return true;
}

/** Idempotent: removing a bookmark that isn't there is fine */
export async function removeBookmark(profileId: string, kind: BookmarkKind, id: string): Promise<void> {
  if (kind === 'opportunities') await prisma.savedOpportunity.deleteMany({ where: { profileId, opportunityId: id } });
  else if (kind === 'professors') await prisma.profFollow.deleteMany({ where: { profileId, professorId: id } });
  else await prisma.savedPaper.deleteMany({ where: { profileId, paperId: id } });
}

// ---------------------------------------------------------------------------
// One-time import

const idsIn = async (table: 'scholarship' | 'professor' | 'opportunity' | 'researchPaper', ids: string[]) => {
  if (ids.length === 0) return new Set<string>();
  const where = { id: { in: ids } };
  const select = { id: true } as const;
  const rows =
    table === 'scholarship'
      ? await prisma.scholarship.findMany({ where, select })
      : table === 'professor'
        ? await prisma.professor.findMany({ where, select })
        : table === 'opportunity'
          ? await prisma.opportunity.findMany({ where, select })
          : await prisma.researchPaper.findMany({ where, select });
  return new Set(rows.map((r) => r.id));
};

export async function knownIds(refs: { scholarships: string[]; professors: string[]; opportunities: string[]; papers: string[] }) {
  const [scholarships, professors, opportunities, papers] = await Promise.all([
    idsIn('scholarship', refs.scholarships),
    idsIn('professor', refs.professors),
    idsIn('opportunity', refs.opportunities),
    idsIn('researchPaper', refs.papers),
  ]);
  return { scholarships, professors, opportunities, papers };
}

export async function existingRefs(profileId: string) {
  const [apps, outreach, bookmarks] = await Promise.all([
    prisma.application.findMany({ where: { profileId }, select: { scholarshipId: true } }),
    prisma.outreachRecord.findMany({ where: { profileId }, select: { professorId: true, opportunityId: true } }),
    listBookmarks(profileId),
  ]);
  return {
    scholarships: new Set(apps.map((a) => a.scholarshipId)),
    outreachProfessors: new Set(outreach.flatMap((o) => (o.professorId ? [o.professorId] : []))),
    outreachOpportunities: new Set(outreach.flatMap((o) => (o.opportunityId ? [o.opportunityId] : []))),
    opportunities: new Set(bookmarks.opportunities),
    professors: new Set(bookmarks.professors),
    papers: new Set(bookmarks.papers),
  };
}

/** Writes an import plan in one transaction; imported cards go below the user's current cards, in the old order. */
export async function applyImport(profileId: string, plan: ImportPlan) {
  const last = async (model: 'application' | 'outreachRecord') => {
    const row =
      model === 'application'
        ? await prisma.application.findFirst({ where: { profileId }, orderBy: { orderIndex: 'desc' }, select: { orderIndex: true } })
        : await prisma.outreachRecord.findFirst({ where: { profileId }, orderBy: { orderIndex: 'desc' }, select: { orderIndex: true } });
    return row ? row.orderIndex + 1 : 0;
  };
  const appStart = await last('application');
  const outreachStart = await last('outreachRecord');
  const now = Date.now();

  await prisma.$transaction(async (tx) => {
    for (const [i, a] of plan.applications.entries()) {
      const app = await tx.application.create({
        data: {
          profileId,
          scholarshipId: a.scholarshipId,
          status: applicationStatusToDb(a.status),
          decision: decisionToDb(a.decision),
          notes: a.notes || null,
          deadline: a.deadline ? new Date(a.deadline) : null,
          orderIndex: appStart + i,
        },
      });
      if (a.tasks.length) {
        await tx.applicationTask.createMany({
          data: a.tasks.map((t, j) => ({ applicationId: app.id, title: t.title, isCompleted: t.isCompleted, createdAt: new Date(now + j) })),
        });
      }
    }
    if (plan.outreach.length) {
      await tx.outreachRecord.createMany({
        data: plan.outreach.map((o, i) => ({
          profileId,
          professorId: o.professorId ?? null,
          opportunityId: o.opportunityId ?? null,
          professorName: o.professorName,
          labName: o.labName ?? null,
          institution: o.institution,
          country: o.country ?? null,
          sourceUrl: o.sourceUrl ?? null,
          status: outreachStatusToDb(o.status),
          notes: o.notes,
          coldEmailDraft: o.coldEmailDraft ?? null,
          emailSubject: o.emailSubject ?? null,
          lastContactDate: o.lastContactDate ? new Date(o.lastContactDate) : null,
          nextFollowUpDate: o.nextFollowUpDate ? new Date(o.nextFollowUpDate) : null,
          orderIndex: outreachStart + i,
        })),
      });
    }
    if (plan.opportunities.length) {
      await tx.savedOpportunity.createMany({ data: plan.opportunities.map((opportunityId) => ({ profileId, opportunityId })), skipDuplicates: true });
    }
    if (plan.professors.length) {
      await tx.profFollow.createMany({ data: plan.professors.map((professorId) => ({ profileId, professorId })), skipDuplicates: true });
    }
    if (plan.papers.length) {
      await tx.savedPaper.createMany({ data: plan.papers.map((paperId) => ({ profileId, paperId })), skipDuplicates: true });
    }
  });
}
