import { prisma } from './prisma';
import { cookies } from 'next/headers';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
  onboardingCompleted?: boolean;
}

export const SESSION_COOKIE_NAME = 'highscholar_session';

/**
 * Encodes session user payload into a base64url string
 */
export function encodeSession(user: AuthSessionUser): string {
  const jsonStr = JSON.stringify(user);
  return Buffer.from(jsonStr).toString('base64url');
}

/**
 * Decodes session string back to user payload
 */
export function decodeSession(token: string): AuthSessionUser | null {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.email && parsed.name) {
      return parsed as AuthSessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upserts a Google user into the database via Prisma if DATABASE_URL is configured.
 * Safely falls back if database is not reachable.
 */
export async function upsertGoogleUser(userData: {
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}): Promise<AuthSessionUser> {
  if (!process.env.DATABASE_URL) {
    console.warn('[HighScholar Auth] DATABASE_URL is not set. Proceeding without persistent DB write.');
    return {
      id: userData.googleId,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      googleId: userData.googleId,
    };
  }

  try {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        avatar: userData.avatar,
        googleId: userData.googleId,
      },
      create: {
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        googleId: userData.googleId,
        profile: {
          create: {
            degreeLevel: 'MASTERS',
            specializations: ['Computer Science'],
            targetCountries: ['USA', 'Canada'],
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || userData.avatar,
      googleId: user.googleId || userData.googleId,
    };
  } catch (error) {
    console.error('[HighScholar Auth] Error persisting user to database:', error);
    return {
      id: userData.googleId,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      googleId: userData.googleId,
    };
  }
}

/**
 * Sets auth cookie on incoming/outgoing response
 */
export async function setSessionCookie(user: AuthSessionUser) {
  const cookieStore = await cookies();
  const token = encodeSession(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Retrieves the current session user from cookies
 */
export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/**
 * Removes session cookie on logout
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
