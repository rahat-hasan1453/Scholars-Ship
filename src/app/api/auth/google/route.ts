import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { OAUTH_STATE_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || clientId.includes('your-google-client-id')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'google_config_missing');
    return NextResponse.redirect(loginUrl);
  }

  // CSRF protection: the callback only accepts the state value stored in this browser's cookie.
  const state = randomBytes(32).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/callback/google',
    maxAge: 60 * 10,
  });
  return response;
}
