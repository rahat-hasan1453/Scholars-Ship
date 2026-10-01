/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
/* In-memory stand-in for the Prisma client: only the calls src/lib uses. No database needed. */
type Row = Record<string, any>;

export function createFakePrisma() {
  const loginCodes = new Map<string, Row>();
  const users = new Map<string, Row>();
  let nextId = 1;

  return {
    _loginCodes: loginCodes,
    _users: users,
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
