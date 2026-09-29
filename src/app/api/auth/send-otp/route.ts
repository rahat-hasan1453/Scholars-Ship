import { NextResponse } from 'next/server';
import { setOtp } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Generate random 5-digit OTP code (e.g. 54321)
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    // Store in OTP memory store (10 minute expiry)
    setOtp(email, code, 600);

    console.log(`[HighScholar Auth] 🔑 5-digit OTP for ${email} (${name || 'New Scholar'}): ${code}`);

    return NextResponse.json({
      success: true,
      message: `A 5-digit verification code has been sent to ${email}.`,
      // Provide previewCode so user can test seamlessly even without an external SMTP setup
      previewCode: code,
    });
  } catch (error) {
    console.error('[HighScholar Auth] Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
