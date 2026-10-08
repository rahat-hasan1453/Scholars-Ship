'use client';

import { useEffect, useState } from 'react';

/** `data` array from a GET endpoint; empty until it loads or when the request fails. */
export function useFetchedList<T>(url: string): T[] {
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body) => !cancelled && Array.isArray(body.data) && setData(body.data))
      .catch((err) => console.error(`[${url}] failed`, err));
    return () => {
      cancelled = true;
    };
  }, [url]);
  return data;
}
