import { NextResponse } from 'next/server';
import { parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { applyImport, ensureProfileId, existingRefs, knownIds, listApplications, listBookmarks, listOutreach } from '@/lib/userData';
import { planImport, referencedIds } from '@/lib/userDataImport';
import { importSchema } from '@/lib/userDataSchemas';

const IMPORT_BODY_LIMIT = 1024 * 1024;

/**
 * One-time import of the old browser-only data (Pipeline cards + bookmarks).
 * Old demo cards and ids that don't exist in the database are skipped, and anything the user already has is not
 * duplicated, so sending the same payload twice is harmless. Responds with the user's full data after the import.
 */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, importSchema, IMPORT_BODY_LIMIT);
  if (!body.ok) return body.response;
  try {
    const profileId = await ensureProfileId(userId);
    if (!profileId) return unauthorized();
    const [known, existing] = await Promise.all([knownIds(referencedIds(body.data)), existingRefs(profileId)]);
    const plan = planImport(body.data, { known, existing });
    await applyImport(profileId, plan);
    const [applications, outreach, bookmarks] = await Promise.all([listApplications(profileId), listOutreach(profileId), listBookmarks(profileId)]);
    return NextResponse.json({
      success: true,
      imported: {
        applications: plan.applications.length,
        outreach: plan.outreach.length,
        opportunities: plan.opportunities.length,
        professors: plan.professors.length,
        papers: plan.papers.length,
      },
      skipped: plan.skipped,
      data: { applications, outreach, bookmarks },
    });
  } catch (error) {
    return serverError('POST /api/import', error);
  }
}
