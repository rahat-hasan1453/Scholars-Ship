import { NextRequest, NextResponse } from 'next/server';
import { createResetToken, getUserByEmail } from '@/lib/userStore';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = {
      success: true,
      message: `If an account exists for ${normalizedEmail}, a password reset link has been sent.`,
    };

    const user = getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const token = createResetToken(normalizedEmail);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HighScholar Auth] Password reset link for ${normalizedEmail}: ${resetLink}`);
    }

    const emailResult = await sendPasswordResetEmail(normalizedEmail, resetLink, user.name);
    if (!emailResult.success) {
      console.warn(`[HighScholar Auth] Reset email delivery failed for ${normalizedEmail}: ${emailResult.error}`);
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send the reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error('[HighScholar Auth] Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send the reset email. Please try again.' },
      { status: 500 }
    );
  }
}
