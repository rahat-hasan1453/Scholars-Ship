import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { createApplication, ensureProfileId, findProfileId, listApplications } from '@/lib/userData';
import { applicationCreateSchema } from '@/lib/userDataSchemas';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    const profileId = await findProfileId(userId);
    return NextResponse.json({ success: true, data: profileId ? await listApplications(profileId) : [] });
  } catch (error) {
    return serverError('GET /api/applications', error);
  }
}

/** Track a scholarship (Save / Add application). Saving the same scholarship again returns the existing card. */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, applicationCreateSchema);
  if (!body.ok) return body.response;
  try {
    const profileId = await ensureProfileId(userId);
    if (!profileId) return unauthorized();
    const result = await createApplication(profileId, body.data);
    if (result.status === 'not_found') return notFound('Scholarship not found.');
    return NextResponse.json({ success: true, data: result.item }, { status: result.status === 'created' ? 201 : 200 });
  } catch (error) {
    return serverError('POST /api/applications', error);
  }
}
