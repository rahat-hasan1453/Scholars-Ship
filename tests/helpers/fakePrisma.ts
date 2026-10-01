/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { Prisma } from '@prisma/client';

/* In-memory stand-in for the Prisma client: only the calls src/lib uses. No database needed. */
type Row = Record<string, any>;

export function createFakePrisma() {
  const loginCodes = new Map<string, Row>();
  const users = new Map<string, Row>();
  const rateLimits = new Map<string, Row>();
  // Supports the windowStart filters used by src/lib/rateLimit.ts: { gt } and { lte } / { lt }.
  const windowMatches = (row: Row, f: any) =>
    !f || ((f.gt === undefined || row.windowStart > f.gt) && (f.lte === undefined || row.windowStart <= f.lte) && (f.lt === undefined || row.windowStart < f.lt));
  let nextId = 1;

  return {
    _loginCodes: loginCodes,
    _users: users,
    _rateLimits: rateLimits,
    loginCode: {
      findUnique: async ({ where }: any) => (loginCodes.has(where.email) ? { ...loginCodes.get(where.email) } : null),
      upsert: async ({ where, create, update }: any) => {
        const row = loginCodes.has(where.email) ? { ...loginCodes.get(where.email), ...update } : { ...create };
        loginCodes.set(where.email, row);
        return row;
      },
      delete: async ({ where }: any) => {
        const row = loginCodes.get(where.email);
        loginCodes.delete(where.email);
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        const row = loginCodes.get(where.email);
        if (!row || !(row.attempts < where.attempts.lt)) return { count: 0 };
        row.attempts += data.attempts.increment;
        return { count: 1 };
      },
    },
    rateLimit: {
      findUnique: async ({ where }: any) => (rateLimits.has(where.key) ? { ...rateLimits.get(where.key) } : null),
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const row of rateLimits.values()) {
          if ((where.key && row.key !== where.key) || !windowMatches(row, where.windowStart)) continue;
          if (typeof data.count === 'object') row.count += data.count.increment;
          else if (data.count !== undefined) row.count = data.count;
          if (data.windowStart) row.windowStart = data.windowStart;
          count++;
        }
        return { count };
      },
      create: async ({ data }: any) => {
        if (rateLimits.has(data.key)) throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });
        rateLimits.set(data.key, { ...data });
        return { ...data };
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (const [key, row] of rateLimits) {
          if ((where.key && key !== where.key) || !windowMatches(row, where.windowStart)) continue;
          rateLimits.delete(key);
          count++;
        }
        return { count };
      },
    },
    user: {
      findUnique: async ({ where }: any) => (users.has(where.email) ? { ...users.get(where.email) } : null),
      create: async ({ data }: any) => {
        const row = { id: `user-${nextId++}`, onboardingCompleted: false, avatar: null, googleId: null, profileData: null, emailVerifiedAt: null, ...data };
        users.set(row.email, row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = users.get(where.email);
        if (!row) throw new Error('Record to update not found.');
        Object.assign(row, data);
        return row;
      },
    },
  };
}
