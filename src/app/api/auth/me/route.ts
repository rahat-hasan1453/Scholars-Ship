import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserByEmail, toSessionUser } from '@/lib/users';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json(
      { authenticated: true, user: { ...toSessionUser(user), profileData: user.profileData ?? undefined } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[HighScholar Auth] /me error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
