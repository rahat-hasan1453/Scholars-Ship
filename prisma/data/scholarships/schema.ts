// Rules every scholarship entry must follow. `npm run data:scholarships:check` and
// tests/unit/scholarshipData.test.ts run these; see docs/SCHOLARSHIP-VERIFICATION.md for how to fill an entry.
import { z } from 'zod';
import { ANY_COUNTRY, WORLD_COUNTRIES } from '../../../src/data/countries';
import { SUBJECTS } from '../../../src/data/subjectCatalog';

/** Matches every subject in the Subject filter */
export const ALL_FIELDS = 'All fields';

const COUNTRY_VALUES = new Set(WORLD_COUNTRIES.map((c) => c.value));
const COUNTRY_CODES = new Set(WORLD_COUNTRIES.map((c) => c.code.toLowerCase()));
const SUBJECT_VALUES = new Set<string>([...SUBJECTS, ALL_FIELDS]);

/** `gov-<country code>-<slug>`, e.g. gov-jp-mext-research. `int` is for international bodies (World Bank, ADB …) */
export const NEW_ID = /^gov-([a-z]{2,3})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** The 24 entries from before the batches keep their ids: bookmarks and applications point at them */
const LEGACY_ID = /^sch_[a-z0-9_]+$/;

const httpsUrl = z.string().url().refine((u) => u.startsWith('https://'), 'must be an https:// link');
const country = z.string().refine((c) => COUNTRY_VALUES.has(c), (c) => ({
  message: `"${c}" is not in src/data/countries.ts (add it there first, using the same value)`,
}));
/** Where you study: a catalog country, or "Any country" when the scholarship can be used in many countries */
const studyCountry = z.string().refine((c) => c === ANY_COUNTRY || COUNTRY_VALUES.has(c), (c) => ({
  message: `"${c}" is not in src/data/countries.ts (add it there first, using the same value), and is not "${ANY_COUNTRY}"`,
}));
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD').refine((d) => !Number.isNaN(Date.parse(d)), 'not a real date');

export const scholarshipSchema = z
  .object({
    id: z.string().regex(NEW_ID, 'id must look like gov-<country code>-<slug>, e.g. gov-jp-mext-research').refine(
      (id) => {
        const code = NEW_ID.exec(id)?.[1];
        return code === 'int' || (code !== undefined && COUNTRY_CODES.has(code));
      },
      'the country code in the id is not in src/data/countries.ts (use "int" for international bodies)',
    ),
    title: z.string().trim().min(3),
    provider: z.string().trim().min(2),
    providerShort: z.string().trim().min(1).optional(),
    /** Country that funds the scholarship, e.g. "Japan". Left out for international bodies */
    providerCountry: country.optional(),
    deadline: z.string().datetime({ message: 'deadline must be an ISO date-time, e.g. 2026-11-01T23:59:00Z' }),
    deadlineEstimated: z.boolean(),
    deadlineNote: z.string().trim().min(1).optional(),
    fundingAmount: z.string().trim().min(1),
    fundingType: z.enum(['FULL', 'PARTIAL', 'TUITION_WAIVER', 'RESEARCH_ASSISTANTSHIP']),
    degreeLevels: z.array(z.enum(['Bachelors', 'Masters', 'PhD'])).min(1),
    /** Where you study */
    countries: z.array(studyCountry).min(1),
    /** Subjects from src/data/subjectCatalog.ts or ALL_FIELDS. Other words still match the filter through
     * subjectTagsFor(), so the checker only warns about them */
    specializations: z.array(z.string().trim().min(1)).min(1),
    /** Who can apply, only when the source lists it. Empty = the source doesn't say */
    eligibleNationalities: z.array(z.string().trim().min(2)).optional(),
    requirements: z
      .object({
        minCgpa: z.number().positive().max(10).optional(),
        minIelts: z.number().min(0).max(9).optional(),
        minToefl: z.number().int().min(0).max(120).optional(),
        minWorkYears: z.number().min(0).max(30).optional(),
        notes: z.string().trim().min(1).optional(),
      })
      .strict(),
    admissionSummary: z.string().trim().min(1).optional(),
    applySteps: z.array(z.string().trim().min(1)).optional(),
    officialUrl: httpsUrl,
    /** The page the facts were read from */
    sourceUrl: httpsUrl,
    /** Day the entry was last checked against sourceUrl */
    verifiedOn: isoDay.refine((d) => Date.parse(d) <= Date.now(), 'verifiedOn is in the future'),
    description: z.string().trim().min(20),
    featured: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1)),
  })
  .strict();

/** Same rules, but with the old `sch_…` id */
export const curatedSchema = scholarshipSchema.extend({ id: z.string().regex(LEGACY_ID) });

export type ScholarshipSeed = z.infer<typeof scholarshipSchema>;
/** Entries in _curated.ts: verifiedOn defaults to CURATED_VERIFIED_ON in index.ts; set it on an entry re-checked later */
export type CuratedSeed = Omit<ScholarshipSeed, 'verifiedOn'> & { verifiedOn?: string };

/** Specializations the Subject filter only matches by free-text rules (not an error) */
export const offCatalogSubjects = (s: Pick<ScholarshipSeed, 'specializations'>) =>
  s.specializations.filter((x) => !SUBJECT_VALUES.has(x));
