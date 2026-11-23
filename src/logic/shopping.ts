import type { Counts, ShouldList, ShoppingLine, ShoppingList } from './types';
import { gap } from './gap';
import { nanoid } from './id';

export function buildLines(should: ShouldList, counts: Counts): ShoppingLine[] {
  const lines: ShoppingLine[] = [];
  for (const section of should.sections) {
    for (const item of should.items) {
      if (item.sectionId !== section.id) continue;
      const g = gap(item, counts);
      if (g > 0) {
        lines.push({
          id: nanoid(8), name: item.name, qty: g, checked: false,
          itemId: item.id, sectionId: item.sectionId, oneOff: false,
        });
      }
    }
  }
  return lines;
}

export const countGaps = (should: ShouldList, counts: Counts) =>
  should.items.filter((i) => gap(i, counts) > 0).length;

export const unchecked = (list: ShoppingList) => list.lines.filter((l) => !l.checked);

/** Number of unchecked lines that would trigger the "new list?" confirm. */
export const needsExportConfirm = (list: ShoppingList) => unchecked(list).length > 0;

/** Export rules: generated gap lines + old unchecked one-offs. */
export function exportList(
  should: ShouldList, counts: Counts, current: ShoppingList, now = new Date().toISOString(),
): ShoppingList {
  const carried = current.lines.filter((l) => l.oneOff && !l.checked);
  return { createdAt: now, lines: [...buildLines(should, counts), ...carried] };
}

export type AddResult = { list: ShoppingList; outcome: 'added' | 'highlight' | 'unchecked' | 'ignored'; lineId?: string };

const norm = (s: string) => s.trim().toLowerCase();

export function addOneOff(list: ShoppingList, rawName: string): AddResult {
  const name = rawName.trim();
  if (!name) return { list, outcome: 'ignored' };
  const existing = list.lines.find((l) => norm(l.name) === norm(name));
  if (existing) {
    if (!existing.checked) return { list, outcome: 'highlight', lineId: existing.id };
    return {
      list: { ...list, lines: list.lines.map((l) => (l.id === existing.id ? { ...l, checked: false } : l)) },
      outcome: 'unchecked', lineId: existing.id,
    };
  }
  const line: ShoppingLine = { id: nanoid(8), name, qty: 1, checked: false, oneOff: true };
  return { list: { ...list, lines: [...list.lines, line] }, outcome: 'added', lineId: line.id };
}

export const progress = (list: ShoppingList) => {
  const total = list.lines.length;
  const done = list.lines.filter((l) => l.checked).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
};

export interface Group { key: string; sectionId?: string; title: string; lines: ShoppingLine[]; kind: 'section' | 'other' | 'oneoff' }

/** Group lines: should-list order, orphans under אחר, one-offs last. */
export function groupLines(list: ShoppingList, should: ShouldList): Group[] {
  const groups: Group[] = [];
  const known = new Set(should.sections.map((s) => s.id));
  for (const s of should.sections) {
    const lines = list.lines.filter((l) => !l.oneOff && l.sectionId === s.id);
    if (lines.length) groups.push({ key: s.id, sectionId: s.id, title: s.name, lines, kind: 'section' });
  }
  const orphans = list.lines.filter((l) => !l.oneOff && (!l.sectionId || !known.has(l.sectionId)));
  if (orphans.length) groups.push({ key: 'other', title: 'אחר', lines: orphans, kind: 'other' });
  const oneOffs = list.lines.filter((l) => l.oneOff);
  if (oneOffs.length) groups.push({ key: 'oneoff', title: 'תוספות לפעם הזו', lines: oneOffs, kind: 'oneoff' });
  return groups;
}

/** Saving the home check: update the monthly list in place.
 *  - missing item already on the list -> qty updated (checked state kept)
 *  - missing item not on the list -> added
 *  - item no longer missing and not yet bought -> removed
 *  - one-offs and bought lines are untouched */
export function mergeGaps(should: ShouldList, counts: Counts, current: ShoppingList): ShoppingList {
  const fresh = buildLines(should, counts);
  const byItem = new Map(fresh.map((l) => [l.itemId!, l]));
  const kept: ShoppingLine[] = [];
  const seen = new Set<string>();
  for (const l of current.lines) {
    if (l.oneOff || !l.itemId) { kept.push(l); continue; }
    const f = byItem.get(l.itemId);
    if (f) { kept.push({ ...l, qty: f.qty, name: f.name, sectionId: f.sectionId }); seen.add(l.itemId); }
    else if (l.checked) kept.push(l);
  }
  const added = fresh.filter((l) => !seen.has(l.itemId!));
  const oneOffs = kept.filter((l) => l.oneOff);
  const rest = kept.filter((l) => !l.oneOff);
  return { ...current, lines: [...rest, ...added, ...oneOffs] };
}

/** "סיום קנייה": bought (checked) lines leave the list, the rest stay for next time. */
export const finishShop = (list: ShoppingList): ShoppingList => ({ ...list, lines: list.lines.filter((l) => !l.checked) });
