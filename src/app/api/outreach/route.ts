import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { createOutreach, ensureProfileId, findProfileId, listOutreach } from '@/lib/userData';
import { outreachCreateSchema } from '@/lib/userDataSchemas';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    const profileId = await findProfileId(userId);
    return NextResponse.json({ success: true, data: profileId ? await listOutreach(profileId) : [] });
  } catch (error) {
    return serverError('GET /api/outreach', error);
  }
}

/** Add a professor / feed post to Professor Outreach. Adding the same one again returns the existing card. */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, outreachCreateSchema);
  if (!body.ok) return body.response;
  try {
    const profileId = await ensureProfileId(userId);
    if (!profileId) return unauthorized();
    const result = await createOutreach(profileId, body.data);
    if (result.status === 'not_found') return notFound('Professor not found.');
    return NextResponse.json({ success: true, data: result.item }, { status: result.status === 'created' ? 201 : 200 });
  } catch (error) {
    return serverError('POST /api/outreach', error);
  }
}
