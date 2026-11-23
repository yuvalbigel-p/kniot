import { useState } from 'react';
import { useStore } from '../store';
import { resolvePin } from '../sync';

/** One-time setup per phone: the shared PIN unlocks the household. */
export function PinScreen() {
  const { setHid } = useStore();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true); setErr('');
    try {
      const hid = await resolvePin(pin);
      if (hid) setHid(hid); else { setErr('הקוד לא נכון'); setPin(''); }
    } catch {
      setErr('אין חיבור לאינטרנט. נסו שוב.');
    } finally { setBusy(false); }
  };
  return (
    <div className="screen">
      <div className="center home pin">
        <div className="brand small"><h1>קניות</h1><p>הקוד המשותף שלכם</p></div>
        <form className="stack pin-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <input
            className={`field pin-field${err ? ' err' : ''}`} value={pin} inputMode="numeric" type="password" maxLength={8}
            aria-label="קוד" placeholder="••••" autoFocus
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErr(''); }}
          />
          {err && <div className="err-text" role="alert">{err}</div>}
          <button className="btn primary block big" type="submit" disabled={pin.length < 4 || busy}>{busy ? 'מתחבר…' : 'כניסה'}</button>
        </form>
        <p className="note pin-note">פעם אחת בכל טלפון. אחר כך הרשימות מסתנכרנות לבד.</p>
      </div>
    </div>
  );
}
