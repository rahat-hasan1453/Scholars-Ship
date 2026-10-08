// My Profile → Documents: PDFs live in a PRIVATE Vercel Blob store, metadata in Postgres (UserDocument).
// The browser uploads straight to Blob (a Vercel function body is capped at 4.5 MB, PDFs may be 10 MB) with a
// short-lived token from /api/documents/upload; files are only read back through /api/documents/[id]/file.
import { z } from 'zod';
import { del, head } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const DOC_KINDS = ['cv', 'sop', 'transcripts', 'letters'] as const;
export type DocKind = (typeof DOC_KINDS)[number];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

/** Every blob of a user lives under their own prefix, so a path can be checked against the session */
export const userPrefix = (userId: string) => `documents/${userId}/`;

export const storageConfigured = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export const registerSchema = z
  .object({
    pathname: z.string().min(1).max(500),
    name: z.string().trim().min(1).max(255),
    kinds: z.array(z.enum(DOC_KINDS)).min(1).max(DOC_KINDS.length),
  })
  .strict();

export interface DocumentDto {
  id: string;
  kind: DocKind;
  name: string;
  size: number;
  createdAt: string;
}

const toDto = (r: { id: string; kind: string; name: string; size: number; createdAt: Date }): DocumentDto => ({
  id: r.id,
  kind: r.kind as DocKind,
  name: r.name,
  size: r.size,
  createdAt: r.createdAt.toISOString(),
});

export async function listDocuments(userId: string): Promise<DocumentDto[]> {
  const rows = await prisma.userDocument.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  return rows.map(toDto);
}

/** Deletes blobs that no row points to any more (one upload can back several kinds) */
async function dropOrphanBlobs(pathnames: string[]) {
  for (const pathname of new Set(pathnames)) {
    const stillUsed = await prisma.userDocument.count({ where: { pathname } });
    if (stillUsed === 0) await del(pathname).catch((e) => console.error('[documents] blob delete failed:', e));
  }
}

export class DocumentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Called after the browser finished uploading: checks the blob, then records it for each chosen kind */
export async function registerUpload(userId: string, input: z.infer<typeof registerSchema>): Promise<DocumentDto[]> {
  if (!input.pathname.startsWith(userPrefix(userId))) throw new DocumentError('That file does not belong to you.', 403);
  let meta: { size: number; contentType: string };
  try {
    meta = await head(input.pathname);
  } catch {
    throw new DocumentError('We could not find the uploaded file. Please try again.');
  }
  if (meta.contentType !== 'application/pdf') {
    await del(input.pathname).catch(() => undefined);
    throw new DocumentError('Only PDF files are supported.');
  }
  if (meta.size > MAX_DOC_BYTES) {
    await del(input.pathname).catch(() => undefined);
    throw new DocumentError('That file is larger than 10 MB.');
  }

  const replaced: string[] = [];
  for (const kind of input.kinds) {
    // CV, SOP and transcripts hold one file; letters stack up
    if (kind !== 'letters') {
      const old = await prisma.userDocument.findMany({ where: { userId, kind } });
      if (old.length > 0) {
        await prisma.userDocument.deleteMany({ where: { userId, kind } });
        replaced.push(...old.map((o) => o.pathname));
      }
    }
    await prisma.userDocument.create({
      data: { userId, kind, name: input.name, size: meta.size, pathname: input.pathname },
    });
  }
  await dropOrphanBlobs(replaced.filter((p) => p !== input.pathname));
  return listDocuments(userId);
}

/** Ownership is part of the query: someone else's id looks like "not found" */
export async function findOwnDocument(userId: string, id: string) {
  return prisma.userDocument.findFirst({ where: { id, userId } });
}

export async function deleteOwnDocument(userId: string, id: string): Promise<boolean> {
  const doc = await findOwnDocument(userId, id);
  if (!doc) return false;
  await prisma.userDocument.deleteMany({ where: { id, userId } });
  await dropOrphanBlobs([doc.pathname]);
  return true;
}

/** Deletes every document of one kind (the ⋮ → Delete action on a row) */
export async function deleteKind(userId: string, kind: DocKind): Promise<void> {
  const rows = await prisma.userDocument.findMany({ where: { userId, kind } });
  if (rows.length === 0) return;
  await prisma.userDocument.deleteMany({ where: { userId, kind } });
  await dropOrphanBlobs(rows.map((r) => r.pathname));
}
