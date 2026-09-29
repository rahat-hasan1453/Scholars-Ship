import { NextResponse } from 'next/server';
import { getSessionUser, setSessionCookie } from '@/lib/auth';
import { updateUser, toSessionUser } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const profileData = await req.json();

    // Mark onboardingCompleted = true and store user preferences
    const updated = updateUser(sessionUser.email, {
      name: profileData.name || sessionUser.name,
      onboardingCompleted: true,
      profileData,
    });

    if (updated) {
      const newSession = toSessionUser(updated);
      await setSessionCookie(newSession);
      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully.',
        user: newSession,
      });
    }

    // Fallback if not found in memory store
    const fallbackSession = {
      ...sessionUser,
      onboardingCompleted: true,
    };
    await setSessionCookie(fallbackSession);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully.',
      user: fallbackSession,
    });
  } catch (error) {
    console.error('[HighScholar Auth] Complete onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding.' },
      { status: 500 }
    );
  }
}
