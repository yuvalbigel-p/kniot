import type { Counts, Item } from './types';

export const gap = (item: Item, counts: Counts) =>
  Math.max(0, item.target - (counts[item.id] ?? 0));
