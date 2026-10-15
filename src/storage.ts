import { useCallback, useEffect, useRef, useState } from 'react';

export const KEYS = {
  should: 'kaniyot.should.v1',
  counts: 'kaniyot.counts.v1',
  shop: 'kaniyot.shop.v1',
  ui: 'kaniyot.ui.v1',
} as const;

let corruptionSeen = false;
export const consumeCorruption = () => { const c = corruptionSeen; corruptionSeen = false; return c; };

/** Read + validate. Invalid data is moved aside to `<key>.corrupt-<ts>` and the default is used. */
export function load<T>(key: string, fallback: () => T, valid: (v: unknown) => v is T): T {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch { return fallback(); }
  if (raw === null) return fallback();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (valid(parsed)) return parsed;
  } catch { /* fall through */ }
  try {
    localStorage.setItem(`${key}.corrupt-${Date.now()}`, raw);
    localStorage.removeItem(key);
  } catch { /* ignore */ }
  corruptionSeen = true;
  return fallback();
}

export function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full / blocked */ }
}

/** State persisted under `key`, written straight after each change. */
export function useStoredState<T>(
  key: string, fallback: () => T, valid: (v: unknown) => v is T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => load(key, fallback, valid));
  const ref = useRef(value);
  ref.current = value;
  const set = useCallback((next: T | ((prev: T) => T)) => {
    const v = typeof next === 'function' ? (next as (p: T) => T)(ref.current) : next;
    ref.current = v;
    save(key, v);
    setValue(v);
  }, [key]);
  // keep multiple tabs / windows loosely in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try { const p: unknown = JSON.parse(e.newValue); if (valid(p)) { ref.current = p; setValue(p); } } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, valid]);
  return [value, set];
}
