import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'highscholar_session';

function decodeSessionToken(token: string) {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = sessionCookie ? decodeSessionToken(sessionCookie) : null;

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isOnboardingPage = pathname === '/onboarding';

  // 2. Unauthenticated user logic
  if (!sessionUser) {
    if (!isAuthPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Authenticated user logic
  // Case A: User is already onboarded
  if (sessionUser.onboardingCompleted) {
    // If they attempt to visit login, signup, or onboarding again, redirect to dashboard
    if (isAuthPage || isOnboardingPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Case B: User has NOT completed onboarding yet
  if (!sessionUser.onboardingCompleted) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    if (!isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
