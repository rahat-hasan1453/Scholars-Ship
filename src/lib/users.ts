import type { Prisma, User } from '@prisma/client';
import { prisma } from './prisma';
import type { AuthSessionUser } from './auth';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

/* Creates the account on first sign-in; on later sign-ins fills in Google details that were missing. */
export async function findOrCreateUser(data: {
  email: string;
  name?: string;
  avatar?: string;
  googleId?: string;
  verified?: boolean;
}): Promise<User> {
  const email = normalizeEmail(data.email);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    return prisma.user.create({
      data: {
        email,
        name: data.name?.trim() || email.split('@')[0],
        avatar: data.avatar,
        googleId: data.googleId,
        emailVerifiedAt: data.verified ? new Date() : null,
      },
    });
  }

  const updates: Prisma.UserUpdateInput = {};
  if (data.googleId && !existing.googleId) updates.googleId = data.googleId;
  if (data.avatar && !existing.avatar) updates.avatar = data.avatar;
  if (data.verified && !existing.emailVerifiedAt) updates.emailVerifiedAt = new Date();
  if (Object.keys(updates).length === 0) return existing;
  return prisma.user.update({ where: { email }, data: updates });
}

export function completeOnboarding(email: string, profileData: Prisma.InputJsonValue, name?: string): Promise<User> {
  return prisma.user.update({
    where: { email: normalizeEmail(email) },
    data: { onboardingCompleted: true, profileData, ...(name ? { name } : {}) },
  });
}

export function toSessionUser(user: User): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? undefined,
    googleId: user.googleId ?? undefined,
    onboardingCompleted: user.onboardingCompleted,
  };
}
