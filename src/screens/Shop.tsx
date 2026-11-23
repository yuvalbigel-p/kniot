import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { addOneOff, finishShop, groupLines, progress } from '../logic/shopping';
import { go } from '../route';
import { BackButton, HomeButton, IconChip, Menu, dragProps, Grip, Sheet, Stepper, Svg, TabBar } from '../components';
import { addItem, checkItemName, moveSectionTo } from '../logic/should';
import type { ShoppingLine } from '../logic/types';

export function ShopScreen() {
  const { should, setShould, shop, setShop, setCounts, setCheckMeta, askConfirm, showToast } = useStore();
  const [addTo, setAddTo] = useState<ShoppingLine | null>(null);
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
  const finish = () => {
    const left = total - done;
    setShop((p) => finishShop(p));
    setCounts({});
    setCheckMeta({ savedAt: null, dirty: false });
    showToast(left ? `הקנייה הסתיימה · ${left === 1 ? 'פריט אחד נשאר' : `${left} פריטים נשארו`} לפעם הבאה` : 'הקנייה הסתיימה');
    go('welcome');
  };
  const clearAll = () =>
    askConfirm({
      title: 'לנקות את כל הרשימה?', confirmLabel: 'ניקוי', destructive: true,
      onConfirm: () => setShop((p) => ({ ...p, lines: [] })),
    });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <div className="head-start"><BackButton to="welcome" label="חזרה למסך הבית" /><span className="eyebrow">חודשי · סופר</span></div>
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
        <button role="menuitem" className="danger" disabled={!total} onClick={clearAll}>ניקוי הרשימה</button>
      </Menu>
      <form className="quick top" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" value={val} onChange={(e) => setVal(e.target.value)} placeholder="הוספת פריט לפעם הזו" aria-label="הוספת פריט לפעם הזו" />
        <button className="add" type="submit" aria-label="הוספה">+</button>
      </form>
      <div className="scroll">
        {total === 0 && (
          <div className="empty">
            <h2>הרשימה ריקה</h2>
            <p>ספרו מה יש בבית ויצאו לרשימה, או הוסיפו פריט למטה.</p>
            <a className="link-btn" href="#/check">מעבר לספירת מלאי ←</a>
          </div>
        )}
        {groups.map((g) => {
          const s = g.sectionId ? sec.get(g.sectionId) : undefined;
          return (
            <section key={g.key} aria-label={g.title} {...(g.sectionId ? { 'data-drag-id': g.sectionId, 'data-drag-scope': 'sections' } : {})}>
              <div className="group-head">
                {s ? <IconChip icon={s.icon} small /> : <IconChip icon="other" small />}
                <span>{g.title}</span>
                {g.sectionId && <Grip label={g.title} {...dragProps(g.sectionId, 'sections', (a, b) => setShould((p) => (p ? moveSectionTo(p, a, b) : p)))} />}
              </div>
              <div className="list-card">
              {g.lines.map((l) => (
                <div id={`line-${l.id}`} className={`line${l.checked ? ' done' : ''}${flash === l.id ? ' flash' : ''}`} key={l.id}>
                  <label>
                    <input type="checkbox" className="chk" checked={l.checked} onChange={() => toggle(l.id)} />
                    <span className="lname">{l.name}</span>
                    <span className="qty" dir="ltr">× {l.qty}</span>
                  </label>
                  {l.oneOff && should && should.sections.length > 0 && !should.items.some((i) => i.name.trim().toLowerCase() === l.name.trim().toLowerCase()) && (
                    <button className="addto" onClick={() => setAddTo(l)}>הוספה לרשימת ״מה צריך״</button>
                  )}
                  {l.oneOff && (
                    <button className="icon-btn" style={{ margin: 0 }} aria-label={`הסרת ${l.name}`} onClick={() => remove(l.id)}>
                      <Svg size={18}><path d="M6 6l12 12M18 6L6 18" /></Svg>
                    </button>
                  )}
                </div>
              ))}
              </div>
            </section>
          );
        })}
      </div>
      {done > 0 && <FinishButton done={done} total={total} onClick={finish} />}
      <TabBar current="shop" />
      {addTo && should && (
        <AddToShouldSheet line={addTo} onClose={() => setAddTo(null)} onDone={(sectionId, itemId) => {
          setShop((p) => ({ ...p, lines: p.lines.map((x) => (x.id === addTo.id ? { ...x, oneOff: false, sectionId, itemId } : x)) }));
          showToast('נוסף לרשימת מה צריך');
          setAddTo(null);
        }} setShould={setShould} />
      )}
    </div>
  );
}

function AddToShouldSheet({ line, onClose, onDone, setShould }: {
  line: ShoppingLine; onClose: () => void; onDone: (sectionId: string, itemId: string) => void;
  setShould: ReturnType<typeof useStore>['setShould'];
}) {
  const { should } = useStore();
  const [sectionId, setSectionId] = useState(should!.sections[0].id);
  const [name, setName] = useState(line.name);
  const [target, setTarget] = useState(Math.max(1, line.qty));
  const [err, setErr] = useState('');
  const save = () => {
    const r = checkItemName(should!, sectionId, name);
    if (!r.ok) return setErr(r.error);
    let newId = '';
    setShould((p) => {
      if (!p) return p;
      const next = addItem(p, sectionId, r.name, target);
      newId = next.items.find((i) => i.sectionId === sectionId && i.name === r.name)!.id;
      return next;
    });
    onDone(sectionId, newId);
  };
  return (
    <Sheet title="הוספה לרשימת מה צריך" onClose={onClose}>
      <p className="note">הפריט יישאר בבסיס הקבוע ויופיע בספירה הבאה.</p>
      <div className="stack">
        <label className="label" htmlFor="at-name">שם</label>
        <input id="at-name" className={`field${err ? ' err' : ''}`} value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} />
        {err && <div className="err-text" role="alert">{err}</div>}
      </div>
      <div className="stack">
        <label className="label" htmlFor="at-sec">קטגוריה</label>
        <select id="at-sec" className="field select" value={sectionId} onChange={(e) => { setSectionId(e.target.value); setErr(''); }}>
          {should!.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="label">כמות רצויה בבית</span>
        <Stepper value={target} min={1} label="כמות רצויה" onChange={setTarget} />
      </div>
      <div className="btn-row">
        <button className="btn primary" onClick={save}>הוספה</button>
        <button className="btn" onClick={onClose}>ביטול</button>
      </div>
    </Sheet>
  );
}

export function FinishButton({ done, total, onClick }: { done: number; total: number; onClick: () => void }) {
  const left = total - done;
  return (
    <div className="cta finish">
      <button className="btn primary block big" onClick={onClick}>
        <span className="col">סיום קנייה<small>{done} נקנו יוסרו{left ? ` · ${left} יישארו` : ''}</small></span>
        <Svg size={20}><path d="M5 12l5 5 9-10" /></Svg>
      </button>
    </div>
  );
}
