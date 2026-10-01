import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { verifyLoginCode } from '@/lib/loginCodes';
import { findOrCreateUser, toSessionUser } from '@/lib/users';

const MESSAGES = {
  missing: 'No code found for this email. Please request a new code.',
  expired: 'This code has expired. Please request a new code.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
  invalid: 'Incorrect code. Please check your email and try again.',
} as const;

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{5}$/.test(code.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter the 5-digit code.' }, { status: 400 });
    }

    const result = await verifyLoginCode(email, code);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: MESSAGES[result.reason], reason: result.reason }, { status: 400 });
    }

    const user = await findOrCreateUser({ email, verified: true });
    const sessionUser = toSessionUser(user);
    await setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser, profileData: user.profileData ?? undefined });
  } catch (error) {
    console.error('[HighScholar Auth] Verify code error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
