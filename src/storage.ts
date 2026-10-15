import { useCallback, useEffect, useRef, useState } from 'react';

export const KEYS = {
  should: 'kaniyot.should.v1',
  counts: 'kaniyot.counts.v1',
  shop: 'kaniyot.shop.v1',
  ui: 'kaniyot.ui.v1',
  default: 'kaniyot.default.v1',
  theme: 'kaniyot.theme.v1',
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
  mirror(key, value === null ? null : JSON.stringify(value));
}

/* ---- durability: IndexedDB mirror + persistent-storage request ----
   iOS may evict localStorage for sites that aren't installed to the home screen.
   Every write is mirrored into IndexedDB and restored on boot if localStorage came back empty. */
const DB = 'kaniyot-mirror';
const STORE = 'kv';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export function mirror(key: string, raw: string | null) {
  void openDb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE, 'readwrite');
      if (raw === null) tx.objectStore(STORE).delete(key); else tx.objectStore(STORE).put(raw, key);
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch { db.close(); }
  });
}

/** Run once before first render: restore anything localStorage lost, then back up what it has. */
export async function initDurability() {
  try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
  const db = await openDb();
  if (!db) return;
  const keys = Object.values(KEYS);
  await Promise.all(keys.map((key) => new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const get = store.get(key);
      get.onsuccess = () => {
        let local: string | null = null;
        try { local = localStorage.getItem(key); } catch { /* ignore */ }
        if (local === null && typeof get.result === 'string') {
          try { localStorage.setItem(key, get.result); } catch { /* ignore */ }
        } else if (local !== null && local !== get.result) {
          store.put(local, key);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  })));
  db.close();
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
