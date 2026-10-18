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
  { id: 'produce', label: 'ירקות ופירות', hue: 'olive', d: 'M9 6.5c-1.2-.8-4.7-.6-4.7 3 0 2.8 1.7 5.5 3.2 5.5.4 0 .6-.2 1.5-.2s1.1.2 1.5.2c1.5 0 3.2-2.7 3.2-5.5 0-3.6-3.5-3.8-4.7-3zM9 6.5c0-1.2.6-2.1 1.7-2.7M12.5 16l3.7-3.7L21 21.5zM16.2 12.3l.6-3.3M16.2 12.3l3.3-1.6' },
  { id: 'fruit', label: 'פירות', hue: 'olive', d: 'M12 8c-1.6-1.2-5.5-.9-5.5 3.5C6.5 15.3 9 20 11 20c.5 0 .6-.3 1-.3s.5.3 1 .3c2 0 4.5-4.7 4.5-8.5C17.5 7.1 13.6 6.8 12 8zM12 8c0-2 1-3.4 2.6-4M13 5.6c1.4-1 3.2-.8 3.8.2-1.3 1-3 .9-3.8-.2z' },
  { id: 'dairy', label: 'חלב וביצים', hue: 'blue', d: 'M3.5 9l2-5h5l2 5v11a1 1 0 01-1 1h-7a1 1 0 01-1-1zM3.5 9h9M6 13h4v3.5H6zM17.5 9.5c2 0 3.5 2.6 3.5 5.5a3.5 3.5 0 01-7 0c0-2.9 1.5-5.5 3.5-5.5z' },
  { id: 'eggs', label: 'ביצים', hue: 'mustard', d: 'M8.5 5c2 0 3.5 3 3.5 6a3.5 3.5 0 01-7 0c0-3 1.5-6 3.5-6zM16 9c1.7 0 3 2.5 3 5a3 3 0 01-6 0c0-2.5 1.3-5 3-5zM4 20h16' },
  { id: 'bakery', label: 'מאפים', hue: 'mustard', d: 'M5 11c0-3 2-5 7-5s7 2 7 5c0 1-.5 1.5-1 1.7V18a1 1 0 01-1 1H7a1 1 0 01-1-1v-5.3c-.5-.2-1-.7-1-1.7zM9.5 10.5v2.5M13 10v3' },
  { id: 'grains', label: 'דגנים', hue: 'mustard', d: 'M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 13c-2-1-4-2-4-5 2 0 4 2 4 5zM12 13c2-1 4-2 4-5-2 0-4 2-4 5z' },
  { id: 'pasta', label: 'פסטה ואורז', hue: 'mustard', d: 'M3.5 12h17a8.5 8.5 0 01-17 0zM7 9c1-1 1-2 0-3M12 9c1-1 1-2 0-3M17 9c1-1 1-2 0-3M8 21h8' },
  { id: 'meat', label: 'בשר', hue: 'terra', d: 'M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 4.5 0 00-6.23 6.23zM8.29 12.71l-2.6 2.6a2.5 2.5 0 10-1.65 4.65 2.5 2.5 0 104.66-1.66l2.59-2.59' },
  { id: 'fish', label: 'דגים', hue: 'blue', d: 'M2.5 12c2-3.5 5.5-5.5 9.5-5.5 3 0 5 2.5 7 5.5-2 3-4 5.5-7 5.5-4 0-7.5-2-9.5-5.5zM19 12l2.5-3v6zM8 11.5c.6.6.6 1.4 0 2M15.5 11v.01' },
  { id: 'frozen', label: 'קפואים', hue: 'blue', d: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9' },
  { id: 'pantry', label: 'מזווה', hue: 'mustard', d: 'M7 8h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2zM8 4h8v4H8zM7 13h10' },
  { id: 'canned', label: 'שימורים', hue: 'terra', d: 'M6 7c0-1.1 2.7-2 6-2s6 .9 6 2v10c0 1.1-2.7 2-6 2s-6-.9-6-2zM6 7c0 1.1 2.7 2 6 2s6-.9 6-2M6 12c0 1.1 2.7 2 6 2s6-.9 6-2' },
  { id: 'sauce', label: 'רטבים ותיבולים', hue: 'terra', d: 'M10.5 2.5h3V5l1.5 2.5V20a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 019 20V7.5L10.5 5zM9 11h6v5H9z' },
  { id: 'spices', label: 'תבלינים', hue: 'terra', d: 'M8 9h8l-.8 11a1 1 0 01-1 1H9.8a1 1 0 01-1-1zM8 9c0-1.5 1-3 4-3s4 1.5 4 3M10.5 3h3v3h-3zM10.5 13.5h3' },
  { id: 'scale', label: 'במשקל', hue: 'olive', d: 'M12 4v16M7 20h10M4 7h16M4 7l-2.5 6.5h5zM20 7l-2.5 6.5h5zM1.5 13.5a2.5 2.2 0 005 0M17.5 13.5a2.5 2.2 0 005 0' },
  { id: 'snacks', label: 'חטיפים', hue: 'plum', d: 'M4.5 14c0 5 3.5 7 7.5 7s7.5-2 7.5-7M4.5 14C3 10.5 3.5 6 7 5.5c2.5-.5 4 2 5 4.5 1 2 3.8 4.8 6.3 7.2M19.5 14c1.5-3.5 1-8-2.5-8.5C14.5 5 13 7.5 12 10c-1 2-3.8 4.8-6.3 7.2' },
  { id: 'sweets', label: 'מתוקים', hue: 'plum', d: 'M8 12a4 4 0 108 0 4 4 0 10-8 0zM8 12L4 9v6zM16 12l4-3v6zM10.5 11c.8-.8 2-.8 3 0' },
  { id: 'drinks', label: 'שתייה', hue: 'blue', d: 'M7 8h10l-1.2 12a1 1 0 01-1 .9H9.2a1 1 0 01-1-.9zM7.5 12h9M13 8l1.8-5H18' },
  { id: 'coffee', label: 'קפה ותה', hue: 'taupe', d: 'M5 9h11v6a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 11h2a2 2 0 010 4h-2M9 3v3M12 3v3' },
  { id: 'cleaning', label: 'ניקיון', hue: 'taupe', d: 'M8 21V11a1 1 0 011-1h5a1 1 0 011 1v10zM10 10V7h3.5L17 5.5V9l-3.5 1M10 7V4.5h2.5M8 15h7' },
  { id: 'bath', label: 'רחצה', hue: 'blue', d: 'M3 12h18v3a4 4 0 01-4 4H7a4 4 0 01-4-4zM6 12V6.5a2 2 0 013.5-1.3M6.5 19l-1 2M17.5 19l1 2' },
  { id: 'paper', label: 'נייר', hue: 'taupe', d: 'M5 8c0-1.7 3.1-3 7-3s7 1.3 7 3v8c0 1.7-3.1 3-7 3s-7-1.3-7-3zM5 8c0 1.7 3.1 3 7 3s7-1.3 7-3M10 8a2 .8 0 104 0' },
  { id: 'baby', label: 'תינוקות', hue: 'plum', d: 'M10 3h4v2l1 1.5V8H9V6.5L10 5zM8.5 8h7l.5 11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 19zM8.5 13H11M8.5 16H11' },
  { id: 'pets', label: 'חיות מחמד', hue: 'terra', d: 'M8 15c-2 3 0 5 4 5s6-2 4-5c-1-2-2-3-4-3s-3 1-4 3zM5 10a1.5 2 0 103 0 1.5 2 0 10-3 0zM9 6a1.5 2 0 103 0 1.5 2 0 10-3 0zM12 6a1.5 2 0 103 0 1.5 2 0 10-3 0zM16 10a1.5 2 0 103 0 1.5 2 0 10-3 0z' },
  { id: 'pharmacy', label: 'פארם', hue: 'plum', d: 'M8 16l8-8a3.5 3.5 0 00-5-5L3 11a3.5 3.5 0 005 5zM7 7l5 5' },
  { id: 'home', label: 'לבית', hue: 'taupe', d: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5' },
  { id: 'tools', label: 'כלים', hue: 'taupe', d: 'M14.7 6.3a4 4 0 00-5.4 5.1L3.5 17.2a1.8 1.8 0 002.5 2.5l5.8-5.8a4 4 0 005.1-5.4l-2.4 2.4-2.1-.5-.5-2.1z' },
  { id: 'plant', label: 'צמחים', hue: 'olive', d: 'M12 21v-9M12 12c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6zM12 14c0-3 2.2-5 5.5-5 0 3-2.2 5-5.5 5zM8.5 21h7' },
  { id: 'party', label: 'אירוח', hue: 'plum', d: 'M12 3a5 6 0 015 6c0 4-3 6-5 6s-5-2-5-6a5 6 0 015-6zM12 15c0 2-2 3-2 6' },
  { id: 'gift', label: 'מתנות', hue: 'plum', d: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1-3-5-3.5-5-1.5S10 7 12 7zM12 7c1-3 5-3.5 5-1.5S14 7 12 7z' },
  { id: 'heart', label: 'אהוב', hue: 'terra', d: 'M12 20s-8-4.8-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.2 12 20 12 20z' },
  { id: 'office', label: 'משרד', hue: 'blue', d: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19zM14.5 6.5l3 3M5 16l3 3' },
  { id: 'cart', label: 'קניות', hue: 'olive', d: 'M3 4h2.5l2 11h10l2-8H7M9 20a1 1 0 100-.01M17 20a1 1 0 100-.01' },
  { id: 'other', label: 'אחר', hue: 'taupe', d: 'M3 12V4h8l10 10-8 8zM7.5 8h.01' },
];

const BY_ID = new Map(ICONS.map((i) => [i.id, i]));
export const iconDef = (id: IconId) => BY_ID.get(id) ?? BY_ID.get('other')!;
export const iconColors = (id: IconId) => HUES[iconDef(id).hue];
export const ICON_IDS = new Set<string>(ICONS.map((i) => i.id));
