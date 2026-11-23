/* Shared household sync (Firestore). No accounts: a PIN hash points to a household id
   (`pins/{sha256}` -> { hid }); the long random hid is the secret. Rules: see CLAUDE.md.

   households/{hid}             { should, counts, check, backupDay, createdAt, updatedAt }
   households/{hid}/lines/{id}  { list: 'weekly' | 'monthly', order, ...ShoppingLine }
   households/{hid}/backups/{d} { should, lines, at }   (one per day, written on app open)

   Lines are one document each so two phones editing at once (or one offline) never overwrite each other. */
import { initializeApp } from 'firebase/app';
import {
  type Firestore, collection, doc, getDoc, getDocFromServer, getDocs, initializeFirestore, limit, onSnapshot, orderBy,
  disableNetwork, enableNetwork, persistentLocalCache, persistentMultipleTabManager, query, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import type { CheckMeta, Counts, ShoppingLine, ShoppingList, ShouldList } from './logic/types';
import { isCheckMeta, isCounts, isShouldList } from './logic/validate';

export const firebaseConfig = {
  apiKey: 'AIzaSyChrqSUy8npbv4o5Ea7z0byad1IcnmE1Oo',
  authDomain: 'kniot-e1108.firebaseapp.com',
  projectId: 'kniot-e1108',
  storageBucket: 'kniot-e1108.firebasestorage.app',
  messagingSenderId: '917808708386',
  appId: '1:917808708386:web:4bd953745f70353f8e837b',
};

export const app = initializeApp(firebaseConfig);
let _db: Firestore | null = null;
export const db = () => (_db ??= initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
}));

export type ListName = 'weekly' | 'monthly';
export type SyncState = 'connecting' | 'live' | 'offline';

export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kniot:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** PIN -> household id, or null if the PIN is unknown. Throws when offline. */
export async function resolvePin(pin: string): Promise<string | null> {
  const snap = await getDocFromServer(doc(db(), 'pins', await hashPin(pin)));
  const hid = snap.exists() ? snap.get('hid') : null;
  return typeof hid === 'string' && hid.length >= 24 ? hid : null;
}

const hh = (hid: string) => doc(db(), 'households', hid);
const linesCol = (hid: string) => collection(db(), 'households', hid, 'lines');
const now = () => new Date().toISOString();
const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time

const strip = ({ list: _l, ...rest }: ShoppingLine & { list?: string }) => rest as ShoppingLine;
const same = (a: ShoppingLine, b: ShoppingLine) => JSON.stringify(a) === JSON.stringify(b);
const norm = (s: string) => s.trim().toLowerCase();

export interface Local {
  should: ShouldList | null; counts: Counts; check: CheckMeta; weekly: ShoppingList; monthly: ShoppingList;
}
export interface Apply {
  should: (v: ShouldList | null) => void; counts: (v: Counts) => void; check: (v: CheckMeta) => void;
  lists: (weekly: ShoppingLine[], monthly: ShoppingLine[]) => void; state: (s: SyncState) => void;
}

/** First connection on this phone: seed an empty household from local data, or merge local
 *  unchecked list items into an existing one (remote wins for the should list; the local one is backed up). */
export async function join(hid: string, local: Local) {
  const ref = hh(hid);
  const snap = await getDoc(ref);
  const remoteLines = await getDocs(linesCol(hid));
  const batch = writeBatch(db());
  if (!snap.exists() || !snap.get('should')) {
    batch.set(ref, { should: local.should, counts: local.counts, check: local.check, createdAt: now(), updatedAt: now() }, { merge: true });
  } else if (local.should && JSON.stringify(local.should) !== JSON.stringify(snap.get('should'))) {
    batch.set(doc(ref, 'backups', `join-${Date.now()}`), { should: local.should, at: now() });
  }
  const existing = remoteLines.docs.map((d) => d.data() as ShoppingLine & { list: ListName });
  let order = Date.now();
  for (const [list, l] of [['weekly', local.weekly], ['monthly', local.monthly]] as const) {
    for (const line of l.lines) {
      if (line.checked) continue;
      if (existing.some((e) => e.list === list && norm(e.name) === norm(line.name))) continue;
      batch.set(doc(linesCol(hid), line.id), { ...line, list, order: order++ });
    }
  }
  await batch.commit();
}

