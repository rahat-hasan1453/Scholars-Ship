// Shared plumbing for the signed-in user-data routes: session check, body size limit + schema validation, errors.
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ZodType, ZodTypeDef } from 'zod';
import { getSessionUser } from '@/lib/auth';

export const DEFAULT_BODY_LIMIT = 64 * 1024;

export const jsonError = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, error, ...extra }, { status });

export const unauthorized = () => jsonError(401, 'Unauthorized. Please sign in.');
export const notFound = (what = 'Not found') => jsonError(404, what);

/** The signed-in user's id, taken only from the signed session cookie (never from the body or query). */
export async function sessionUserId(): Promise<string | null> {
  const session = await getSessionUser();
  return session?.id ?? null;
}

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Reads the body with a size limit and validates it. Any problem (too big, not JSON, wrong shape) is a 400. */
export async function parseBody<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>, maxBytes = DEFAULT_BODY_LIMIT): Promise<Parsed<T>> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > maxBytes) return { ok: false, response: jsonError(400, 'Request body is too large.') };
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, response: jsonError(400, 'Could not read the request body.') };
  }
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) return { ok: false, response: jsonError(400, 'Request body is too large.') };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, response: jsonError(400, 'Request body must be JSON.') };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 5).map((i) => ({ path: i.path.join('.'), message: i.message }));
    return { ok: false, response: jsonError(400, 'Invalid request.', { issues }) };
  }
  return { ok: true, data: result.data };
}

/** Unique-constraint clash (e.g. the same client id twice) → 409; anything else → 500 */
export function serverError(scope: string, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return jsonError(409, 'This item already exists.');
  }
  console.error(`[user-data] ${scope} failed:`, error);
  return jsonError(500, 'Something went wrong. Please try again.');
}
