import { NextResponse } from 'next/server';
import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { jsonError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { MAX_DOC_BYTES, storageConfigured, userPrefix } from '@/lib/documents';

// Hands the browser a short-lived presigned URL to upload ONE PDF straight to private Blob storage.
// Uses the presigned flow because Vercel's current Blob setup authenticates with OIDC (BLOB_STORE_ID +
// BLOB_WEBHOOK_PUBLIC_KEY) instead of a BLOB_READ_WRITE_TOKEN, and handleUpload only works with that token.
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  if (!storageConfigured()) return jsonError(503, 'File storage is not set up yet.');

  let body: HandleUploadPresignedBody;
  try {
    body = (await req.json()) as HandleUploadPresignedBody;
  } catch {
    return jsonError(400, 'Request body must be JSON.');
  }

  try {
    const result = await handleUploadPresigned({
      request: req,
      body,
      getSignedToken: async (pathname) => {
        // Only inside the user's own folder, only PDFs, only up to 10 MB, one exact path
        if (!pathname.startsWith(userPrefix(userId)) || !pathname.toLowerCase().endsWith('.pdf') || pathname.includes('..')) {
          throw new Error('Invalid upload path.');
        }
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: MAX_DOC_BYTES,
          validUntil: Date.now() + 10 * 60 * 1000,
        });
        return { token, urlOptions: { allowedContentTypes: ['application/pdf'], maximumSizeInBytes: MAX_DOC_BYTES } };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents] upload token failed:', error);
    return jsonError(400, 'We could not start the upload.');
  }
}
