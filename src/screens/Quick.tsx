import { useState } from 'react';
import { useStore } from '../store';
import { addOneOff, progress } from '../logic/shopping';
import { HomeButton, Menu, Svg } from '../components';

/** Path 2: a standalone checklist for a single trip. Independent of the should list and the weekly shopping list. */
export function QuickScreen() {
  const { quick, setQuick, askConfirm } = useStore();
  const [menu, setMenu] = useState(false);
  const [val, setVal] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const { done, total, ratio } = progress(quick);

  const toggle = (id: string) => setQuick((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)) }));
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
  };
  const clearChecked = () => setQuick((p) => ({ ...p, lines: p.lines.filter((l) => !l.checked) }));
  const clearAll = () =>
    askConfirm({ title: 'לנקות את כל הרשימה?', confirmLabel: 'ניקוי', destructive: true, onConfirm: () => setQuick((p) => ({ ...p, lines: [] })) });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <div className="head-start"><span className="eyebrow">קנייה חד־פעמית</span></div>
          <div className="head-actions"><HomeButton />
            <button className="icon-btn" aria-label="עוד פעולות" aria-haspopup="menu" onClick={() => setMenu(true)}>
              <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
            </button></div>
        </div>
        <h1 className="title">לקנייה</h1>
        <p className="sub" aria-live="polite">{done} מתוך {total} נקנה</p>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div style={{ inlineSize: `${ratio * 100}%` }} /></div>
      </header>
      <Menu open={menu} onClose={() => setMenu(false)}>
        <button role="menuitem" disabled={!quick.lines.some((l) => l.checked)} onClick={() => { setMenu(false); clearChecked(); }}>ניקוי מסומנים</button>
        <button role="menuitem" className="danger" disabled={!total} onClick={() => { setMenu(false); clearAll(); }}>ניקוי הרשימה</button>
      </Menu>
      <form className="quick top" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" value={val} onChange={(e) => setVal(e.target.value)} placeholder="הוספת פריט…" aria-label="פריט חדש" />
        <button className="add" type="submit" aria-label="הוספה">+</button>
      </form>
      <div className="scroll">
        {total === 0 && <div className="empty"><h2>הרשימה ריקה</h2><p>הוסיפו פריטים למטה. הרשימה הזו נפרדת מרשימת ״מה צריך״.</p></div>}
        <section aria-label="פריטים">
          {quick.lines.map((l) => (
            <div id={`line-${l.id}`} className={`line${l.checked ? ' done' : ''}${flash === l.id ? ' flash' : ''}`} key={l.id}>
              <label>
                <input type="checkbox" className="chk" checked={l.checked} onChange={() => toggle(l.id)} />
                <span className="lname">{l.name}</span>
              </label>
              <button className="icon-btn" style={{ margin: 0 }} aria-label={`הסרת ${l.name}`} onClick={() => remove(l.id)}>
                <Svg size={18}><path d="M6 6l12 12M18 6L6 18" /></Svg>
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
