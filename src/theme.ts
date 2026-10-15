export interface Theme { id: string; name: string; bg: string; card: string; accent: string; ink: string; meta: string }

export const THEMES: Theme[] = [
  { id: 'classic', name: 'קלאסי', bg: '#FAF4E9', card: '#FFFFFF', accent: '#C1693C', ink: '#2E2620', meta: '#FAF4E9' },
  { id: 'modern', name: 'מודרני', bg: '#F3F4F6', card: '#FFFFFF', accent: '#4F46E5', ink: '#111827', meta: '#F3F4F6' },
  { id: 'night', name: 'לילה', bg: '#0E1116', card: '#171B22', accent: '#FF8A65', ink: '#E8EAED', meta: '#0E1116' },
  { id: 'funky', name: 'פאנקי', bg: '#FFE14D', card: '#FFFFFF', accent: '#FF4F9A', ink: '#1A1033', meta: '#FFE14D' },
  { id: 'sea', name: 'ים', bg: '#EAF1EE', card: '#FAFCFB', accent: '#2F7F8F', ink: '#22332E', meta: '#EAF1EE' },
  { id: 'sunset', name: 'שקיעה', bg: '#FBEEE6', card: '#FFFBF8', accent: '#D9776B', ink: '#3B2A2F', meta: '#FBEEE6' },
];

const KEY = 'kaniyot.theme.v1';

export function applyTheme(id: string) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  if (t.id === 'classic') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t.id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.meta);
  return t.id;
}

export const loadTheme = (): string => {
  try { const v = localStorage.getItem(KEY); if (v && THEMES.some((t) => t.id === v)) return v; } catch { /* ignore */ }
  return 'classic';
};
export const saveTheme = (id: string) => { try { localStorage.setItem(KEY, id); } catch { /* ignore */ } };
