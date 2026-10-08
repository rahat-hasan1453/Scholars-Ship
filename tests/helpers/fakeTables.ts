/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

/* Generic in-memory Prisma models for the user-data routes (profile, Pipeline, bookmarks). Supports the query
   shapes src/lib/userData.ts uses: equality / { in } filters, compound unique keys, orderBy, select, include,
   unique constraints (P2002) and $transaction. */
type Row = Record<string, any>;
type Relation = { model: string; many: boolean; localKey: string; foreignKey: string };

const DEFAULTS: Record<string, () => Row> = {
  userProfile: () => ({ specializations: [], targetCountries: [], cgpa: null, testScores: null, photo: null, details: null }),
  application: () => ({ status: 'WISHLIST', decision: 'PENDING', notes: null, deadline: null, orderIndex: 0 }),
  applicationTask: () => ({ isCompleted: false, dueDate: null }),
  outreachRecord: () => ({
    status: 'PROSPECT', notes: '', orderIndex: 0, professorId: null, opportunityId: null, labName: null, country: null,
    sourceUrl: null, coldEmailDraft: null, emailSubject: null, lastContactDate: null, nextFollowUpDate: null,
  }),
};

const UNIQUE: Record<string, string[][]> = {
  userProfile: [['userId']],
  savedOpportunity: [['profileId', 'opportunityId']],
  profFollow: [['profileId', 'professorId']],
  savedPaper: [['profileId', 'paperId']],
};

const RELATIONS: Record<string, Record<string, Relation>> = {
  application: {
    scholarship: { model: 'scholarship', many: false, localKey: 'scholarshipId', foreignKey: 'id' },
    tasks: { model: 'applicationTask', many: true, localKey: 'id', foreignKey: 'applicationId' },
  },
};

const p2002 = () => new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
      if ('in' in cond) return cond.in.includes(row[key]);
      // compound unique, e.g. profileId_opportunityId: { profileId, opportunityId }
      if (key.includes('_')) return matches(row, cond);
      return Object.entries(cond).every(([op, v]: [string, any]) =>
        op === 'lt' ? row[key] < v : op === 'lte' ? row[key] <= v : op === 'gt' ? row[key] > v : op === 'gte' ? row[key] >= v : op === 'not' ? row[key] !== v : true,
      );
    }
    return (row[key] ?? null) === (cond ?? null);
  });
}

function sortRows(rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;
  const keys: [string, 'asc' | 'desc'][] = (Array.isArray(orderBy) ? orderBy : [orderBy]).flatMap((o: Row) => Object.entries(o) as [string, 'asc' | 'desc'][]);
  return [...rows].sort((a, b) => {
    for (const [k, dir] of keys) {
      const av = a[k] instanceof Date ? a[k].getTime() : a[k];
      const bv = b[k] instanceof Date ? b[k].getTime() : b[k];
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

export function createFakeTables() {
  const tables: Record<string, Map<string, Row>> = {};
  const table = (name: string) => (tables[name] ??= new Map());
  let tick = 0;
  // Strictly increasing timestamps so "newest first" ordering is deterministic
  const stamp = () => new Date(Date.UTC(2026, 0, 1) + tick++ * 1000);

  const shape = (model: string, row: Row | undefined, args: any = {}): Row | null => {
    if (!row) return null;
    let out: Row = { ...row };
    if (args.include) {
      for (const [rel, opt] of Object.entries(args.include as Record<string, any>)) {
        const r = RELATIONS[model]?.[rel];
        if (!r || !opt) continue;
        const related = [...table(r.model).values()].filter((x) => x[r.foreignKey] === row[r.localKey]);
        out[rel] = r.many ? sortRows(related, opt.orderBy).map((x) => ({ ...x })) : related[0] ? { ...related[0] } : null;
      }
    }
    if (args.select) out = Object.fromEntries(Object.keys(args.select).filter((k) => args.select[k]).map((k) => [k, out[k]]));
    return out;
  };

  const checkUnique = (model: string, row: Row, ignoreId?: string) => {
    if ([...table(model).values()].some((x) => x.id === row.id && x.id !== ignoreId)) throw p2002();
    for (const fields of UNIQUE[model] ?? []) {
      if ([...table(model).values()].some((x) => x.id !== ignoreId && fields.every((f) => x[f] === row[f]))) throw p2002();
    }
  };

  const model = (name: string) => ({
    findUnique: async (args: any) => shape(name, [...table(name).values()].find((r) => matches(r, args.where)), args),
    findFirst: async (args: any = {}) => shape(name, sortRows([...table(name).values()].filter((r) => matches(r, args.where)), args.orderBy)[0], args),
    findMany: async (args: any = {}) =>
      sortRows([...table(name).values()].filter((r) => matches(r, args.where)), args.orderBy).map((r) => shape(name, r, args)!),
    count: async (args: any = {}) => [...table(name).values()].filter((r) => matches(r, args.where)).length,
    create: async (args: any) => {
      const t = stamp();
      const row = { id: randomUUID(), ...(DEFAULTS[name]?.() ?? {}), createdAt: t, updatedAt: t, ...args.data };
      checkUnique(name, row);
      table(name).set(row.id, row);
      return shape(name, row, args)!;
    },
    createMany: async (args: any) => {
      let count = 0;
      for (const data of args.data) {
        const t = stamp();
        const row = { id: randomUUID(), ...(DEFAULTS[name]?.() ?? {}), createdAt: t, updatedAt: t, ...data };
        try {
          checkUnique(name, row);
        } catch (e) {
          if (args.skipDuplicates) continue;
          throw e;
        }
        table(name).set(row.id, row);
        count++;
      }
      return { count };
    },
    update: async (args: any) => {
      const row = [...table(name).values()].find((r) => matches(r, args.where));
      if (!row) throw new Prisma.PrismaClientKnownRequestError('Record to update not found.', { code: 'P2025', clientVersion: 'test' });
      Object.assign(row, { updatedAt: stamp() }, args.data);
      return shape(name, row, args)!;
    },
    updateMany: async (args: any) => {
      const rows = [...table(name).values()].filter((r) => matches(r, args.where));
      for (const row of rows) Object.assign(row, { updatedAt: stamp() }, args.data);
      return { count: rows.length };
    },
    upsert: async (args: any) => {
      const row = [...table(name).values()].find((r) => matches(r, args.where));
      if (row) {
        Object.assign(row, args.update);
        return shape(name, row, args)!;
      }
      return model(name).create({ data: args.create, include: args.include, select: args.select });
    },
    delete: async (args: any) => {
      const row = [...table(name).values()].find((r) => matches(r, args.where));
      if (!row) throw new Prisma.PrismaClientKnownRequestError('Record to delete does not exist.', { code: 'P2025', clientVersion: 'test' });
      table(name).delete(row.id);
      return row;
    },
    deleteMany: async (args: any = {}) => {
      const rows = [...table(name).values()].filter((r) => matches(r, args.where));
      for (const row of rows) table(name).delete(row.id);
      // cascade like the schema does
      if (name === 'application') for (const r of rows) for (const t of [...table('applicationTask').values()]) if (t.applicationId === r.id) table('applicationTask').delete(t.id);
      return { count: rows.length };
    },
  });

  const names = [
    'userProfile', 'application', 'applicationTask', 'outreachRecord', 'savedOpportunity', 'profFollow', 'savedPaper',
    'scholarship', 'professor', 'opportunity', 'researchPaper', 'userDocument',
  ] as const;
  const models = Object.fromEntries(names.map((n) => [n, model(n)])) as Record<(typeof names)[number], ReturnType<typeof model>>;
  return { _tables: tables, table, ...models };
}
