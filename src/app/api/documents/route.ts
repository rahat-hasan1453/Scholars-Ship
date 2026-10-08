import { NextResponse } from 'next/server';
import { jsonError, parseBody, serverError, sessionUserId, unauthorized } from '@/lib/apiHelpers';
import { DOC_KINDS, DocumentError, deleteKind, listDocuments, registerSchema, registerUpload, storageConfigured, userPrefix, type DocKind } from '@/lib/documents';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    // uploadPrefix: the folder the browser must upload into (checked again by /api/documents/upload)
    return NextResponse.json({ success: true, documents: await listDocuments(userId), uploadPrefix: userPrefix(userId), storageReady: storageConfigured() });
  } catch (error) {
    return serverError('GET /api/documents', error);
  }
}

/** Records files the browser already uploaded to Blob */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const body = await parseBody(req, registerSchema);
  if (!body.ok) return body.response;
  try {
    return NextResponse.json({ success: true, documents: await registerUpload(userId, body.data) });
  } catch (error) {
    if (error instanceof DocumentError) return jsonError(error.status, error.message);
    return serverError('POST /api/documents', error);
  }
}

/** DELETE /api/documents?kind=cv removes every file of that kind */
export async function DELETE(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  const kind = new URL(req.url).searchParams.get('kind') as DocKind | null;
  if (!kind || !DOC_KINDS.includes(kind)) return jsonError(400, 'Unknown document type.');
  try {
    await deleteKind(userId, kind);
    return NextResponse.json({ success: true, documents: await listDocuments(userId) });
  } catch (error) {
    return serverError('DELETE /api/documents', error);
  }
}
