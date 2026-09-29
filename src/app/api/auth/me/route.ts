import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserByEmail } from '@/lib/userStore';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    const stored = getUserByEmail(user.email);
    const enrichedUser = {
      ...user,
      onboardingCompleted: stored?.onboardingCompleted ?? user.onboardingCompleted ?? false,
      profileData: stored?.profileData,
    };
    return NextResponse.json({ authenticated: true, user: enrichedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
