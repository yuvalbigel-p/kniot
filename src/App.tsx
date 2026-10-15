import { useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { go, hasRoute, useRoute } from './route';
import { ConfirmDialog, Toast } from './components';
import { ShouldScreen } from './screens/Should';
import { CheckScreen } from './screens/Check';
import { ShopScreen } from './screens/Shop';
import { WelcomeScreen } from './screens/Welcome';
import { ImportScreen } from './screens/Share';

const ACTIVE_KEY = 'kaniyot.active.v1';
const RESUME_MS = 30 * 60 * 1000;
const readActive = () => { try { return Number(localStorage.getItem(ACTIVE_KEY)) || 0; } catch { return 0; } };
const touchActive = () => { try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch { /* ignore */ } };
/** Decided once per launch: was the app used in the last 30 minutes? */
const RESUME = Date.now() - readActive() < RESUME_MS;

function Shell() {
  const { should, lastTab, setLastTab } = useStore();
  const route = useRoute();

  // Resolve the landing route: nothing in the hash -> last tab (or welcome on first run).
  useEffect(() => {
    if (route.name === 'import') return;
    if (!should) { if (route.name !== 'welcome' || !hasRoute(location.hash)) go('welcome', true); return; }
    if (!hasRoute(location.hash)) go(RESUME ? lastTab : 'welcome', true);
  }, [route.name, should, lastTab]);

  useEffect(() => {
    if (route.name === 'should' || route.name === 'check' || route.name === 'shop') {
      if (route.name !== lastTab) setLastTab(route.name);
    }
  }, [route.name, lastTab, setLastTab]);

  // keep the "last used" stamp fresh while the app is open
  useEffect(() => {
    touchActive();
    const t = window.setInterval(touchActive, 60_000);
    const hide = () => touchActive();
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', hide);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', hide); };
  }, []);
  useEffect(() => { touchActive(); }, [route.name]);

  let screen;
  if (route.name === 'import') screen = <ImportScreen />;
  else if (!should || route.name === 'welcome') screen = <WelcomeScreen />;
  else if (route.name === 'check') screen = <CheckScreen />;
  else if (route.name === 'shop') screen = <ShopScreen />;
  else screen = <ShouldScreen />;

  return (
    <div className="app">
      {screen}
      <ConfirmDialog />
      <Toast />
    </div>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
