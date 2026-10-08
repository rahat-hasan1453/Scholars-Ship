import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { getSessionUser, setSessionCookie } from '@/lib/auth';
import { completeOnboarding, toSessionUser } from '@/lib/users';
import { parseBody } from '@/lib/apiHelpers';
import { onboardingSchema } from '@/lib/userDataSchemas';
import { saveOnboardingProfile } from '@/lib/userData';

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Schema + size limit (BUG-09). Email / onboardingCompleted always come from the session, never from the body.
    const body = await parseBody(req, onboardingSchema);
    if (!body.ok) return body.response;
    const { email: _email, onboardingCompleted: _done, avatar: _avatar, ...profileData } = body.data;
    void _email;
    void _done;
    void _avatar;

    const updated = await completeOnboarding(sessionUser.email, profileData as Prisma.InputJsonValue, profileData.name);
    await saveOnboardingProfile(updated.id, profileData);
    const newSession = toSessionUser(updated);
    await setSessionCookie(newSession);

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully.', user: newSession });
  } catch (error) {
    console.error('[HighScholar Auth] Complete onboarding error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete onboarding.' }, { status: 500 });
  }
}
