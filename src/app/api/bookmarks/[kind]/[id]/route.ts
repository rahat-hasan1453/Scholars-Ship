import { NextResponse } from 'next/server';
import { jsonError, notFound, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { addBookmark, ensureProfileId, findProfileId, removeBookmark } from '@/lib/userData';
import { bookmarkKindSchema, refId } from '@/lib/userDataSchemas';

type Ctx = { params: Promise<{ kind: string; id: string }> };

async function target(ctx: Ctx) {
  const { kind, id } = await ctx.params;
  const k = bookmarkKindSchema.safeParse(kind);
  const i = refId.safeParse(id);
  return k.success && i.success ? { kind: k.data, id: i.data } : null;
}

/** Save: PUT /api/bookmarks/{opportunities|professors|papers}/{id} (idempotent) */
export async function PUT(_req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const t = await target(ctx);
  if (!t) return jsonError(400, 'Invalid request.');
  try {
    const profileId = await ensureProfileId(userId);
    if (!profileId) return unauthorized();
    if (!(await addBookmark(profileId, t.kind, t.id))) return notFound('This item can’t be saved yet.');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('PUT /api/bookmarks', error);
  }
}

/** Unsave (idempotent) */
export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const t = await target(ctx);
  if (!t) return jsonError(400, 'Invalid request.');
  try {
    const profileId = await findProfileId(userId);
    if (profileId) await removeBookmark(profileId, t.kind, t.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('DELETE /api/bookmarks', error);
  }
}
