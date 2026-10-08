import { NextResponse } from 'next/server';
import { serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { findProfileId, listBookmarks } from '@/lib/userData';

/** Saved opportunities, professors and papers (ids). Saved scholarships are the user's applications. */
export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    const profileId = await findProfileId(userId);
    const data = profileId ? await listBookmarks(profileId) : { opportunities: [], professors: [], papers: [] };
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return serverError('GET /api/bookmarks', error);
  }
}
