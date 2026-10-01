/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
/* Stand-in for next/headers cookies(): records what route handlers set/delete. */
export function createCookieJar() {
  const store = new Map<string, { value: string; options?: any }>();
  return {
    store,
    api: {
      get: (name: string) => (store.has(name) ? { name, value: store.get(name)!.value } : undefined),
      set: (name: string, value: string, options?: any) => void store.set(name, { value, options }),
      delete: (name: string) => void store.delete(name),
    },
  };
}
