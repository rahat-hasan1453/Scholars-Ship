import { NextResponse } from 'next/server';
import { getUserByEmail, toSessionUser } from '@/lib/userStore';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your password.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email. Please sign up to create your account.' },
        { status: 404 }
      );
    }

    // Verify password if user has password set
    if (user.password && user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    const sessionUser = toSessionUser(user);

    // Set HTTP-only session cookie
    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      user: sessionUser,
      profileData: user.profileData,
    });
  } catch (error) {
    console.error('[HighScholar Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
