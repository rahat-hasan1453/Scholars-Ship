import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type RateLimitResult = { allowed: boolean; count: number; retryAfterSeconds: number };

/* Client IP as set by Vercel (x-forwarded-for is overwritten by the platform, so its first value can be trusted there). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/*
 * Counts one hit for `key` in a fixed window and says whether it is still within `limit`.
 * The increment is a single UPDATE, so parallel requests can't slip past the limit.
 */
export async function rateLimitHit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowSeconds * 1000);

  // Window still open: add one.
  const open = await prisma.rateLimit.updateMany({ where: { key, windowStart: { gt: cutoff } }, data: { count: { increment: 1 } } });
  if (open.count === 0) {
    // Window expired: start a fresh one.
    const restarted = await prisma.rateLimit.updateMany({ where: { key, windowStart: { lte: cutoff } }, data: { count: 1, windowStart: now } });
    if (restarted.count === 0) {
      try {
        await prisma.rateLimit.create({ data: { key, count: 1, windowStart: now } });
      } catch (error) {
        // A parallel first hit created the row a moment ago: count ours on top of it.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
        await prisma.rateLimit.updateMany({ where: { key }, data: { count: { increment: 1 } } });
      }
    }
  }

  const row = await prisma.rateLimit.findUnique({ where: { key } });
  const count = row?.count ?? 1;
  const windowEnd = (row?.windowStart.getTime() ?? now.getTime()) + windowSeconds * 1000;

  // Housekeeping: windows are at most an hour, so anything a day old is dead.
  if (Math.random() < 0.01) {
    prisma.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } } }).catch(() => {});
  }

  return { allowed: count <= limit, count, retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000)) };
}

export async function rateLimitReset(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export function waitText(seconds: number): string {
  return seconds >= 90 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`;
}
