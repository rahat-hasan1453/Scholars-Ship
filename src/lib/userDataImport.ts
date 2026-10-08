// One-time import of the pre-database localStorage data (Pipeline + bookmarks). Pure planning step: validate each
// old item, drop the demo records and ids that don't exist in the database, and dedupe against the payload itself
// and against what the user already has. Unit-tested in tests/unit/userDataImport.test.ts.
import { DEMO_RECORD_IDS } from '@/lib/legacyStorage';
import { importApplicationSchema, importOutreachSchema, refId, type ImportApplication, type ImportOutreach } from '@/lib/userDataSchemas';

export interface ImportPayload {
  applications: unknown[];
  outreach: unknown[];
  opportunities: unknown[];
  professors: unknown[];
  papers: unknown[];
}

export interface ImportContext {
  /** Ids that exist in the database */
  known: { scholarships: Set<string>; professors: Set<string>; opportunities: Set<string>; papers: Set<string> };
  /** What the user already has */
  existing: {
    scholarships: Set<string>;
    outreachProfessors: Set<string>;
    outreachOpportunities: Set<string>;
    opportunities: Set<string>;
    professors: Set<string>;
    papers: Set<string>;
  };
}

export interface ImportPlan {
  applications: ImportApplication[];
  outreach: (ImportOutreach & { professorId?: string })[];
  opportunities: string[];
  professors: string[];
  papers: string[];
  skipped: number;
}

const isDemo = (item: unknown) =>
  typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'string' && DEMO_RECORD_IDS.has((item as { id: string }).id);

/** Every id the payload refers to, so the route can look them all up in one query per table */
export function referencedIds(payload: ImportPayload) {
  const pick = (items: unknown[], key: string) =>
    items.flatMap((i) => {
      const v = typeof i === 'object' && i !== null ? (i as Record<string, unknown>)[key] : undefined;
      return typeof v === 'string' && v.length <= 100 ? [v] : [];
    });
  const ids = (items: unknown[]) => items.filter((v): v is string => typeof v === 'string' && v.length <= 100);
  return {
    scholarships: [...new Set(pick(payload.applications, 'scholarshipId'))],
    professors: [...new Set([...pick(payload.outreach, 'professorId'), ...ids(payload.professors)])],
    opportunities: [...new Set([...pick(payload.outreach, 'opportunityId'), ...ids(payload.opportunities)])],
    papers: [...new Set(ids(payload.papers))],
  };
}

export function planImport(payload: ImportPayload, ctx: ImportContext): ImportPlan {
  let skipped = 0;
  const skip = () => void skipped++;

  const applications: ImportApplication[] = [];
  const seenScholarships = new Set(ctx.existing.scholarships);
  for (const raw of payload.applications) {
    const parsed = importApplicationSchema.safeParse(raw);
    if (isDemo(raw) || !parsed.success || !ctx.known.scholarships.has(parsed.data.scholarshipId) || seenScholarships.has(parsed.data.scholarshipId)) {
      skip();
      continue;
    }
    seenScholarships.add(parsed.data.scholarshipId);
    applications.push(parsed.data);
  }

  const outreach: ImportPlan['outreach'] = [];
  const seenProfs = new Set(ctx.existing.outreachProfessors);
  const seenOpps = new Set(ctx.existing.outreachOpportunities);
  for (const raw of payload.outreach) {
    const parsed = importOutreachSchema.safeParse(raw);
    if (isDemo(raw) || !parsed.success) {
      skip();
      continue;
    }
    const rec = { ...parsed.data };
    const profOk = !!rec.professorId && ctx.known.professors.has(rec.professorId);
    const oppOk = !!rec.opportunityId && ctx.known.opportunities.has(rec.opportunityId);
    if (!profOk) delete rec.professorId;
    if (!oppOk) delete rec.opportunityId;
    const dupe = (profOk && seenProfs.has(rec.professorId!)) || (oppOk && seenOpps.has(rec.opportunityId!));
    if ((!profOk && !oppOk) || dupe) {
      skip();
      continue;
    }
    if (profOk) seenProfs.add(rec.professorId!);
    if (oppOk) seenOpps.add(rec.opportunityId!);
    outreach.push(rec);
  }

  const bookmarks = (items: unknown[], known: Set<string>, existing: Set<string>) => {
    const out: string[] = [];
    const seen = new Set(existing);
    for (const raw of items) {
      const id = refId.safeParse(raw);
      if (!id.success || !known.has(id.data) || seen.has(id.data)) {
        skip();
        continue;
      }
      seen.add(id.data);
      out.push(id.data);
    }
    return out;
  };

  return {
    applications,
    outreach,
    opportunities: bookmarks(payload.opportunities, ctx.known.opportunities, ctx.existing.opportunities),
    professors: bookmarks(payload.professors, ctx.known.professors, ctx.existing.professors),
    papers: bookmarks(payload.papers, ctx.known.papers, ctx.existing.papers),
    skipped,
  };
}
