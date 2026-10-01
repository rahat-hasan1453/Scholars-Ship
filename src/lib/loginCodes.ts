import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import { rateLimitHit, rateLimitReset } from './rateLimit';
import { normalizeEmail } from './users';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code
const HOUR_SECONDS = 3600;
const MAX_CODES_PER_HOUR = 5; // codes sent to one email
const MAX_GUESSES_PER_HOUR = 10; // verify attempts per email across ALL its codes; a new code can't reset this

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

export type IssueResult = { ok: true; code: string } | { ok: false; retryAfterSeconds: number; rateLimited?: boolean };

export async function issueLoginCode(rawEmail: string): Promise<IssueResult> {
  const email = normalizeEmail(rawEmail);
  const existing = await prisma.loginCode.findUnique({ where: { email } });
  if (existing) {
    const waitMs = existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) return { ok: false, retryAfterSeconds: Math.ceil(waitMs / 1000) };
  }

  const sends = await rateLimitHit(`send:email:${email}`, MAX_CODES_PER_HOUR, HOUR_SECONDS);
  if (!sends.allowed) return { ok: false, retryAfterSeconds: sends.retryAfterSeconds, rateLimited: true };

  const code = randomInt(0, 100000).toString().padStart(5, '0');
  const data = { codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, createdAt: new Date() };
  await prisma.loginCode.upsert({ where: { email }, create: { email, ...data }, update: data });
  return { ok: true, code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'expired' | 'too_many_attempts' | 'invalid' }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

export async function verifyLoginCode(rawEmail: string, code: string): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail);
  const record = await prisma.loginCode.findUnique({ where: { email } });
  if (!record) return { ok: false, reason: 'missing' };
  if (Date.now() > record.expiresAt.getTime()) {
    await prisma.loginCode.delete({ where: { email } });
    return { ok: false, reason: 'expired' };
  }

  const guesses = await rateLimitHit(`verify:email:${email}`, MAX_GUESSES_PER_HOUR, HOUR_SECONDS);
  if (!guesses.allowed) return { ok: false, reason: 'locked', retryAfterSeconds: guesses.retryAfterSeconds };

  // Count the attempt atomically before comparing, so parallel guesses can't exceed the limit.
  const counted = await prisma.loginCode.updateMany({
    where: { email, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count === 0) return { ok: false, reason: 'too_many_attempts' };

  const expected = Buffer.from(record.codeHash);
  const actual = Buffer.from(hashCode(code.trim()));
  if (!timingSafeEqual(expected, actual)) {
    return { ok: false, reason: record.attempts + 1 >= MAX_ATTEMPTS ? 'too_many_attempts' : 'invalid' };
  }

  await prisma.loginCode.delete({ where: { email } });
  await rateLimitReset(`verify:email:${email}`);
  return { ok: true };
}
