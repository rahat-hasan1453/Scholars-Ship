// Request body schemas for the user-data API (profile, pipeline, bookmarks, import).
// Every route parses its body with one of these; anything else gets a 400.
import { z } from 'zod';
import { APPLICATION_STATUSES, DECISIONS, DEGREE_LEVELS, OUTREACH_STATUSES } from '@/lib/userDataMapping';

const text = (max: number) => z.string().max(max);
const isoDate = z
  .string()
  .max(40)
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');
/** Ids of seeded rows (scholarships, professors, papers, ...) */
export const refId = z.string().min(1).max(100);
/** Client-generated ids for new rows, so optimistic cards keep their id after the save */
const newId = z.string().uuid();
const stringList = (maxItems: number, maxLen = 100) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

const score = (max: number) => z.number().finite().min(0).max(max);
export const testScoresSchema = z
  .object({ ielts: score(9).optional(), toefl: score(120).optional(), gre: score(340).optional(), gmat: score(800).optional() })
  .strict();

export const profileDetailsSchema = z
  .object({
    bio: text(2000).optional(),
    field: text(200).optional(),
    gradYear: text(10).optional(),
    intake: text(50).optional(),
    notifications: z.object({ deadlines: z.boolean(), digest: z.boolean() }).strict().optional(),
  })
  .strict();

// Uploaded photos arrive as data URLs from a <canvas> resize; ~375 KB of base64 is plenty for an avatar.
const PHOTO_MAX = 500_000;
const photo = z
  .string()
  .max(PHOTO_MAX)
  .refine((s) => s === '' || s.startsWith('data:image/') || s.startsWith('https://'), 'Photo must be an image data URL or https URL');

const profileFields = {
  name: z.string().trim().min(1).max(100),
  degreeLevel: z.enum(DEGREE_LEVELS),
  specializations: stringList(30),
  targetCountries: stringList(30),
  cgpa: z.number().finite().min(0).max(10).nullable(),
  testScores: testScoresSchema,
  avatar: photo,
  details: profileDetailsSchema,
};

export const profilePatchSchema = z
  .object(profileFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

/** Onboarding wizard payload. email / onboardingCompleted are accepted but ignored (they come from the session). */
export const onboardingSchema = z
  .object({
    ...profileFields,
    name: profileFields.name.optional(),
    cgpa: profileFields.cgpa.optional(),
    specializations: profileFields.specializations.optional(),
    targetCountries: profileFields.targetCountries.optional(),
    testScores: testScoresSchema.optional(),
    avatar: z.unknown().optional(),
    details: profileDetailsSchema.optional(),
    email: z.string().max(320).optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();

const taskInput = z.object({ id: newId.optional(), title: z.string().trim().min(1).max(300), isCompleted: z.boolean().optional() }).strict();

export const applicationCreateSchema = z
  .object({
    id: newId.optional(),
    scholarshipId: refId,
    status: z.enum(APPLICATION_STATUSES).optional(),
    decision: z.enum(DECISIONS).optional(),
    notes: text(5000).optional(),
    deadline: isoDate.nullable().optional(),
    tasks: z.array(taskInput).max(50).optional(),
  })
  .strict();

export const applicationPatchSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    decision: z.enum(DECISIONS).optional(),
    notes: text(5000).optional(),
    deadline: isoDate.nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const taskCreateSchema = taskInput;
export const taskPatchSchema = z
  .object({ title: z.string().trim().min(1).max(300).optional(), isCompleted: z.boolean().optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const reorderSchema = z.object({ ids: z.array(refId).min(1).max(1000) }).strict();

const outreachEditable = {
  status: z.enum(OUTREACH_STATUSES).optional(),
  notes: text(5000).optional(),
  coldEmailDraft: text(20_000).optional(),
  emailSubject: text(300).optional(),
  lastContactDate: isoDate.nullable().optional(),
  nextFollowUpDate: isoDate.nullable().optional(),
};

export const outreachCreateSchema = z
  .object({
    id: newId.optional(),
    professorId: refId.optional(),
    opportunityId: refId.optional(),
    professorName: z.string().trim().min(1).max(200),
    labName: text(200).optional(),
    institution: text(200),
    country: text(100).optional(),
    sourceUrl: text(2000).optional(),
    ...outreachEditable,
  })
  .strict();

export const outreachPatchSchema = z
  .object(outreachEditable)
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const BOOKMARK_KINDS = ['opportunities', 'professors', 'papers'] as const;
export type BookmarkKind = (typeof BOOKMARK_KINDS)[number];
export const bookmarkKindSchema = z.enum(BOOKMARK_KINDS);

// One-time import of the old localStorage data. Items are checked one by one in src/lib/userDataImport.ts,
// so a single broken old record is skipped instead of failing the whole import.
export const importSchema = z
  .object({
    applications: z.array(z.unknown()).max(300).default([]),
    outreach: z.array(z.unknown()).max(300).default([]),
    opportunities: z.array(z.unknown()).max(1000).default([]),
    professors: z.array(z.unknown()).max(1000).default([]),
    papers: z.array(z.unknown()).max(1000).default([]),
  })
  .strict();

export const importApplicationSchema = z.object({
  id: z.string().max(100).optional(),
  scholarshipId: refId,
  status: z.enum(APPLICATION_STATUSES).catch('Wishlist'),
  decision: z.enum(DECISIONS).catch('Pending'),
  notes: text(5000).catch(''),
  deadline: isoDate.optional().catch(undefined),
  tasks: z
    .array(z.object({ title: z.string().trim().min(1).max(300), isCompleted: z.boolean().catch(false) }))
    .max(50)
    .catch([]),
});

export const importOutreachSchema = z.object({
  id: z.string().max(100).optional(),
  professorId: refId.optional(),
  opportunityId: refId.optional(),
  professorName: z.string().trim().min(1).max(200),
  labName: text(200).optional().catch(undefined),
  institution: text(200).catch(''),
  country: text(100).optional().catch(undefined),
  sourceUrl: text(2000).optional().catch(undefined),
  status: z.enum(OUTREACH_STATUSES).catch('Prospect'),
  notes: text(5000).catch(''),
  coldEmailDraft: text(20_000).optional().catch(undefined),
  emailSubject: text(300).optional().catch(undefined),
  lastContactDate: isoDate.optional().catch(undefined),
  nextFollowUpDate: isoDate.optional().catch(undefined),
});

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type ImportApplication = z.infer<typeof importApplicationSchema>;
export type ImportOutreach = z.infer<typeof importOutreachSchema>;
