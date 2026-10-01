import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import { normalizeEmail } from './users';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

export type IssueResult = { ok: true; code: string } | { ok: false; retryAfterSeconds: number };

export async function issueLoginCode(rawEmail: string): Promise<IssueResult> {
  const email = normalizeEmail(rawEmail);
  const existing = await prisma.loginCode.findUnique({ where: { email } });
  if (existing) {
    const waitMs = existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) return { ok: false, retryAfterSeconds: Math.ceil(waitMs / 1000) };
  }

  const code = randomInt(0, 100000).toString().padStart(5, '0');
  const data = { codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, createdAt: new Date() };
  await prisma.loginCode.upsert({ where: { email }, create: { email, ...data }, update: data });
  return { ok: true, code };
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'missing' | 'expired' | 'too_many_attempts' | 'invalid' };

export async function verifyLoginCode(rawEmail: string, code: string): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail);
  const record = await prisma.loginCode.findUnique({ where: { email } });
  if (!record) return { ok: false, reason: 'missing' };
  if (Date.now() > record.expiresAt.getTime()) {
    await prisma.loginCode.delete({ where: { email } });
    return { ok: false, reason: 'expired' };
  }

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
  return { ok: true };
}
