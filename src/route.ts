import { useEffect, useState } from 'react';

export interface Route { name: 'should' | 'check' | 'shop' | 'welcome' | 'import'; query: URLSearchParams }

export function parseHash(hash: string): Route {
  const [path, q = ''] = hash.replace(/^#/, '').split('?');
  const seg = path.replace(/^\/+/, '');
  const name = (['should', 'check', 'shop', 'welcome', 'import'] as const).find((n) => n === seg);
  return { name: name ?? 'should', query: new URLSearchParams(q) };
}

export const hasRoute = (hash: string) => /^#\/(should|check|shop|welcome|import)/.test(hash);

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (name: Route['name'], replace = false) => {
  const url = `#/${name}`;
  if (replace) history.replaceState(null, '', url);
  else location.hash = url;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
export const isIOSBrowser = () => isIOS() && !isStandalone();
