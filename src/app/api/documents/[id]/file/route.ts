import { get } from '@vercel/blob';
import { jsonError, notFound, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { findOwnDocument, storageConfigured } from '@/lib/documents';

// Streams a user's own PDF. Blobs are private, so this ownership check is the only way to read one.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  if (!storageConfigured()) return jsonError(503, 'File storage is not set up yet.');
  const { id } = await params;
  try {
    const doc = await findOwnDocument(userId, id);
    if (!doc) return notFound('Document not found');
    const blob = await get(doc.pathname, { access: 'private' });
    if (!blob || blob.statusCode !== 200) return notFound('File not found');
    return new Response(blob.stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return serverError('GET /api/documents/[id]/file', error);
  }
}
