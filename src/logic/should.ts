import type { IconId, Item, Section, ShouldList } from './types';
import { nanoid } from './id';

const stamp = (s: ShouldList, patch: Partial<ShouldList>): ShouldList => ({ ...s, ...patch, updatedAt: new Date().toISOString() });
export const clampTarget = (n: number) => Math.min(99, Math.max(1, Math.round(n)));
export const clampCount = (n: number) => Math.min(99, Math.max(0, Math.round(n)));

export type NameCheck = { ok: true; name: string } | { ok: false; error: string };

export function checkItemName(s: ShouldList, sectionId: string, raw: string, ignoreId?: string): NameCheck {
  const name = raw.trim();
  if (!name) return { ok: false, error: 'נא להזין שם' };
  const dup = s.items.some((i) => i.sectionId === sectionId && i.id !== ignoreId && i.name.trim().toLowerCase() === name.toLowerCase());
  return dup ? { ok: false, error: 'כבר קיים' } : { ok: true, name };
}

export function addItem(s: ShouldList, sectionId: string, name: string, target = 1): ShouldList {
  return addItemKeep(stamp(s, {}), { id: nanoid(8), sectionId, name, target });
}

export const setTarget = (s: ShouldList, id: string, target: number) =>
  stamp(s, { items: s.items.map((i) => (i.id === id ? { ...i, target: clampTarget(target) } : i)) });

export const renameItem = (s: ShouldList, id: string, name: string) =>
  stamp(s, { items: s.items.map((i) => (i.id === id ? { ...i, name } : i)) });

export function moveItem(s: ShouldList, id: string, sectionId: string): ShouldList {
  const item = s.items.find((i) => i.id === id);
  if (!item || item.sectionId === sectionId) return s;
  return addItemKeep(stamp(s, { items: s.items.filter((i) => i.id !== id) }), { ...item, sectionId });
}
function addItemKeep(s: ShouldList, item: Item): ShouldList {
  const items = [...s.items];
  let at = -1;
  items.forEach((i, idx) => { if (i.sectionId === item.sectionId) at = idx; });
  if (at === -1) items.push(item); else items.splice(at + 1, 0, item);
  return { ...s, items };
}

export const deleteItem = (s: ShouldList, id: string) => stamp(s, { items: s.items.filter((i) => i.id !== id) });

export function addSection(s: ShouldList, name: string, icon: IconId): { list: ShouldList; id: string } {
  const sec: Section = { id: nanoid(8), name, icon };
  return { list: stamp(s, { sections: [...s.sections, sec] }), id: sec.id };
}

export const updateSection = (s: ShouldList, id: string, name: string, icon: IconId) =>
  stamp(s, { sections: s.sections.map((x) => (x.id === id ? { ...x, name, icon } : x)) });

export function moveSection(s: ShouldList, id: string, dir: -1 | 1): ShouldList {
  const idx = s.sections.findIndex((x) => x.id === id);
  const to = idx + dir;
  if (idx < 0 || to < 0 || to >= s.sections.length) return s;
  const sections = [...s.sections];
  [sections[idx], sections[to]] = [sections[to], sections[idx]];
  return stamp(s, { sections });
}

export const deleteSection = (s: ShouldList, id: string) =>
  stamp(s, { sections: s.sections.filter((x) => x.id !== id), items: s.items.filter((i) => i.sectionId !== id) });

export const itemsOf = (s: ShouldList, sectionId: string) => s.items.filter((i) => i.sectionId === sectionId);
