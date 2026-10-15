import type { Counts, ShouldList, ShoppingList, UiState } from './types';
import { ICON_IDS } from './icons';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export function isShouldList(v: unknown): v is ShouldList {
  if (!isObj(v) || v.schema !== 1 || !isStr(v.updatedAt) || !Array.isArray(v.sections) || !Array.isArray(v.items)) return false;
  const ids = new Set<string>();
  for (const s of v.sections) {
    if (!isObj(s) || !isStr(s.id) || !isStr(s.name) || !s.name.trim() || !isStr(s.icon) || !ICON_IDS.has(s.icon)) return false;
    if (ids.has(s.id)) return false;
    ids.add(s.id);
  }
  const itemIds = new Set<string>();
  for (const i of v.items) {
    if (!isObj(i) || !isStr(i.id) || !isStr(i.sectionId) || !isStr(i.name) || !i.name.trim() || !isInt(i.target, 1, 99)) return false;
    if (!ids.has(i.sectionId) || itemIds.has(i.id)) return false;
    itemIds.add(i.id);
  }
  return true;
}

export function isCounts(v: unknown): v is Counts {
  return isObj(v) && Object.values(v).every((n) => isInt(n, 0, 99));
}

export function isShoppingList(v: unknown): v is ShoppingList {
  if (!isObj(v) || !isStr(v.createdAt) || !Array.isArray(v.lines)) return false;
  return v.lines.every(
    (l) => isObj(l) && isStr(l.id) && isStr(l.name) && typeof l.qty === 'number' && typeof l.checked === 'boolean' && typeof l.oneOff === 'boolean',
  );
}

export const isUiState = (v: unknown): v is UiState =>
  isObj(v) && (v.lastTab === 'should' || v.lastTab === 'check' || v.lastTab === 'shop');
