import type { IconId, ShouldList } from './types';
import { nanoid } from './id';

const TEMPLATE: [string, IconId, [string, number][]][] = [
  ['ירקות ופירות', 'produce', [['עגבניות', 4], ['מלפפונים', 4], ['בצל', 3], ['בננות', 6], ['תפוחים', 4]]],
  ['מוצרי חלב וביצים', 'dairy', [['חלב', 2], ['ביצים', 12], ['גבינה לבנה', 1], ['קוטג׳', 2], ['יוגורט', 4]]],
  ['מאפים ודגנים', 'bakery', [['לחם', 1], ['פיתות', 1], ['פסטה', 2], ['אורז', 1]]],
  ['מזווה', 'pantry', [['שמן זית', 1], ['טחינה', 1], ['רסק עגבניות', 2]]],
  ['ניקיון ובית', 'cleaning', [['נייר טואלט', 1], ['סבון כלים', 1], ['שקיות זבל', 1]]],
];

export const emptyShould = (): ShouldList => ({ schema: 1, updatedAt: new Date().toISOString(), sections: [], items: [] });

export function starterShould(): ShouldList {
  const out = emptyShould();
  for (const [name, icon, items] of TEMPLATE) {
    const id = nanoid(8);
    out.sections.push({ id, name, icon });
    for (const [n, target] of items) out.items.push({ id: nanoid(8), sectionId: id, name: n, target });
  }
  return out;
}

/** "Empty" list for a fresh start: one general section so items can be added immediately. */
export function quickStartShould(): ShouldList {
  const out = emptyShould();
  out.sections.push({ id: nanoid(8), name: 'כללי', icon: 'other' });
  return out;
}
