import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { deleteOutreach, findProfileId, updateOutreach } from '@/lib/userData';
import { outreachPatchSchema } from '@/lib/userDataSchemas';

type Ctx = { params: Promise<{ id: string }> };

/** Update status / notes / email draft / dates. Another user's card is a 404. */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, outreachPatchSchema);
  if (!body.ok) return body.response;
  const { id } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    const rec = profileId ? await updateOutreach(profileId, id, body.data) : null;
    if (!rec) return notFound('Outreach record not found.');
    return NextResponse.json({ success: true, data: rec });
  } catch (error) {
    return serverError('PATCH /api/outreach/[id]', error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    if (!profileId || !(await deleteOutreach(profileId, id))) return notFound('Outreach record not found.');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('DELETE /api/outreach/[id]', error);
  }
}
