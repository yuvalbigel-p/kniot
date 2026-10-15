import type { Counts, ShouldList } from './types';

export interface Diff {
  addedSections: { name: string; itemCount: number }[];
  removedSections: string[];
  renamedSections: { from: string; to: string }[];
  addedItems: string[];
  removedItems: string[];
  renamedItems: { from: string; to: string }[];
  targetChanges: { name: string; from: number; to: number }[];
  movedItems: string[];
  isEmpty: boolean;
}

export function diffShould(local: ShouldList, incoming: ShouldList): Diff {
  const ls = new Map(local.sections.map((s) => [s.id, s]));
  const is = new Map(incoming.sections.map((s) => [s.id, s]));
  const li = new Map(local.items.map((i) => [i.id, i]));
  const ii = new Map(incoming.items.map((i) => [i.id, i]));

  const addedSections = incoming.sections
    .filter((s) => !ls.has(s.id))
    .map((s) => ({ name: s.name, itemCount: incoming.items.filter((i) => i.sectionId === s.id).length }));
  const removedSections = local.sections.filter((s) => !is.has(s.id)).map((s) => s.name);
  const renamedSections = incoming.sections
    .filter((s) => ls.has(s.id) && ls.get(s.id)!.name !== s.name)
    .map((s) => ({ from: ls.get(s.id)!.name, to: s.name }));

  const newSectionIds = new Set(addedSections.length ? incoming.sections.filter((s) => !ls.has(s.id)).map((s) => s.id) : []);
  const addedItems = incoming.items.filter((i) => !li.has(i.id) && !newSectionIds.has(i.sectionId)).map((i) => i.name);
  const removedSectionIds = new Set(local.sections.filter((s) => !is.has(s.id)).map((s) => s.id));
  const removedItems = local.items.filter((i) => !ii.has(i.id) && !removedSectionIds.has(i.sectionId)).map((i) => i.name);
  const renamedItems = incoming.items
    .filter((i) => li.has(i.id) && li.get(i.id)!.name !== i.name)
    .map((i) => ({ from: li.get(i.id)!.name, to: i.name }));
  const targetChanges = incoming.items
    .filter((i) => li.has(i.id) && li.get(i.id)!.target !== i.target)
    .map((i) => ({ name: i.name, from: li.get(i.id)!.target, to: i.target }));
  const movedItems = incoming.items
    .filter((i) => li.has(i.id) && li.get(i.id)!.sectionId !== i.sectionId && is.has(i.sectionId) && ls.has(i.sectionId))
    .map((i) => i.name);

  const isEmpty = ![addedSections, removedSections, renamedSections, addedItems, removedItems, renamedItems, targetChanges, movedItems].some((a) => a.length);
  return { addedSections, removedSections, renamedSections, addedItems, removedItems, renamedItems, targetChanges, movedItems, isEmpty };
}

export const pruneCounts = (counts: Counts, should: ShouldList): Counts => {
  const ids = new Set(should.items.map((i) => i.id));
  return Object.fromEntries(Object.entries(counts).filter(([id]) => ids.has(id)));
};

export const localIsNewer = (local: ShouldList, incoming: ShouldList) =>
  Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt);
