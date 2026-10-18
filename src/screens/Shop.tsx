import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { addOneOff, groupLines, progress } from '../logic/shopping';
import { BackButton, HomeButton, IconChip, Menu, DragHandle, Sheet, Stepper, Steps, Svg, TabBar } from '../components';
import { addItem, checkItemName, moveSectionTo } from '../logic/should';
import type { ShoppingLine } from '../logic/types';

export function ShopScreen() {
  const { should, setShould, shop, setShop, askConfirm, showToast } = useStore();
  const [reorder, setReorder] = useState(false);
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
          <div className="head-start"><BackButton to="check" label="חזרה למה יש" /><span className="eyebrow">קניות</span></div>
          <div className="head-actions"><HomeButton />
          <button className="icon-btn" aria-label="עוד פעולות" aria-haspopup="menu" onClick={() => setMenu(true)}>
            <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
          </button></div>
        </div>
        <h1 className="title">לקנייה</h1>
        <p className="sub" aria-live="polite">{done} מתוך {total} נקנה</p>
        <Steps step={3} />
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><div style={{ inlineSize: `${ratio * 100}%` }} /></div>
      </header>
      <Menu open={menu} onClose={() => setMenu(false)}>
        <button role="menuitem" disabled={groups.filter((g) => g.kind === 'section').length < 2} onClick={() => setReorder(true)}>סידור קטגוריות</button>
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
        {reorder && <p className="reorder-note">גררו את הידית כדי לסדר. הסדר משותף לרשימת ״מה צריך״.</p>}
        {groups.map((g) => {
          const s = g.sectionId ? sec.get(g.sectionId) : undefined;
          return (
            <section key={g.key} aria-label={g.title} {...(reorder && g.sectionId ? { 'data-drag-id': g.sectionId } : {})}>
              <div className="group-head">
                {s ? <IconChip icon={s.icon} small /> : <IconChip icon="other" small />}
                <span>{g.title}</span>
                {reorder && g.kind === 'section' && (
                  <DragHandle id={g.sectionId!} label={g.title} onOver={(a, b) => setShould((p) => (p ? moveSectionTo(p, a, b) : p))} />
                )}
              </div>
              {!reorder && <>
              {g.lines.map((l) => (
                <div id={`line-${l.id}`} className={`line${l.checked ? ' done' : ''}${flash === l.id ? ' flash' : ''}`} key={l.id}>
                  <label>
                    <input type="checkbox" className="chk" checked={l.checked} onChange={() => toggle(l.id)} />
                    <span className="lname">{l.name}</span>
                    <span className="qty" dir="ltr">× {l.qty}</span>
                  </label>
                  {l.oneOff && should && should.sections.length > 0 && !should.items.some((i) => i.name.trim().toLowerCase() === l.name.trim().toLowerCase()) && (
                    <button className="addto" onClick={() => setAddTo(l)}>+ למה צריך</button>
                  )}
                  {l.oneOff && (
                    <button className="icon-btn" style={{ margin: 0 }} aria-label={`הסרת ${l.name}`} onClick={() => remove(l.id)}>
                      <Svg size={18}><path d="M6 6l12 12M18 6L6 18" /></Svg>
                    </button>
                  )}
                </div>
              ))}
              </>}
            </section>
          );
        })}
      </div>
      {reorder ? <div className="cta"><button className="btn primary block big" onClick={() => setReorder(false)}>סיום</button></div> :
      <form className="quick" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="field" value={val} onChange={(e) => setVal(e.target.value)} placeholder="הוספת פריט לפעם הזו" aria-label="הוספת פריט לפעם הזו" />
        <button className="add" type="submit" aria-label="הוספה">+</button>
      </form>}
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
