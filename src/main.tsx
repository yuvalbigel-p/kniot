import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { applyTheme, loadTheme } from './theme';
import './styles.css';

registerSW({ immediate: true });
applyTheme(loadTheme());
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
