'use client';

import { useEffect } from 'react';
import type { SearchMissInput } from '@/lib/searchMiss';

const SETTLE_MS = 2000;
const SENT_KEY = 'searchMiss:sent';

// Logs a search that found nothing while the catalogue has data, once per combination per tab session.
// Waits for the filters to settle so clicking through options doesn't log every step.
export function useSearchMissLog(miss: SearchMissInput, catalogueSize: number, resultCount: number) {
  const key = JSON.stringify(miss);
  const isMiss = catalogueSize > 0 && resultCount === 0;

  useEffect(() => {
    if (!isMiss) return;
    const timer = setTimeout(() => {
      let sent: string[] = [];
      try {
        sent = JSON.parse(sessionStorage.getItem(SENT_KEY) ?? '[]') as string[];
      } catch {}
      if (sent.includes(key)) return;
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent, key].slice(-100)));
      } catch {}
      void fetch('/api/search-miss', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key, keepalive: true }).catch(() => {});
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [isMiss, key]);
}
