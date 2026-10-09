import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, parseBody, serverError } from '@/lib/apiHelpers';
import { clientIp, rateLimitHit } from '@/lib/rateLimit';
import { searchMissSchema } from '@/lib/searchMiss';

const MAX_PER_IP_PER_HOUR = 60;

// Records a feed search with no results. Anonymous: no user id, no IP stored.
export async function POST(req: Request) {
  const body = await parseBody(req, searchMissSchema, 8 * 1024);
  if (!body.ok) return body.response;
  try {
    const limit = await rateLimitHit(`miss:ip:${clientIp(req)}`, MAX_PER_IP_PER_HOUR, 3600);
    if (!limit.allowed) return jsonError(429, 'Too many requests.');
    await prisma.searchMiss.create({ data: body.data });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('POST /api/search-miss', error);
  }
}
