import { NextResponse } from 'next/server';
import { verifyOtp, getUserByEmail, saveUser, toSessionUser } from '@/lib/userStore';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, name, password } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    // Verify 5-digit OTP
    const verification = verifyOtp(email, otp);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.reason || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    // Check if user already exists or create new
    const existing = getUserByEmail(email);
    const userId = existing?.id || `usr_${Date.now()}`;
    const userName = name?.trim() || existing?.name || 'New Scholar';

    const savedUser = saveUser({
      id: userId,
      email: email.trim().toLowerCase(),
      name: userName,
      password: password || existing?.password || 'default_pass',
      avatar: existing?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      onboardingCompleted: false, // New user needs onboarding
      createdAt: existing?.createdAt || new Date().toISOString(),
    });

    const sessionUser = toSessionUser(savedUser);

    // Set HTTP-only session cookie
    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified.',
      user: sessionUser,
    });
  } catch (error) {
    console.error('[HighScholar Auth] Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
