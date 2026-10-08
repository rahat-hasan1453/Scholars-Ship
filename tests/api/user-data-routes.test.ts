/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma';
import { createCookieJar } from '../helpers/fakeCookies';

const h = vi.hoisted(() => ({ db: null as any, jar: null as any }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db; } }));
vi.mock('next/headers', () => ({ cookies: async () => h.jar.api }));

import { encodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import * as profileRoute from '@/app/api/profile/route';
import * as appsRoute from '@/app/api/applications/route';
import * as appsOrderRoute from '@/app/api/applications/order/route';
import * as appRoute from '@/app/api/applications/[id]/route';
import * as tasksRoute from '@/app/api/applications/[id]/tasks/route';
import * as taskRoute from '@/app/api/applications/[id]/tasks/[taskId]/route';
import * as outreachRoute from '@/app/api/outreach/route';
import * as outreachOrderRoute from '@/app/api/outreach/order/route';
import * as outreachItemRoute from '@/app/api/outreach/[id]/route';
import * as bookmarksRoute from '@/app/api/bookmarks/route';
import * as bookmarkRoute from '@/app/api/bookmarks/[kind]/[id]/route';
import * as importRoute from '@/app/api/import/route';

const URL_BASE = 'http://localhost:3000';
const req = (path: string, method = 'GET', body?: unknown) =>
  new Request(`${URL_BASE}${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

const ALICE = { id: 'user-alice', email: 'alice@example.test', name: 'Alice' };
const BOB = { id: 'user-bob', email: 'bob@example.test', name: 'Bob' };
const UUID = () => crypto.randomUUID();

function signInAs(user: typeof ALICE | null) {
  h.jar = createCookieJar();
  if (user) h.jar.api.set(SESSION_COOKIE_NAME, encodeSession(user));
}

function seed() {
  const t = h.db.table;
  for (const u of [ALICE, BOB]) h.db._users.set(u.email, { ...u, onboardingCompleted: true, avatar: null, googleId: null, profileData: null, emailVerifiedAt: null });
  for (const id of ['sch_a', 'sch_b', 'sch_c']) {
    t('scholarship').set(id, {
      id, title: `Scholarship ${id}`, provider: 'Provider', deadline: new Date('2027-01-15T00:00:00Z'), fundingAmount: 'Full', fundingType: 'FULL',
      degreeLevels: ['MASTERS'], countries: ['Germany'], specializations: ['HCI'], requirementsJson: {}, admissionSummary: null, livingCost: null,
      providerShort: null, fieldOfStudy: null, fundingBreakdown: null, applySteps: [], tags: [], officialUrl: 'https://example.test', description: 'd',
      featured: false, createdAt: new Date(), updatedAt: new Date(),
    });
  }
  t('professor').set('prof_a', { id: 'prof_a', name: 'Prof A' });
  t('professor').set('prof_b', { id: 'prof_b', name: 'Prof B' });
  t('opportunity').set('opp_a', { id: 'opp_a' });
  t('opportunity').set('opp_b', { id: 'opp_b' });
  t('researchPaper').set('paper_a', { id: 'paper_a' });
}

const json = async (res: Response) => ({ status: res.status, body: await res.json() });

async function createApp(scholarshipId = 'sch_a', extra: Record<string, unknown> = {}) {
  return json(await appsRoute.POST(req('/api/applications', 'POST', { scholarshipId, ...extra })));
}

beforeEach(() => {
  h.db = createFakePrisma();
  seed();
  signInAs(ALICE);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('auth: every user-data route needs a session (401)', () => {
  const calls: [string, () => Promise<Response>][] = [
    ['GET /api/profile', () => profileRoute.GET()],
    ['PATCH /api/profile', () => profileRoute.PATCH(req('/api/profile', 'PATCH', { name: 'X' }))],
    ['GET /api/applications', () => appsRoute.GET()],
    ['POST /api/applications', () => appsRoute.POST(req('/api/applications', 'POST', { scholarshipId: 'sch_a' }))],
    ['PUT /api/applications/order', () => appsOrderRoute.PUT(req('/api/applications/order', 'PUT', { ids: ['x'] }))],
    ['PATCH /api/applications/[id]', () => appRoute.PATCH(req('/api/applications/x', 'PATCH', { status: 'Submitted' }), ctx({ id: 'x' }))],
    ['DELETE /api/applications/[id]', () => appRoute.DELETE(req('/api/applications/x', 'DELETE'), ctx({ id: 'x' }))],
    ['POST /api/applications/[id]/tasks', () => tasksRoute.POST(req('/api/applications/x/tasks', 'POST', { title: 't' }), ctx({ id: 'x' }))],
    ['PATCH /api/applications/[id]/tasks/[taskId]', () => taskRoute.PATCH(req('/x', 'PATCH', { isCompleted: true }), ctx({ id: 'x', taskId: 'y' }))],
    ['DELETE /api/applications/[id]/tasks/[taskId]', () => taskRoute.DELETE(req('/x', 'DELETE'), ctx({ id: 'x', taskId: 'y' }))],
    ['GET /api/outreach', () => outreachRoute.GET()],
    ['POST /api/outreach', () => outreachRoute.POST(req('/api/outreach', 'POST', { professorName: 'P', institution: 'U' }))],
    ['PUT /api/outreach/order', () => outreachOrderRoute.PUT(req('/api/outreach/order', 'PUT', { ids: ['x'] }))],
    ['PATCH /api/outreach/[id]', () => outreachItemRoute.PATCH(req('/x', 'PATCH', { status: 'Drafting' }), ctx({ id: 'x' }))],
    ['DELETE /api/outreach/[id]', () => outreachItemRoute.DELETE(req('/x', 'DELETE'), ctx({ id: 'x' }))],
    ['GET /api/bookmarks', () => bookmarksRoute.GET()],
    ['PUT /api/bookmarks/[kind]/[id]', () => bookmarkRoute.PUT(req('/x', 'PUT'), ctx({ kind: 'papers', id: 'paper_a' }))],
    ['DELETE /api/bookmarks/[kind]/[id]', () => bookmarkRoute.DELETE(req('/x', 'DELETE'), ctx({ kind: 'papers', id: 'paper_a' }))],
    ['POST /api/import', () => importRoute.POST(req('/api/import', 'POST', {}))],
  ];
  it.each(calls)('%s → 401 without a session', async (_name, call) => {
    signInAs(null);
    expect((await call()).status).toBe(401);
  });
  it('a forged / tampered cookie is not a session', async () => {
    h.jar = createCookieJar();
    h.jar.api.set(SESSION_COOKIE_NAME, encodeSession(ALICE).replace(/.$/, 'x'));
    expect((await appsRoute.GET()).status).toBe(401);
  });
});

describe('profile', () => {
  it('GET returns defaults for a user who never saved a profile', async () => {
    const { status, body } = await json(await profileRoute.GET());
    expect(status).toBe(200);
    expect(body.profile).toMatchObject({ id: ALICE.id, name: 'Alice', email: ALICE.email, degreeLevel: 'Masters', specializations: [], cgpa: 0 });
  });
  it('GET falls back to the old onboarding JSON (User.profileData)', async () => {
    h.db._users.get(ALICE.email).profileData = { degreeLevel: 'PhD', specializations: ['HCI'], cgpa: 3.5 };
    const { body } = await json(await profileRoute.GET());
    expect(body.profile).toMatchObject({ degreeLevel: 'PhD', specializations: ['HCI'], cgpa: 3.5 });
  });
  it('PATCH saves name, profile columns and details', async () => {
    const { status, body } = await json(
      await profileRoute.PATCH(
        req('/api/profile', 'PATCH', {
          name: ' Alice B ', degreeLevel: 'PhD', cgpa: 3.9, testScores: { ielts: 8 }, targetCountries: ['Germany'], details: { bio: 'Hi', intake: 'Fall 2027' },
        }),
      ),
    );
    expect(status).toBe(200);
    expect(body.profile).toMatchObject({ name: 'Alice B', degreeLevel: 'PhD', cgpa: 3.9, testScores: { ielts: 8 }, targetCountries: ['Germany'], details: { bio: 'Hi' } });
    expect(h.db._users.get(ALICE.email).name).toBe('Alice B');
    const again = await json(await profileRoute.GET());
    expect(again.body.profile.degreeLevel).toBe('PhD');
  });
  it('PATCH stores an uploaded photo outside User.avatar (never in the session cookie)', async () => {
    const photo = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
    const { body } = await json(await profileRoute.PATCH(req('/api/profile', 'PATCH', { avatar: photo })));
    expect(body.profile.avatar).toBe(photo);
    expect(h.db._users.get(ALICE.email).avatar).toBeNull();
  });
  it.each([
    {},
    { email: 'evil@example.test' },
    { cgpa: 11 },
    { degreeLevel: 'Wizard' },
    { testScores: { ielts: 10 } },
    { name: 'x'.repeat(101) },
    { avatar: 'javascript:alert(1)' },
    { specializations: Array.from({ length: 31 }, (_, i) => `s${i}`) },
  ])('PATCH 400 for invalid body %j', async (body) => {
    expect((await profileRoute.PATCH(req('/api/profile', 'PATCH', body))).status).toBe(400);
  });
  it('PATCH 400 for non-JSON and oversized bodies', async () => {
    expect((await profileRoute.PATCH(req('/api/profile', 'PATCH', '{oops'))).status).toBe(400);
    expect((await profileRoute.PATCH(req('/api/profile', 'PATCH', { details: { bio: 'x'.repeat(700_000) } }))).status).toBe(400);
  });
});

describe('applications: CRUD', () => {
  it('lists an empty pipeline for a new user (no demo cards)', async () => {
    expect((await json(await appsRoute.GET())).body.data).toEqual([]);
  });
  it('creates with a client id, tasks in order, and maps enums to UI strings', async () => {
    const id = UUID();
    const tasks = [{ title: 'One', isCompleted: true }, { title: 'Two' }, { title: 'Three' }];
    const { status, body } = await createApp('sch_a', { id, status: 'Under Review', notes: 'n', deadline: '2027-01-01T00:00:00.000Z', tasks });
    expect(status).toBe(201);
    expect(body.data).toMatchObject({ id, scholarshipId: 'sch_a', status: 'Under Review', decision: 'Pending', notes: 'n', deadline: '2027-01-01T00:00:00.000Z' });
    expect(body.data.scholarship).toMatchObject({ id: 'sch_a', title: 'Scholarship sch_a' });
    expect(body.data.tasks.map((t: any) => [t.title, t.isCompleted])).toEqual([['One', true], ['Two', false], ['Three', false]]);
    expect([...h.db.table('application').values()][0].status).toBe('UNDER_REVIEW');
  });
  it('saving the same scholarship twice returns the existing card (200), no duplicate', async () => {
    const first = await createApp('sch_a');
    const second = await createApp('sch_a', { id: UUID() });
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect((await json(await appsRoute.GET())).body.data).toHaveLength(1);
  });
  it('404 for a scholarship that does not exist', async () => {
    expect((await createApp('sch_missing')).status).toBe(404);
  });
  it('newest card goes on top; list is sorted by orderIndex', async () => {
    await createApp('sch_a');
    await createApp('sch_b');
    const list = (await json(await appsRoute.GET())).body.data;
    expect(list.map((a: any) => a.scholarshipId)).toEqual(['sch_b', 'sch_a']);
  });
  it('PATCH updates status + decision + notes + deadline', async () => {
    const { body } = await createApp('sch_a');
    const id = body.data.id;
    const res = await json(await appRoute.PATCH(req(`/api/applications/${id}`, 'PATCH', { status: 'Decided', decision: 'Waitlisted', notes: 'x', deadline: null }), ctx({ id })));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'Decided', decision: 'Waitlisted', notes: 'x' });
    expect(res.body.data.deadline).toBe('2027-01-15T00:00:00.000Z'); // falls back to the scholarship deadline
  });
  it('DELETE removes the card and its tasks', async () => {
    const { body } = await createApp('sch_a', { tasks: [{ title: 'A' }] });
    const id = body.data.id;
    expect((await appRoute.DELETE(req(`/api/applications/${id}`, 'DELETE'), ctx({ id }))).status).toBe(200);
    expect((await json(await appsRoute.GET())).body.data).toEqual([]);
    expect(h.db.table('applicationTask').size).toBe(0);
    expect((await appRoute.DELETE(req(`/api/applications/${id}`, 'DELETE'), ctx({ id }))).status).toBe(404);
  });
  it('tasks: add, toggle, rename, remove', async () => {
    const { body } = await createApp('sch_a');
    const id = body.data.id;
    const taskId = UUID();
    const added = await json(await tasksRoute.POST(req('/t', 'POST', { id: taskId, title: ' Essay ' }), ctx({ id })));
    expect(added).toMatchObject({ status: 201, body: { data: { id: taskId, title: 'Essay', isCompleted: false } } });
    const toggled = await json(await taskRoute.PATCH(req('/t', 'PATCH', { isCompleted: true, title: 'Essay v2' }), ctx({ id, taskId })));
    expect(toggled.body.data).toMatchObject({ isCompleted: true, title: 'Essay v2' });
    expect((await taskRoute.DELETE(req('/t', 'DELETE'), ctx({ id, taskId }))).status).toBe(200);
    expect((await taskRoute.DELETE(req('/t', 'DELETE'), ctx({ id, taskId }))).status).toBe(404);
  });
});

describe('applications: validation (400)', () => {
  it.each([
    {},
    { scholarshipId: '' },
    { scholarshipId: 'x'.repeat(101) },
    { scholarshipId: 'sch_a', status: 'Done' },
    { scholarshipId: 'sch_a', decision: 'Maybe' },
    { scholarshipId: 'sch_a', id: 'not-a-uuid' },
    { scholarshipId: 'sch_a', notes: 'x'.repeat(5001) },
    { scholarshipId: 'sch_a', deadline: 'tomorrow' },
    { scholarshipId: 'sch_a', tasks: Array.from({ length: 51 }, () => ({ title: 't' })) },
    { scholarshipId: 'sch_a', profileId: 'someone-else' },
  ])('POST %j', async (body) => {
    expect((await appsRoute.POST(req('/api/applications', 'POST', body))).status).toBe(400);
  });
  it('PATCH rejects empty, unknown keys and bad enums', async () => {
    const { body } = await createApp('sch_a');
    const id = body.data.id;
    for (const b of [{}, { status: 'Lost' }, { profileId: 'x' }, { scholarshipId: 'sch_b' }]) {
      expect((await appRoute.PATCH(req('/x', 'PATCH', b), ctx({ id }))).status).toBe(400);
    }
  });
  it('reorder and task bodies are validated', async () => {
    expect((await appsOrderRoute.PUT(req('/o', 'PUT', { ids: [] }))).status).toBe(400);
    expect((await appsOrderRoute.PUT(req('/o', 'PUT', { ids: 'a,b' }))).status).toBe(400);
    expect((await appsOrderRoute.PUT(req('/o', 'PUT', { ids: Array.from({ length: 1001 }, (_, i) => `a${i}`) }))).status).toBe(400);
    const { body } = await createApp('sch_a');
    expect((await tasksRoute.POST(req('/t', 'POST', { title: '' }), ctx({ id: body.data.id }))).status).toBe(400);
    expect((await tasksRoute.POST(req('/t', 'POST', { title: 'x'.repeat(301) }), ctx({ id: body.data.id }))).status).toBe(400);
  });
});

describe('applications: reorder (batch)', () => {
  it('saves the order of the given ids and ignores ids that are not the user’s', async () => {
    const a = (await createApp('sch_a')).body.data.id;
    const b = (await createApp('sch_b')).body.data.id;
    const c = (await createApp('sch_c')).body.data.id;
    signInAs(BOB);
    const bobs = (await createApp('sch_a')).body.data.id;
    signInAs(ALICE);
    const res = await json(await appsOrderRoute.PUT(req('/o', 'PUT', { ids: [a, bobs, c, b] })));
    expect(res.body.updated).toBe(3);
    const list = (await json(await appsRoute.GET())).body.data;
    expect(list.map((x: any) => x.id)).toEqual([a, c, b]);
    signInAs(BOB);
    expect((await json(await appsRoute.GET())).body.data.map((x: any) => x.id)).toEqual([bobs]);
  });
});

describe('ownership: another user’s rows are 404 and untouched', () => {
  it('applications and tasks', async () => {
    const { body } = await createApp('sch_a', { tasks: [{ title: 'Mine' }] });
    const id = body.data.id;
    const taskId = body.data.tasks[0].id;
    signInAs(BOB);
    expect((await appRoute.PATCH(req('/x', 'PATCH', { status: 'Submitted' }), ctx({ id }))).status).toBe(404);
    expect((await appRoute.DELETE(req('/x', 'DELETE'), ctx({ id }))).status).toBe(404);
    expect((await tasksRoute.POST(req('/t', 'POST', { title: 'hack' }), ctx({ id }))).status).toBe(404);
    expect((await taskRoute.PATCH(req('/t', 'PATCH', { isCompleted: true }), ctx({ id, taskId }))).status).toBe(404);
    expect((await taskRoute.DELETE(req('/t', 'DELETE'), ctx({ id, taskId }))).status).toBe(404);
    // Bob creating his own card for the same scholarship works, and doesn't see Alice's
    expect((await json(await appsRoute.GET())).body.data).toEqual([]);
    signInAs(ALICE);
    const mine = (await json(await appsRoute.GET())).body.data[0];
    expect(mine).toMatchObject({ id, status: 'Wishlist' });
    expect(mine.tasks).toHaveLength(1);
  });
  it('a task id from another card of the same user is 404', async () => {
    const a = (await createApp('sch_a', { tasks: [{ title: 'A' }] })).body.data;
    const b = (await createApp('sch_b')).body.data;
    expect((await taskRoute.PATCH(req('/t', 'PATCH', { isCompleted: true }), ctx({ id: b.id, taskId: a.tasks[0].id }))).status).toBe(404);
  });
  it('outreach', async () => {
    const rec = (await json(await outreachRoute.POST(req('/o', 'POST', { professorId: 'prof_a', professorName: 'Prof A', institution: 'U' })))).body.data;
    signInAs(BOB);
    expect((await outreachItemRoute.PATCH(req('/x', 'PATCH', { status: 'Interview' }), ctx({ id: rec.id }))).status).toBe(404);
    expect((await outreachItemRoute.DELETE(req('/x', 'DELETE'), ctx({ id: rec.id }))).status).toBe(404);
    expect((await json(await outreachOrderRoute.PUT(req('/o', 'PUT', { ids: [rec.id] })))).body.updated).toBe(0);
    signInAs(ALICE);
    expect((await json(await outreachRoute.GET())).body.data[0].status).toBe('Prospect');
  });
  it('a client id that belongs to another user’s row is a 409, not an overwrite', async () => {
    const id = UUID();
    await createApp('sch_a', { id });
    signInAs(BOB);
    expect((await createApp('sch_b', { id })).status).toBe(409);
  });
});

describe('outreach: CRUD + reorder', () => {
  it('create (professor + feed post), dedupe, update, reorder, delete', async () => {
    const prof = await json(await outreachRoute.POST(req('/o', 'POST', { professorId: 'prof_a', professorName: 'Prof A', institution: 'TU', labName: 'Lab', country: 'Germany', notes: 'Target: Lab' })));
    expect(prof.status).toBe(201);
    expect(prof.body.data).toMatchObject({ professorId: 'prof_a', status: 'Prospect', labName: 'Lab', notes: 'Target: Lab' });
    const post = await json(await outreachRoute.POST(req('/o', 'POST', { opportunityId: 'live_123', professorName: 'Dr X', institution: 'MIT', status: 'Drafting' })));
    expect(post.body.data).toMatchObject({ opportunityId: 'live_123', status: 'Drafting' });
    const dupe = await json(await outreachRoute.POST(req('/o', 'POST', { professorId: 'prof_a', professorName: 'Prof A', institution: 'TU' })));
    expect(dupe.status).toBe(200);
    expect(dupe.body.data.id).toBe(prof.body.data.id);
    expect((await outreachRoute.POST(req('/o', 'POST', { professorId: 'prof_missing', professorName: 'P', institution: 'U' }))).status).toBe(404);

    const upd = await json(await outreachItemRoute.PATCH(req('/x', 'PATCH', { status: 'Follow-up Due', nextFollowUpDate: '2026-11-01T00:00:00.000Z' }), ctx({ id: prof.body.data.id })));
    expect(upd.body.data).toMatchObject({ status: 'Follow-up Due', nextFollowUpDate: '2026-11-01T00:00:00.000Z' });
    expect([...h.db.table('outreachRecord').values()].find((r: any) => r.id === prof.body.data.id).status).toBe('FOLLOW_UP_DUE');

    let list = (await json(await outreachRoute.GET())).body.data;
    expect(list.map((r: any) => r.id)).toEqual([post.body.data.id, prof.body.data.id]);
    await outreachOrderRoute.PUT(req('/o', 'PUT', { ids: [prof.body.data.id, post.body.data.id] }));
    list = (await json(await outreachRoute.GET())).body.data;
    expect(list.map((r: any) => r.id)).toEqual([prof.body.data.id, post.body.data.id]);

    expect((await outreachItemRoute.DELETE(req('/x', 'DELETE'), ctx({ id: post.body.data.id }))).status).toBe(200);
    expect((await json(await outreachRoute.GET())).body.data).toHaveLength(1);
  });
  it.each([
    { institution: 'U' },
    { professorName: 'P', institution: 'U', status: 'Ghosted' },
    { professorName: 'P', institution: 'x'.repeat(201) },
    { professorName: 'P', institution: 'U', coldEmailDraft: 'x'.repeat(20_001) },
    { professorName: 'P', institution: 'U', extra: true },
  ])('POST 400 for %j', async (body) => {
    expect((await outreachRoute.POST(req('/o', 'POST', body))).status).toBe(400);
  });
});

describe('bookmarks', () => {
  it('save / list / unsave for all three kinds, idempotent', async () => {
    for (const [kind, id] of [['opportunities', 'opp_a'], ['professors', 'prof_a'], ['papers', 'paper_a']]) {
      expect((await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind, id }))).status).toBe(200);
      expect((await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind, id }))).status).toBe(200);
    }
    expect((await json(await bookmarksRoute.GET())).body.data).toEqual({ opportunities: ['opp_a'], professors: ['prof_a'], papers: ['paper_a'] });
    expect((await bookmarkRoute.DELETE(req('/b', 'DELETE'), ctx({ kind: 'papers', id: 'paper_a' }))).status).toBe(200);
    expect((await bookmarkRoute.DELETE(req('/b', 'DELETE'), ctx({ kind: 'papers', id: 'paper_a' }))).status).toBe(200);
    expect((await json(await bookmarksRoute.GET())).body.data.papers).toEqual([]);
    signInAs(BOB);
    expect((await json(await bookmarksRoute.GET())).body.data).toEqual({ opportunities: [], professors: [], papers: [] });
  });
  it('404 for an id that is not in the database, 400 for an unknown kind', async () => {
    expect((await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind: 'papers', id: 'openalex-paper-W1' }))).status).toBe(404);
    expect((await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind: 'scholarships', id: 'sch_a' }))).status).toBe(400);
    expect((await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind: 'papers', id: 'x'.repeat(101) }))).status).toBe(400);
  });
  it('Bob unsaving does not touch Alice’s bookmark', async () => {
    await bookmarkRoute.PUT(req('/b', 'PUT'), ctx({ kind: 'opportunities', id: 'opp_a' }));
    signInAs(BOB);
    await bookmarkRoute.DELETE(req('/b', 'DELETE'), ctx({ kind: 'opportunities', id: 'opp_a' }));
    signInAs(ALICE);
    expect((await json(await bookmarksRoute.GET())).body.data.opportunities).toEqual(['opp_a']);
  });
});

describe('POST /api/import (one-time localStorage import)', () => {
  const legacy = {
    applications: [
      { id: 'app_01', scholarshipId: 'sch_a', status: 'Preparing', decision: 'Pending', notes: 'demo', tasks: [] }, // demo card: skipped
      { id: 'app_1700000000000', scholarshipId: 'sch_b', status: 'Submitted', decision: 'Pending', notes: 'mine', deadline: '2027-02-01T00:00:00Z', tasks: [{ id: 't1', title: 'Essay', isCompleted: true }] },
      { id: 'app_1700000000001', scholarshipId: 'sch_b', status: 'Wishlist' }, // duplicate scholarship: skipped
      { id: 'app_1700000000002', scholarshipId: 'sch_unknown', status: 'Wishlist' }, // not in DB: skipped
      { id: 'app_1700000000003', scholarshipId: 'sch_c', status: 'Weird', notes: 42 }, // bad enum / notes: defaults
      'garbage',
    ],
    outreach: [
      { id: 'outreach_01', opportunityId: 'opp_a', professorName: 'Demo', institution: 'X', status: 'Prospect', notes: '' }, // demo: skipped
      { id: 'outreach_9', professorId: 'prof_a', professorName: 'Prof A', institution: 'TU', status: 'Interview', notes: 'n' },
      { id: 'outreach_10', opportunityId: 'opp_live_unknown', professorName: 'Dr Y', institution: 'Z', status: 'Prospect', notes: '' }, // unknown: skipped
    ],
    opportunities: ['opp_a', 'opp_a', 'opp_missing', 7],
    professors: ['prof_b'],
    papers: ['paper_a', 'openalex-paper-W1'],
  };

  it('imports only real, non-demo, deduped items and returns the full data', async () => {
    const { status, body } = await json(await importRoute.POST(req('/api/import', 'POST', legacy)));
    expect(status).toBe(200);
    expect(body.imported).toEqual({ applications: 2, outreach: 1, opportunities: 1, professors: 1, papers: 1 });
    expect(body.skipped).toBe(10);
    expect(body.data.applications.map((a: any) => [a.scholarshipId, a.status, a.notes])).toEqual([
      ['sch_b', 'Submitted', 'mine'],
      ['sch_c', 'Wishlist', ''],
    ]);
    expect(body.data.applications[0].tasks).toMatchObject([{ title: 'Essay', isCompleted: true }]);
    expect(body.data.outreach).toMatchObject([{ professorId: 'prof_a', status: 'Interview' }]);
    expect(body.data.bookmarks).toEqual({ opportunities: ['opp_a'], professors: ['prof_b'], papers: ['paper_a'] });
  });
  it('is idempotent: importing the same payload again adds nothing', async () => {
    await importRoute.POST(req('/api/import', 'POST', legacy));
    const again = await json(await importRoute.POST(req('/api/import', 'POST', legacy)));
    expect(again.body.imported).toEqual({ applications: 0, outreach: 0, opportunities: 0, professors: 0, papers: 0 });
    expect(again.body.data.applications).toHaveLength(2);
  });
  it('skips what the user already has', async () => {
    await createApp('sch_b');
    const { body } = await json(await importRoute.POST(req('/api/import', 'POST', legacy)));
    expect(body.imported.applications).toBe(1);
    expect(body.data.applications).toHaveLength(2);
  });
  it.each([
    'not json',
    { applications: 'nope' },
    { junk: [] },
    { papers: Array.from({ length: 1001 }, (_, i) => `p${i}`) },
  ])('400 for invalid payload %j', async (body) => {
    expect((await importRoute.POST(req('/api/import', 'POST', body as any))).status).toBe(400);
  });
});
