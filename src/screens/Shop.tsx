import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { addOneOff, groupLines, progress } from '../logic/shopping';
import { IconChip, Menu, Svg, TabBar } from '../components';

export function ShopScreen() {
  const { should, shop, setShop, askConfirm } = useStore();
  const [menu, setMenu] = useState(false);
  const [val, setVal] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number>(0);
  const sec = new Map((should?.sections ?? []).map((s) => [s.id, s]));
  const { done, total, ratio } = progress(shop);
  const groups = groupLines(shop, should ?? { schema: 1, updatedAt: '', sections: [], items: [] });
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const toggle = (id: string) => setShop((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)) }));
  const remove = (id: string) => setShop((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));
  const add = () => {
    const r = addOneOff(shop, val);
    if (r.outcome === 'ignored') return;
    if (r.outcome !== 'highlight') setShop(r.list);
    if (r.lineId && r.outcome !== 'added') {
      setFlash(r.lineId);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 1200);
      document.getElementById(`line-${r.lineId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    setVal('');
  };
  const clearChecked = () => setShop((p) => ({ ...p, lines: p.lines.filter((l) => !l.checked) }));
  const clearAll = () =>
    askConfirm({
      title: 'לנקות את כל הרשימה?', confirmLabel: 'ניקוי', destructive: true,
      onConfirm: () => setShop((p) => ({ ...p, lines: [] })),
    });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <span className="eyebrow">קניות</span>
          <button className="icon-btn" aria-label="עוד פעולות" aria-haspopup="menu" onClick={() => setMenu(true)}>
            <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
          </button>
        </div>
        <h1 className="title">לקנייה</h1>
        <p className="sub" aria-live="polite">{done} מתוך {total} נקנה</p>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div style={{ inlineSize: `${ratio * 100}%` }} /></div>
      </header>
      <Menu open={menu} onClose={() => setMenu(false)}>
        <button role="menuitem" disabled={!shop.lines.some((l) => l.checked)} onClick={clearChecked}>ניקוי מסומנים</button>
        <button role="menuitem" className="danger" disabled={!total} onClick={clearAll}>ניקוי הרשימה</button>
      </Menu>
      <div className="scroll">
        {total === 0 && (
          <div className="empty">
            <h2>הרשימה ריקה</h2>
            <p>ספרו מה יש בבית ויצאו לרשימה, או הוסיפו פריט למטה.</p>
            <a className="link-btn" href="#/check">למה יש בבית ←</a>
          </div>
        )}
        {groups.map((g) => {
          const s = g.sectionId ? sec.get(g.sectionId) : undefined;
          return (
            <section key={g.key} aria-label={g.title}>
              <div className="group-head">
                {s ? <IconChip icon={s.icon} small /> : <IconChip icon="other" small />}
                <span>{g.title}</span>
              </div>
              {g.lines.map((l) => (
                <div id={`line-${l.id}`} className={`line${l.checked ? ' done' : ''}${flash === l.id ? ' flash' : ''}`} key={l.id}>
                  <label>
                    <input type="checkbox" className="chk" checked={l.checked} onChange={() => toggle(l.id)} />
                    <span className="lname">{l.name}</span>
                    <span className="qty" dir="ltr">× {l.qty}</span>
                  </label>
                  {l.oneOff && (
                    <button className="icon-btn" style={{ margin: 0 }} aria-label={`הסרת ${l.name}`} onClick={() => remove(l.id)}>
                      <Svg size={18}><path d="M6 6l12 12M18 6L6 18" /></Svg>
                    </button>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <form className="quick" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" value={val} onChange={(e) => setVal(e.target.value)} placeholder="הוספת פריט לפעם הזו" aria-label="הוספת פריט לפעם הזו" enterKeyHint="done" />
        <button className="add" type="submit" aria-label="הוספה">+</button>
      </form>
      <TabBar current="shop" />
    </div>
  );
}
