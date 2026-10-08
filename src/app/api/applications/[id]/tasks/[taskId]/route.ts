import { NextResponse } from 'next/server';
import { notFound, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { deleteTask, findProfileId, updateTask } from '@/lib/userData';
import { taskPatchSchema } from '@/lib/userDataSchemas';

type Ctx = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, taskPatchSchema);
  if (!body.ok) return body.response;
  const { id, taskId } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    const task = profileId ? await updateTask(profileId, id, taskId, body.data) : null;
    if (!task) return notFound('Task not found.');
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return serverError('PATCH /api/applications/[id]/tasks/[taskId]', error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const { id, taskId } = await ctx.params;
  try {
    const profileId = await findProfileId(userId);
    if (!profileId || !(await deleteTask(profileId, id, taskId))) return notFound('Task not found.');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('DELETE /api/applications/[id]/tasks/[taskId]', error);
  }
}
