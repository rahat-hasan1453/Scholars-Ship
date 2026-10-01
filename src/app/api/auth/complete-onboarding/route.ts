import { NextResponse } from 'next/server';
import { getSessionUser, setSessionCookie } from '@/lib/auth';
import { completeOnboarding, toSessionUser } from '@/lib/users';

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Email always comes from the verified session, never from the request body.
    const profileData = { ...(await req.json()) };
    delete profileData.email;
    delete profileData.onboardingCompleted;
    const name = typeof profileData.name === 'string' && profileData.name.trim() ? profileData.name.trim() : undefined;
    const updated = await completeOnboarding(sessionUser.email, profileData, name);
    const newSession = toSessionUser(updated);
    await setSessionCookie(newSession);

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully.', user: newSession });
  } catch (error) {
    console.error('[HighScholar Auth] Complete onboarding error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete onboarding.' }, { status: 500 });
  }
}
