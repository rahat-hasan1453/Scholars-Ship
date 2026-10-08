import { NextResponse } from 'next/server';
import { parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { findProfileId, reorder } from '@/lib/userData';
import { reorderSchema } from '@/lib/userDataSchemas';

/** Saves the Pipeline card order: body { ids } in display order. Ids that aren't the user's are ignored. */
export async function PUT(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, reorderSchema);
  if (!body.ok) return body.response;
  try {
    const profileId = await findProfileId(userId);
    const updated = profileId ? await reorder('application', profileId, body.data.ids) : 0;
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return serverError('PUT /api/applications/order', error);
  }
}
