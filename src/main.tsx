import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { applyTheme, loadTheme } from './theme';
import { initDurability } from './storage';
import './styles.css';

registerSW({ immediate: true });

// Restore from the IndexedDB mirror (if localStorage was wiped) before anything reads storage.
initDurability().finally(() => {
  applyTheme(loadTheme());
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});
