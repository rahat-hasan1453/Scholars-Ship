import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { addTask, findProfileId } from '@/lib/userData';
import { taskCreateSchema } from '@/lib/userDataSchemas';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, taskCreateSchema);
  if (!body.ok) return body.response;
  const { id } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    const task = profileId ? await addTask(profileId, id, body.data) : null;
    if (!task) return notFound('Application not found.');
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return serverError('POST /api/applications/[id]/tasks', error);
  }
}
