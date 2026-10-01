import { NextResponse } from 'next/server';
import { consumeResetToken, updateUser } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid. Please request a new one.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const email = consumeResetToken(token);
    if (!email || !updateUser(email, { password })) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated. Please log in.' });
  } catch (error) {
    console.error('[HighScholar Auth] Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