/** Live listeners. Returns an unsubscribe function. */
export function subscribe(hid: string, apply: Apply) {
  apply.state('connecting');
  let docLive = false; let linesLive = false;
  const report = () => apply.state(docLive && linesLive ? 'live' : 'offline');
  const u1 = onSnapshot(hh(hid), { includeMetadataChanges: true }, (s) => {
    docLive = !s.metadata.fromCache; report();
    if (!s.exists()) return;
    const d = s.data();
    if (d.should === null || isShouldList(d.should)) apply.should(d.should ?? null);
    if (isCounts(d.counts)) apply.counts(d.counts);
    if (isCheckMeta(d.check)) apply.check(d.check);
  }, () => { docLive = false; report(); });
  let serverSeen = false;
  const u2 = onSnapshot(linesCol(hid), { includeMetadataChanges: true }, (s) => {
    linesLive = !s.metadata.fromCache; report();
    if (linesLive) serverSeen = true;
    // Until the server has answered once this session, the offline cache may be empty or partial
    // (cleared by iOS, never filled): keep the local lists (localStorage) instead.
    if (s.metadata.fromCache && !serverSeen) return;
    const all = s.docs.map((d) => d.data() as ShoppingLine & { list: ListName; order?: number })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    apply.lists(all.filter((l) => l.list === 'weekly').map(strip), all.filter((l) => l.list === 'monthly').map(strip));
  }, () => { linesLive = false; report(); });
  return () => { u1(); u2(); };
}

/** Writes for local edits. Each call sends only what changed. */
export function pusher(hid: string) {
  const field = (name: string, value: unknown) =>
    updateDoc(hh(hid), { [name]: value, updatedAt: now() }).catch((e) => console.warn('[kniot] sync', e));
  return {
    should: (v: ShouldList | null) => field('should', v),
    counts: (v: Counts) => field('counts', v),
    check: (v: CheckMeta) => field('check', v),
    lines(list: ListName, prev: ShoppingLine[], next: ShoppingLine[]) {
      const before = new Map(prev.map((l) => [l.id, l]));
      const ids = new Set(next.map((l) => l.id));
      const batch = writeBatch(db());
      let n = 0;
      const base = Date.now();
      next.forEach((l, i) => {
        const p = before.get(l.id);
        if (p && same(p, l)) return;
        batch.set(doc(linesCol(hid), l.id), { ...l, list, order: l.order ?? base + i });
        n++;
      });
      for (const l of prev) if (!ids.has(l.id)) { batch.delete(doc(linesCol(hid), l.id)); n++; }
      if (n) batch.commit().catch((e) => console.warn('[kniot] sync', e));
    },
  };
}
export type Pusher = ReturnType<typeof pusher>;

/** One backup per day of the should list and both lists. */
export async function dailyBackup(hid: string, local: Local) {
  const ref = hh(hid);
  const snap = await getDoc(ref);
  const day = today();
  if (!snap.exists() || snap.get('backupDay') === day || !local.should) return;
  const batch = writeBatch(db());
  batch.set(doc(ref, 'backups', day), {
    should: local.should, at: now(),
    lines: [...local.weekly.lines.map((l) => ({ ...l, list: 'weekly' })), ...local.monthly.lines.map((l) => ({ ...l, list: 'monthly' }))],
  });
  batch.update(ref, { backupDay: day });
  await batch.commit();
}

export interface Backup { id: string; at: string; should: ShouldList }
export async function listBackups(hid: string): Promise<Backup[]> {
  const s = await getDocs(query(collection(hh(hid), 'backups'), orderBy('at', 'desc'), limit(20)));
  return s.docs.map((d) => ({ id: d.id, at: String(d.get('at')), should: d.get('should') }))
    .filter((b) => isShouldList(b.should));
}

export const ensureHousehold = (hid: string) => setDoc(hh(hid), { updatedAt: now() }, { merge: true });

/** iOS freezes a backgrounded PWA and its connection can come back stale: reconnect when it returns. */
export function reconnectOnResume() {
  let last = Date.now();
  const on = () => {
    if (document.visibilityState !== 'visible') { last = Date.now(); return; }
    if (Date.now() - last < 3000) return;
    disableNetwork(db()).then(() => enableNetwork(db())).catch(() => {});
  };
  document.addEventListener('visibilitychange', on);
  return () => document.removeEventListener('visibilitychange', on);
}
