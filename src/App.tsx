import { useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { go, hasRoute, useRoute } from './route';
import { ConfirmDialog, Toast } from './components';
import { ShouldScreen } from './screens/Should';
import { CheckScreen } from './screens/Check';
import { ShopScreen } from './screens/Shop';
import { WelcomeScreen } from './screens/Welcome';
import { ImportScreen } from './screens/Share';

function Shell() {
  const { should, lastTab, setLastTab } = useStore();
  const route = useRoute();

  // Resolve the landing route: nothing in the hash -> last tab (or welcome on first run).
  useEffect(() => {
    if (route.name === 'import') return;
    if (!should) { if (route.name !== 'welcome' || !hasRoute(location.hash)) go('welcome', true); return; }
    if (!hasRoute(location.hash)) go(lastTab, true);
  }, [route.name, should, lastTab]);

  useEffect(() => {
    if (route.name === 'should' || route.name === 'check' || route.name === 'shop') {
      if (route.name !== lastTab) setLastTab(route.name);
    }
  }, [route.name, lastTab, setLastTab]);

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
