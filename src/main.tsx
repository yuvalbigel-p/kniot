import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { applyTheme, loadTheme } from './theme';
import { initDurability } from './storage';
import './styles.css';

registerSW({ immediate: true });

// Keep the iOS keyboard light: no contact AutoFill, no autocorrect/capitalize, plain gray return key.
const calm = (el: Element) => {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  el.setAttribute('autocomplete', 'off');
  el.setAttribute('autocorrect', 'off');
  el.setAttribute('autocapitalize', 'off');
  el.setAttribute('enterkeyhint', 'enter');
  el.spellcheck = false;
};
document.querySelectorAll('input, textarea').forEach(calm);
new MutationObserver((muts) => {
  for (const m of muts) m.addedNodes.forEach((n) => {
    if (n instanceof Element) { calm(n); n.querySelectorAll('input, textarea').forEach(calm); }
  });
}).observe(document.documentElement, { childList: true, subtree: true });

// Restore from the IndexedDB mirror (if localStorage was wiped) before anything reads storage.
initDurability().finally(() => {
  applyTheme(loadTheme());
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});
