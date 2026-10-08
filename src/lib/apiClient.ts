// Browser helper for the user-data API: JSON in/out, throws ApiError on any non-2xx so callers can roll back.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok) {
    const error = (json as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof error === 'string' ? error : `Request failed (${res.status})`);
  }
  return json as T;
}

/** Ids for new rows are made in the browser so an optimistic card keeps the same id after it is saved */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // RFC 4122 v4 fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
