import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { jsonError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { MAX_DOC_BYTES, storageConfigured, userPrefix } from '@/lib/documents';

// Hands the browser a short-lived token to upload ONE PDF straight to private Blob storage.
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  if (!storageConfigured()) return jsonError(503, 'File storage is not set up yet.');

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return jsonError(400, 'Request body must be JSON.');
  }

  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // Only inside the user's own folder, only PDFs, only up to 10 MB
        if (!pathname.startsWith(userPrefix(userId)) || !pathname.toLowerCase().endsWith('.pdf')) {
          throw new Error('Invalid upload path.');
        }
        return { allowedContentTypes: ['application/pdf'], maximumSizeInBytes: MAX_DOC_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents] upload token failed:', error);
    return jsonError(400, 'We could not start the upload.');
  }
}
