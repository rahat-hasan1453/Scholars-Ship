import { NextResponse } from 'next/server';
import { parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { getProfile, updateProfile } from '@/lib/userData';
import { profilePatchSchema } from '@/lib/userDataSchemas';

// Profile photos are data URLs, so this route allows a bigger body than the others
const PROFILE_BODY_LIMIT = 600 * 1024;

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    const profile = await getProfile(userId);
    if (!profile) return unauthorized();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return serverError('GET /api/profile', error);
  }
}

export async function PATCH(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, profilePatchSchema, PROFILE_BODY_LIMIT);
  if (!body.ok) return body.response;
  try {
    const profile = await updateProfile(userId, body.data);
    if (!profile) return unauthorized();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return serverError('PATCH /api/profile', error);
  }
}
