import { NextResponse } from 'next/server';
import { setOtp } from '@/lib/userStore';
import { sendOtpEmail } from '@/lib/email';

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

    const normalizedEmail = email.trim().toLowerCase();

    // Generate random 5-digit OTP code (e.g. 54321)
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    // Store in OTP memory store (10 minute expiry)
    setOtp(normalizedEmail, code, 600);

    // Send real email to user's inbox
    const emailResult = await sendOtpEmail(normalizedEmail, code, name);

    if (!emailResult.success) {
      console.warn(`[HighScholar Auth] Email delivery note for ${normalizedEmail}: ${emailResult.error}`);
      // If SMTP is not yet configured, provide a clear helpful message
      if (emailResult.error?.includes('credentials')) {
        return NextResponse.json({
          success: false,
          error: 'Email service credentials not configured. Please add SMTP_USER & SMTP_PASSWORD or RESEND_API_KEY in Vercel / .env.local to send real emails to inboxes.',
        }, { status: 500 });
      }
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send verification code to your email. Please check your email address.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `A 5-digit verification code has been sent to ${normalizedEmail}. Please check your inbox.`,
    });
  } catch (error) {
    console.error('[HighScholar Auth] Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
