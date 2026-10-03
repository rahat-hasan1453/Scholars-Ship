'use client';

import { useCallback, useEffect, useState } from 'react';

// useState that survives leaving the page within the same tab (e.g. list → details → back).
// Starts from `initial` on the server and first render, then restores the saved value after mount.
// Only explicit updates are written, so the restore can't be overwritten by the initial value.
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once after hydration
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {}
  }, [key]);

  const update = useCallback(
    (next: React.SetStateAction<T>) =>
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          sessionStorage.setItem(key, JSON.stringify(resolved));
        } catch {}
        return resolved;
      }),
    [key],
  );

  return [value, update] as const;
}
