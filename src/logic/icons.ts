import type { IconId } from './types';

export const HUES = {
  olive: ['var(--h-olive)', 'var(--h-olive-bg)'],
  blue: ['var(--h-blue)', 'var(--h-blue-bg)'],
  mustard: ['var(--h-mustard)', 'var(--h-mustard-bg)'],
  terra: ['var(--h-terra)', 'var(--h-terra-bg)'],
  plum: ['var(--h-plum)', 'var(--h-plum-bg)'],
  taupe: ['var(--h-taupe)', 'var(--h-taupe-bg)'],
} as const;

interface IconDef { id: IconId; label: string; hue: keyof typeof HUES; d: string }

export const ICONS: IconDef[] = [
  { id: 'produce', label: 'ירקות', hue: 'olive', d: 'M4 14c0-5 4-9 9-9h7v2c0 7-5 11-11 11H4v-4zM4 18c3-3 6-5 11-9' },
  { id: 'fruit', label: 'פירות', hue: 'olive', d: 'M12 7c-2-2-7-1-7 5s3 9 5 9c1 0 1-.5 2-.5s1 .5 2 .5c2 0 5-3 5-9s-5-7-7-5zM12 7c0-2 1-3 3-4' },
  { id: 'dairy', label: 'מוצרי חלב', hue: 'blue', d: 'M12 3s-6 7.5-6 12a6 6 0 0012 0c0-4.5-6-12-6-12z' },
  { id: 'eggs', label: 'ביצים', hue: 'mustard', d: 'M12 4c3 0 6 5 6 10a6 6 0 01-12 0c0-5 3-10 6-10z' },
  { id: 'bakery', label: 'מאפים', hue: 'mustard', d: 'M4 13c0-4 3-8 8-8s8 4 8 8-3 3-8 3-8 1-8-3zM8 13v5M12 13v5M16 13v5' },
  { id: 'grains', label: 'דגנים', hue: 'mustard', d: 'M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 13c-2-1-4-2-4-5 2 0 4 2 4 5zM12 13c2-1 4-2 4-5-2 0-4 2-4 5z' },
  { id: 'meat', label: 'בשר', hue: 'terra', d: 'M14 4a6 6 0 016 6c0 3-3 5-6 5l-4 4a2 2 0 11-3-3l4-4c0-3 0-8 3-8z' },
  { id: 'fish', label: 'דגים', hue: 'blue', d: 'M3 12c3-4 7-6 11-6 3 0 5 3 6 6-1 3-3 6-6 6-4 0-8-2-11-6zM16 11v.01' },
  { id: 'frozen', label: 'קפואים', hue: 'blue', d: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9' },
  { id: 'pantry', label: 'מזווה', hue: 'mustard', d: 'M7 7h10v12a2 2 0 01-2 2H9a2 2 0 01-2-2zM8 3h8v4H8zM7 12h10' },
  { id: 'spices', label: 'תבלינים', hue: 'terra', d: 'M9 9h6l1 11a1 1 0 01-1 1H9a1 1 0 01-1-1zM9 9l1-5h4l1 5' },
  { id: 'snacks', label: 'חטיפים', hue: 'plum', d: 'M6 4h12l-1 3 1 13H6l1-13zM7 7h10' },
  { id: 'sweets', label: 'מתוקים', hue: 'plum', d: 'M8 12a4 4 0 108 0 4 4 0 10-8 0zM8 12L4 9v6zM16 12l4-3v6z' },
  { id: 'drinks', label: 'שתייה', hue: 'blue', d: 'M10 3h4v4l2 3v10a1 1 0 01-1 1H9a1 1 0 01-1-1V10l2-3zM8 13h8' },
  { id: 'coffee', label: 'קפה ותה', hue: 'taupe', d: 'M5 9h11v6a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 11h2a2 2 0 010 4h-2M9 3v3M12 3v3' },
  { id: 'cleaning', label: 'ניקיון', hue: 'taupe', d: 'M9 4h4l1 2h2a1 1 0 011 1v2l-2 2v9a1 1 0 01-1 1H9a1 1 0 01-1-1v-9L6 9V7a1 1 0 011-1h2z' },
  { id: 'bath', label: 'רחצה', hue: 'blue', d: 'M4 12h16v5a3 3 0 01-3 3H7a3 3 0 01-3-3zM8 8a2 2 0 104 0 2 2 0 10-4 0zM14 5a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0z' },
  { id: 'paper', label: 'נייר', hue: 'taupe', d: 'M4 9a4 4 0 108 0 4 4 0 10-8 0zM8 5h10v13H8' },
  { id: 'baby', label: 'תינוקות', hue: 'plum', d: 'M10 3h4v3h-4zM9 6h6l1 3v10a2 2 0 01-2 2h-4a2 2 0 01-2-2V9zM9 13h6' },
  { id: 'pets', label: 'חיות מחמד', hue: 'terra', d: 'M8 15c-2 3 0 5 4 5s6-2 4-5c-1-2-2-3-4-3s-3 1-4 3zM5 10a1.5 2 0 103 0 1.5 2 0 10-3 0zM9 6a1.5 2 0 103 0 1.5 2 0 10-3 0zM12 6a1.5 2 0 103 0 1.5 2 0 10-3 0zM16 10a1.5 2 0 103 0 1.5 2 0 10-3 0z' },
  { id: 'pharmacy', label: 'פארם', hue: 'plum', d: 'M8 16l8-8a3.5 3.5 0 00-5-5L3 11a3.5 3.5 0 005 5zM7 7l5 5' },
  { id: 'home', label: 'לבית', hue: 'taupe', d: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5' },
  { id: 'party', label: 'אירוח', hue: 'plum', d: 'M12 3a5 6 0 015 6c0 4-3 6-5 6s-5-2-5-6a5 6 0 015-6zM12 15c0 2-2 3-2 6' },
  { id: 'other', label: 'אחר', hue: 'taupe', d: 'M3 12V4h8l10 10-8 8zM7.5 8h.01' },
];

const BY_ID = new Map(ICONS.map((i) => [i.id, i]));
export const iconDef = (id: IconId) => BY_ID.get(id) ?? BY_ID.get('other')!;
export const iconColors = (id: IconId) => HUES[iconDef(id).hue];
export const ICON_IDS = new Set<string>(ICONS.map((i) => i.id));
