import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { deleteApplication, findProfileId, updateApplication } from '@/lib/userData';
import { applicationPatchSchema } from '@/lib/userDataSchemas';

type Ctx = { params: Promise<{ id: string }> };

/** Update status / decision / notes / deadline. Another user's card is a 404. */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, applicationPatchSchema);
  if (!body.ok) return body.response;
  const { id } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    const app = profileId ? await updateApplication(profileId, id, body.data) : null;
    if (!app) return notFound('Application not found.');
    return NextResponse.json({ success: true, data: app });
  } catch (error) {
    return serverError('PATCH /api/applications/[id]', error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    if (!profileId || !(await deleteApplication(profileId, id))) return notFound('Application not found.');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('DELETE /api/applications/[id]', error);
  }
}
