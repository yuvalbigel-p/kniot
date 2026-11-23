import { useRef, useState } from 'react';
import { nanoid } from '../logic/id';
import { useStore } from '../store';
import { addOneOff, finishShop, progress } from '../logic/shopping';
import { FinishButton } from './Shop';
import { go } from '../route';
import { HomeButton, Menu, Stepper, Svg } from '../components';

/** Weekly (bodega) list: an ongoing list both partners add to. Independent of the should list and the monthly list. */
export function QuickScreen() {
  const { quick, setQuick, askConfirm, showToast } = useStore();
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const onPhoto = async (file: File | undefined) => {
    if (!file || scanning) return;
    setScanning(true);
    try {
      const { scanList } = await import('../ai');
      const items = await scanList(file);
      let added = 0;
      setQuick((p) => {
        const key = (n: string) => n.trim().replace(/\s+/g, ' ').toLowerCase();
        const lines = p.lines.map((l) => ({ ...l }));
        for (const it of items) {
          const ex = lines.find((l) => key(l.name) === key(it.name));
          if (ex) { if (ex.checked) { ex.checked = false; added++; } continue; }
          lines.push({ id: nanoid(8), name: it.name.trim(), qty: it.qty, checked: false, oneOff: true });
          added++;
        }
        const seen = new Set<string>();
        return { ...p, lines: lines.filter((l) => { const k = key(l.name); if (seen.has(k)) return false; seen.add(k); return true; }) };
      });
      showToast(items.length === 0 ? 'לא נמצאו פריטים בתמונה' : added ? `נוספו ${added} פריטים מהתמונה` : 'כל הפריטים כבר ברשימה');
    } catch (e) {
      console.warn('[kniot] scan', e);
      showToast(!navigator.onLine ? 'אין חיבור לאינטרנט' : String(e).includes('timeout') ? 'לוקח יותר מדי זמן. נסו שוב.' : 'לא הצלחנו לקרוא את התמונה. נסו שוב.');
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const [menu, setMenu] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { done, total, ratio } = progress(quick);

  const toggle = (id: string) => setQuick((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)) }));
  const setQty = (id: string, qty: number) => setQuick((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, qty } : l)) }));
  const [editing, setEditing] = useState<string | null>(null);
  const cancelEdit = useRef(false);
  const rename = (id: string, raw: string) => {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (!cancelEdit.current && name) setQuick((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id && l.name !== name ? { ...l, name } : l)) }));
    cancelEdit.current = false;
    setEditing(null);
  };
  const remove = (id: string) => setQuick((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));
  const add = () => {
    const r = addOneOff(quick, val);
    if (r.outcome === 'ignored') return;
    if (r.outcome !== 'highlight') setQuick(r.list);
    if (r.lineId && r.outcome !== 'added') {
      setFlash(r.lineId);
      window.setTimeout(() => setFlash(null), 1200);
      document.getElementById(`line-${r.lineId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    setVal('');
    inputRef.current?.focus();
  };
  const finish = () => {
    const left = total - done;
    setQuick((p) => finishShop(p));
    showToast(left ? `הקנייה הסתיימה · ${left === 1 ? 'פריט אחד נשאר' : `${left} פריטים נשארו`} ברשימה` : 'הקנייה הסתיימה');
    go('welcome');
  };
  const clearAll = () =>
    askConfirm({ title: 'לנקות את כל הרשימה?', confirmLabel: 'ניקוי', destructive: true, onConfirm: () => setQuick((p) => ({ ...p, lines: [] })) });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <div className="head-start"><span className="eyebrow">שבועי · מכולת</span></div>
          <div className="head-actions"><button className="text-btn" disabled={!total} onClick={clearAll}>ניקוי</button><HomeButton />
            <button className="icon-btn" aria-label="עוד פעולות" aria-haspopup="menu" onClick={() => setMenu(true)}>
              <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
            </button></div>
        </div>
        <h1 className="title">לקנייה</h1>
        <p className="sub" aria-live="polite">{done} מתוך {total} נקנה</p>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div style={{ inlineSize: `${ratio * 100}%` }} /></div>
      </header>
      <Menu open={menu} onClose={() => setMenu(false)}>
        <button role="menuitem" className="danger" disabled={!total} onClick={() => { setMenu(false); clearAll(); }}>ניקוי הרשימה</button>
      </Menu>
      <form className="quick top" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input ref={inputRef} className="field" value={val} onChange={(e) => setVal(e.target.value)} placeholder="הוספת פריט…" aria-label="פריט חדש" />
        <button className="add" type="submit" aria-label="הוספה" onPointerDown={(e) => e.preventDefault()}>+</button>
        <button type="button" className={`add photo${scanning ? ' busy' : ''}`} aria-label="הוספה מתמונה של רשימה" disabled={scanning} onClick={() => fileRef.current?.click()}>
          <Svg size={22}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />
      </form>
      <div className="scroll">
        {scanning && (
          <div className="scan-loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <div><b>קורא את הרשימה מהתמונה…</b><span>כמה שניות…</span></div>
          </div>
        )}
        {total === 0 && !scanning && <div className="empty"><h2>הרשימה ריקה</h2><p>הוסיפו פריטים בשדה למעלה. כל מה שחסר במהלך השבוע.</p></div>}
        <section className={quick.lines.length ? "list-card" : ""} aria-label="פריטים">
          {quick.lines.map((l) => (
            <div id={`line-${l.id}`} className={`line${l.checked ? ' done' : ''}${flash === l.id ? ' flash' : ''}`} key={l.id}>
              <div className="lrow">
                <label className="chk-hit"><input type="checkbox" className="chk" aria-label={`סימון ${l.name}`} checked={l.checked} onChange={() => toggle(l.id)} /></label>
                {editing === l.id ? (
                  <input
                    className="lname-edit" defaultValue={l.name} autoFocus aria-label={`שינוי שם ${l.name}`}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => rename(l.id, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') { cancelEdit.current = true; e.currentTarget.blur(); }
                    }}
                  />
                ) : (
                  <button type="button" className="lname" aria-label={`עריכת ${l.name}`} onClick={() => setEditing(l.id)}>{l.name}</button>
                )}
              </div>
              <Stepper compact value={l.qty} min={1} label={`כמות ${l.name}`} onChange={(n) => setQty(l.id, n)} />
              <button className="icon-btn" style={{ margin: 0 }} aria-label={`הסרת ${l.name}`} onClick={() => remove(l.id)}>
                <Svg size={18}><path d="M6 6l12 12M18 6L6 18" /></Svg>
              </button>
            </div>
          ))}
        </section>
        {scanning && [0, 1, 2].map((i) => <div key={i} className="line skeleton" aria-hidden="true"><i /><i /></div>)}
      </div>
      {done > 0 && <FinishButton done={done} total={total} onClick={finish} />}
    </div>
  );
}
