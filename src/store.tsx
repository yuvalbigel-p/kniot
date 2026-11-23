import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CheckMeta, Counts, ShouldList, ShoppingList, Tab, UiState } from './logic/types';
import { KEYS, consumeCorruption, load, save, useStoredState } from './storage';
import { isCheckMeta, isCounts, isShouldList, isShoppingList, isUiState } from './logic/validate';
import { dailyBackup, join, pusher, subscribe, type Pusher, type SyncState } from './sync';

export interface ToastMsg { id: number; text: string; action?: { label: string; run: () => void } }
export interface ConfirmReq {
  title: string; body?: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void;
}
type Upd<T> = T | ((p: T) => T);

interface Store {
  /** Shared household id (null until the PIN was entered on this phone). */
  hid: string | null;
  setHid: (h: string) => void;
  sync: SyncState;
  should: ShouldList | null;
  setShould: (s: Upd<ShouldList | null>) => void;
  counts: Counts;
  setCounts: (c: Upd<Counts>) => void;
  /** Monthly (supermarket) list, built from the home check. */
  shop: ShoppingList;
  setShop: (s: Upd<ShoppingList>) => void;
  /** Weekly (bodega) list, shared and ongoing. */
  quick: ShoppingList;
  setQuick: (v: Upd<ShoppingList>) => void;
  checkMeta: CheckMeta;
  setCheckMeta: (m: Upd<CheckMeta>) => void;
  lastTab: Tab;
  setLastTab: (t: Tab) => void;
  toast: ToastMsg | null;
  showToast: (text: string, action?: ToastMsg['action']) => void;
  dismissToast: () => void;
  confirm: ConfirmReq | null;
  askConfirm: (c: ConfirmReq | null) => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('store missing');
  return c;
};

const nullable = (v: unknown): v is ShouldList | null => v === null || isShouldList(v);
const isHid = (v: unknown): v is string | null => v === null || (typeof v === 'string' && v.length >= 24);
const emptyShop = (): ShoppingList => ({ createdAt: new Date().toISOString(), lines: [] });
const resolve = <T,>(next: Upd<T>, prev: T) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next);

/** Local state (localStorage + IndexedDB mirror) whose user edits are also pushed to the household. */
function useSynced<T>(key: string, fallback: () => T, valid: (v: unknown) => v is T, push: (prev: T, next: T) => void) {
  const [value, setRaw] = useStoredState<T>(key, fallback, valid);
  const ref = useRef(value);
  ref.current = value;
  const pushRef = useRef(push);
  pushRef.current = push;
  /** user edit: save locally + push */
  const set = useCallback((next: Upd<T>) => {
    const prev = ref.current;
    const v = resolve(next, prev);
    ref.current = v;
    setRaw(v);
    pushRef.current(prev, v);
  }, [setRaw]);
  /** remote update: save locally only */
  const apply = useCallback((v: T) => { ref.current = v; setRaw(v); }, [setRaw]);
  return [value, set, apply, ref] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hid, setHidRaw] = useState<string | null>(() => load<string | null>(KEYS.hid, () => null, isHid));
  const [sync, setSync] = useState<SyncState>('connecting');
  const pushRef = useRef<Pusher | null>(null);
  const p = () => pushRef.current;

  const [should, setShould, applyShould, shouldRef] = useSynced<ShouldList | null>(KEYS.should, () => null, nullable, (_, v) => p()?.should(v));
  const [counts, setCounts, applyCounts, countsRef] = useSynced<Counts>(KEYS.counts, () => ({}), isCounts, (_, v) => p()?.counts(v));
  const [checkMeta, setCheckMeta, applyCheck, checkRef] = useSynced<CheckMeta>(KEYS.check, () => ({ savedAt: null, dirty: false }), isCheckMeta, (_, v) => p()?.check(v));
  const [shop, setShop, applyShop, shopRef] = useSynced<ShoppingList>(KEYS.shop, emptyShop, isShoppingList, (a, b) => p()?.lines('monthly', a.lines, b.lines));
  const [quick, setQuick, applyQuick, quickRef] = useSynced<ShoppingList>(KEYS.quick, emptyShop, isShoppingList, (a, b) => p()?.lines('weekly', a.lines, b.lines));
  const [ui, setUi] = useStoredState<UiState>(KEYS.ui, () => ({ lastTab: 'should' }), isUiState);

  const setHid = useCallback((h: string) => { save(KEYS.hid, h); setHidRaw(h); }, []);

  // connect: join once per phone, then live listeners + daily backup
  useEffect(() => {
    if (!hid) return;
    let off = () => {};
    let cancelled = false;
    const local = () => ({ should: shouldRef.current, counts: countsRef.current, check: checkRef.current, weekly: quickRef.current, monthly: shopRef.current });
    const joinedKey = `kaniyot.joined.${hid}`;
    (async () => {
      if (localStorage.getItem(joinedKey) !== '1') {
        await join(hid, local());
        localStorage.setItem(joinedKey, '1');
      }
      if (cancelled) return;
      pushRef.current = pusher(hid);
      off = subscribe(hid, {
        should: applyShould, counts: applyCounts, check: applyCheck, state: setSync,
        lists: (weekly, monthly) => {
          applyQuick({ ...quickRef.current, lines: weekly });
          applyShop({ ...shopRef.current, lines: monthly });
        },
      });
      setTimeout(() => { if (!cancelled) dailyBackup(hid, local()).catch(() => {}); }, 4000);
    })().catch((e) => { console.warn('[kniot] join', e); setSync('offline'); });
    return () => { cancelled = true; pushRef.current = null; off(); };
  }, [hid, applyShould, applyCounts, applyCheck, applyQuick, applyShop, shouldRef, countsRef, checkRef, quickRef, shopRef]);

  const [toast, setToast] = useState<ToastMsg | null>(null);
  const timer = useRef<number>(0);
  const dismissToast = useCallback(() => { window.clearTimeout(timer.current); setToast(null); }, []);
  const showToast = useCallback((text: string, action?: ToastMsg['action']) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text, action });
    timer.current = window.setTimeout(() => setToast(null), action ? 5000 : 2800);
  }, []);
  const [confirm, askConfirm] = useState<ConfirmReq | null>(null);
  useEffect(() => { if (consumeCorruption()) showToast('שחזרנו הגדרות ברירת מחדל'); }, [showToast]);

  const value = useMemo<Store>(() => ({
    hid, setHid, sync, should, setShould, counts, setCounts, shop, setShop, quick, setQuick, checkMeta, setCheckMeta,
    lastTab: ui.lastTab, setLastTab: (t) => setUi({ lastTab: t }),
    toast, showToast, dismissToast, confirm, askConfirm,
  }), [hid, setHid, sync, should, setShould, counts, setCounts, shop, setShop, quick, setQuick, checkMeta, setCheckMeta, ui.lastTab, setUi, toast, showToast, dismissToast, confirm]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
