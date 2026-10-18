import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Counts, ShouldList, ShoppingList, Tab, UiState } from './logic/types';
import { KEYS, consumeCorruption, load, save, useStoredState } from './storage';
import { isCounts, isShouldList, isShoppingList, isUiState } from './logic/validate';
import { pruneCounts } from './logic/diff';

export interface ToastMsg { id: number; text: string; action?: { label: string; run: () => void } }
export interface ConfirmReq {
  title: string; body?: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void;
}

interface Store {
  should: ShouldList | null;
  setShould: (s: ShouldList | null | ((p: ShouldList | null) => ShouldList | null)) => void;
  /** Replace the should list (import) and drop counts for items that no longer exist. */
  replaceShould: (s: ShouldList) => void;
  /** Replace the list with no confirm; shows a plain toast. */
  replaceWithUndo: (s: ShouldList, msg: string) => void;
  defaultList: ShouldList | null;
  /** The list that was active before the last replacement, kept silently so it can be restored. */
  previousList: ShouldList | null;
  restorePrevious: () => void;
  saveDefault: (s: ShouldList) => void;
  counts: Counts;
  setCounts: (c: Counts | ((p: Counts) => Counts)) => void;
  shop: ShoppingList;
  setShop: (s: ShoppingList | ((p: ShoppingList) => ShoppingList)) => void;
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
const emptyShop = (): ShoppingList => ({ createdAt: new Date().toISOString(), lines: [] });

export function StoreProvider({ children }: { children: ReactNode }) {
  // should-list is stored as absent (first run) or valid
  const [should, setShouldRaw] = useState<ShouldList | null>(() => load<ShouldList | null>(KEYS.should, () => null, nullable));
  const shouldRef = useRef(should);
  shouldRef.current = should;
  const setShould: Store['setShould'] = useCallback((next) => {
    const v = typeof next === 'function' ? next(shouldRef.current) : next;
    shouldRef.current = v;
    save(KEYS.should, v);
    setShouldRaw(v);
  }, []);

  const [defaultList, setDefaultList] = useStoredState<ShouldList | null>(KEYS.default, () => null, nullable);
  const [previousList, setPreviousList] = useStoredState<ShouldList | null>(KEYS.previous, () => null, nullable);
  const [counts, setCounts] = useStoredState<Counts>(KEYS.counts, () => ({}), isCounts);
  const [shop, setShop] = useStoredState<ShoppingList>(KEYS.shop, emptyShop, isShoppingList);
  const [ui, setUi] = useStoredState<UiState>(KEYS.ui, () => ({ lastTab: 'should' }), isUiState);

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

  const replaceShould = useCallback((s: ShouldList) => {
    if (shouldRef.current && shouldRef.current.items.length) setPreviousList(shouldRef.current);
    setShould(s);
    setCounts((c) => pruneCounts(c, s));
  }, [setShould, setCounts, setPreviousList]);

  const countsRef = useRef(counts);
  countsRef.current = counts;
  const replaceWithUndo = useCallback((s: ShouldList, msg: string) => {
    replaceShould(s);
    setShop(emptyShop());
    showToast(msg);
  }, [replaceShould, setShop, showToast]);

  const restorePrevious = useCallback(() => {
    const prev = previousList;
    if (!prev) return;
    if (shouldRef.current && shouldRef.current.items.length) setPreviousList(shouldRef.current);
    setShould(prev);
    setShop(emptyShop());
    showToast('הרשימה הקודמת שוחזרה');
  }, [previousList, setPreviousList, setShould, setShop, showToast]);

  const value = useMemo<Store>(() => ({
    should, setShould, replaceShould, replaceWithUndo, defaultList, previousList, restorePrevious, saveDefault: (l) => setDefaultList(l), counts, setCounts, shop, setShop,
    lastTab: ui.lastTab, setLastTab: (t) => setUi({ lastTab: t }),
    toast, showToast, dismissToast, confirm, askConfirm,
  }), [should, setShould, replaceShould, replaceWithUndo, defaultList, previousList, restorePrevious, setDefaultList, counts, setCounts, shop, setShop, ui.lastTab, setUi, toast, showToast, dismissToast, confirm]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
