/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma';
import { createCookieJar } from '../helpers/fakeCookies';

const h = vi.hoisted(() => ({
  db: null as any,
  jar: null as any,
  blobs: new Map<string, { size: number; contentType: string }>(),
  deleted: [] as string[],
}));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db; } }));
vi.mock('next/headers', () => ({ cookies: async () => h.jar.api }));
vi.mock('@vercel/blob', () => ({
  head: async (pathname: string) => {
    const b = h.blobs.get(pathname);
    if (!b) throw new Error('not found');
    return b;
  },
  del: async (pathname: string) => {
    h.deleted.push(pathname);
    h.blobs.delete(pathname);
  },
  get: async (pathname: string) =>
    h.blobs.has(pathname) ? { statusCode: 200, stream: new Response('%PDF-1.4 hello').body, blob: {} } : null,
  issueSignedToken: async (opts: any) => ({ delegationToken: 'd', clientSigningToken: 'c', validUntil: opts.validUntil, opts }),
}));
vi.mock('@vercel/blob/client', () => ({
  handleUploadPresigned: async ({ body, getSignedToken }: any) => {
    const { token, urlOptions } = await getSignedToken(body.payload.pathname, null, false);
    return { type: 'blob.generate-presigned-url', presignedUrlPayload: { token, urlOptions } };
  },
}));

import { encodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import * as docsRoute from '@/app/api/documents/route';
import * as uploadRoute from '@/app/api/documents/upload/route';
import * as fileRoute from '@/app/api/documents/[id]/file/route';

const ALICE = { id: 'user-alice', email: 'alice@example.test', name: 'Alice' };
const BOB = { id: 'user-bob', email: 'bob@example.test', name: 'Bob' };
const req = (path: string, method = 'GET', body?: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const json = async (res: Response) => ({ status: res.status, body: await res.json() });

function signInAs(user: typeof ALICE | null) {
  h.jar = createCookieJar();
  if (user) h.jar.api.set(SESSION_COOKIE_NAME, encodeSession(user));
}
const putBlob = (pathname: string, size = 1000, contentType = 'application/pdf') => h.blobs.set(pathname, { size, contentType });
const register = (pathname: string, kinds: string[], name = 'cv.pdf') =>
  docsRoute.POST(req('/api/documents', 'POST', { pathname, name, kinds })).then(json);

beforeEach(() => {
  h.db = createFakePrisma();
  h.blobs.clear();
  h.deleted.length = 0;
  signInAs(ALICE);
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('documents: auth', () => {
  it('401 without a session on every route', async () => {
    signInAs(null);
    expect((await docsRoute.GET()).status).toBe(401);
    expect((await docsRoute.POST(req('/api/documents', 'POST', {}))).status).toBe(401);
    expect((await docsRoute.DELETE(req('/api/documents?kind=cv', 'DELETE'))).status).toBe(401);
    expect((await uploadRoute.POST(req('/api/documents/upload', 'POST', {}))).status).toBe(401);
    expect((await fileRoute.GET(req('/x'), ctx('x'))).status).toBe(401);
  });
});

describe('documents: upload token', () => {
  const tokenFor = (pathname: string) => uploadRoute.POST(req('/api/documents/upload', 'POST', { type: 'blob.generate-presigned-url', payload: { pathname } })).then(json);

  it('signs a put for ONE PDF path in the user’s own folder, limited to PDFs ≤ 10 MB', async () => {
    const { status, body } = await tokenFor('documents/user-alice/cv.pdf');
    expect(status).toBe(200);
    expect(body.presignedUrlPayload.token.opts).toMatchObject({
      pathname: 'documents/user-alice/cv.pdf',
      operations: ['put'],
      allowedContentTypes: ['application/pdf'],
      maximumSizeInBytes: 10 * 1024 * 1024,
    });
    expect(body.presignedUrlPayload.urlOptions).toMatchObject({ allowedContentTypes: ['application/pdf'], maximumSizeInBytes: 10 * 1024 * 1024 });
  });
  it('rejects another user’s folder and non-PDF names (400)', async () => {
    expect((await tokenFor('documents/user-bob/cv.pdf')).status).toBe(400);
    expect((await tokenFor('documents/user-alice/cv.exe')).status).toBe(400);
    expect((await tokenFor('../escape.pdf')).status).toBe(400);
    expect((await tokenFor('documents/user-alice/../user-bob/x.pdf')).status).toBe(400);
  });
  it('works with Vercel’s OIDC setup (BLOB_STORE_ID only, no read-write token)', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = 'store_test';
    expect((await tokenFor('documents/user-alice/cv.pdf')).status).toBe(200);
    delete process.env.BLOB_STORE_ID;
  });
  it('503 when file storage is not configured', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    expect((await tokenFor('documents/user-alice/cv.pdf')).status).toBe(503);
  });
});

describe('documents: register, list, replace, delete', () => {
  it('GET returns an empty list and the upload folder', async () => {
    const { body } = await json(await docsRoute.GET());
    expect(body).toMatchObject({ success: true, documents: [], uploadPrefix: 'documents/user-alice/', storageReady: true });
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect((await json(await docsRoute.GET())).body.storageReady).toBe(false);
  });

  it('records an uploaded PDF for each chosen kind', async () => {
    putBlob('documents/user-alice/cv-abc.pdf', 2048);
    const { status, body } = await register('documents/user-alice/cv-abc.pdf', ['cv', 'sop']);
    expect(status).toBe(200);
    expect(body.documents.map((d: any) => d.kind).sort()).toEqual(['cv', 'sop']);
    expect(body.documents[0]).toMatchObject({ name: 'cv.pdf', size: 2048 });
    expect(Object.keys(body.documents[0]).sort()).toEqual(['createdAt', 'id', 'kind', 'name', 'size']); // no pathname leaks
  });

  it('refuses a path outside the user’s folder (403) and a missing blob (400)', async () => {
    putBlob('documents/user-bob/secret.pdf');
    expect((await register('documents/user-bob/secret.pdf', ['cv'])).status).toBe(403);
    expect((await register('documents/user-alice/nope.pdf', ['cv'])).status).toBe(400);
  });

  it('deletes and rejects blobs that are not PDFs or are too large', async () => {
    putBlob('documents/user-alice/a.png', 100, 'image/png');
    putBlob('documents/user-alice/big.pdf', 11 * 1024 * 1024);
    expect((await register('documents/user-alice/a.png', ['cv'])).status).toBe(400);
    expect((await register('documents/user-alice/big.pdf', ['cv'])).status).toBe(400);
    expect(h.deleted).toEqual(['documents/user-alice/a.png', 'documents/user-alice/big.pdf']);
  });

  it('a new CV replaces the old one and removes the old blob; letters stack', async () => {
    putBlob('documents/user-alice/v1.pdf');
    putBlob('documents/user-alice/v2.pdf');
    await register('documents/user-alice/v1.pdf', ['cv']);
    const { body } = await register('documents/user-alice/v2.pdf', ['cv']);
    expect(body.documents).toHaveLength(1);
    expect(h.deleted).toEqual(['documents/user-alice/v1.pdf']);

    putBlob('documents/user-alice/l1.pdf');
    putBlob('documents/user-alice/l2.pdf');
    await register('documents/user-alice/l1.pdf', ['letters']);
    const after = await register('documents/user-alice/l2.pdf', ['letters']);
    expect(after.body.documents.filter((d: any) => d.kind === 'letters')).toHaveLength(2);
  });

  it('DELETE ?kind removes the rows, keeps a blob another kind still uses', async () => {
    putBlob('documents/user-alice/shared.pdf');
    await register('documents/user-alice/shared.pdf', ['cv', 'sop']);
    const { body } = await json(await docsRoute.DELETE(req('/api/documents?kind=cv', 'DELETE')));
    expect(body.documents.map((d: any) => d.kind)).toEqual(['sop']);
    expect(h.deleted).toEqual([]);
    await docsRoute.DELETE(req('/api/documents?kind=sop', 'DELETE'));
    expect(h.deleted).toEqual(['documents/user-alice/shared.pdf']);
  });

  it('DELETE with an unknown kind is a 400', async () => {
    expect((await docsRoute.DELETE(req('/api/documents?kind=passport', 'DELETE'))).status).toBe(400);
  });

  it('rejects a bad body (400)', async () => {
    expect((await docsRoute.POST(req('/api/documents', 'POST', { pathname: 'x', name: 'a.pdf', kinds: ['passport'] }))).status).toBe(400);
    expect((await docsRoute.POST(req('/api/documents', 'POST', { pathname: 'x', name: 'a.pdf', kinds: [] }))).status).toBe(400);
  });
});

describe('documents: reading a file', () => {
  it('streams the owner’s PDF; another user gets 404', async () => {
    putBlob('documents/user-alice/cv.pdf');
    const { body } = await register('documents/user-alice/cv.pdf', ['cv']);
    const id = body.documents[0].id;

    const ok = await fileRoute.GET(req(`/api/documents/${id}/file`), ctx(id));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toBe('application/pdf');
    expect(ok.headers.get('cache-control')).toContain('no-store');
    expect(await ok.text()).toContain('%PDF');

    signInAs(BOB);
    h.db._users.set(BOB.email, { ...BOB });
    expect((await fileRoute.GET(req(`/api/documents/${id}/file`), ctx(id))).status).toBe(404);
  });
});
