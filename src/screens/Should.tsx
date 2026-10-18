import { useRef, useState } from 'react';
import { useStore } from '../store';
import { go } from '../route';
import type { IconId, Item, Section, ShouldList } from '../logic/types';
import * as S from '../logic/should';
import { ICONS, iconColors } from '../logic/icons';
import { BackButton, HomeButton, IconChip, Menu, DragHandle, Sheet, ShareIcon, Stepper, Steps, Svg, TabBar, useFocusOnMount } from '../components';
import { ShareSheet } from './Share';

type Sheets =
  | { kind: 'section'; id: string | null }
  | { kind: 'item'; id: string }
  | { kind: 'share' }
  | null;

export function ShouldScreen() {
  const { should, setShould, defaultList, saveDefault, showToast, replaceWithUndo } = useStore();
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<Sheets>(null);
  const [adding, setAdding] = useState<string | null>(() =>
    should && should.items.length === 0 && should.sections.length === 1 ? should.sections[0].id : null);
  const [reorder, setReorder] = useState(false);
  if (!should) return null;
  const edit = (fn: (s: ShouldList) => ShouldList) => setShould((p) => (p ? fn(p) : p));

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <div className="head-start"><BackButton to="welcome" label="חזרה למסך הבית" /><span className="eyebrow">קניות</span></div>
          <div className="head-actions">
            <HomeButton />
            <button className="icon-btn" aria-label="שיתוף הרשימה" onClick={() => setSheet({ kind: 'share' })}><ShareIcon size={18} /></button>
            <button className="icon-btn" aria-label="עוד פעולות" aria-haspopup="menu" onClick={() => setMenu(true)}>
              <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
            </button>
          </div>
        </div>
        <h1 className="title">מה צריך</h1>
        <p className="sub">הבסיס הקבוע שתמיד רוצים בבית</p>
        <Steps step={1} />
      </header>
      <Menu open={menu} onClose={() => setMenu(false)}>
        <button role="menuitem" disabled={should.sections.length < 2} onClick={() => setReorder(true)}>סידור קטגוריות</button>
        <button role="menuitem" onClick={() => { saveDefault(should); showToast('נשמר כרשימת ברירת המחדל'); }}>שמירה כברירת מחדל</button>
        <button role="menuitem" disabled={!defaultList} onClick={() => replaceWithUndo({ ...defaultList!, updatedAt: new Date().toISOString() }, 'נטענה ברירת המחדל')}>טעינת ברירת המחדל</button>
      </Menu>
      <div className="scroll">
        {reorder && <p className="reorder-note">גררו את הידית כדי לסדר. הסדר משותף לרשימת הקניות.</p>}
        {should.sections.map((sec) => {
          const items = S.itemsOf(should, sec.id);
          return (
            <section className="card" key={sec.id} data-drag-id={sec.id} aria-label={sec.name}>
              <div className="card-head">
                <IconChip icon={sec.icon} />
                <span className="name">{sec.name}</span>
                {reorder ? (
                  <DragHandle id={sec.id} label={sec.name} onOver={(a, b) => edit((x) => S.moveSectionTo(x, a, b))} />
                ) : (
                  <>
                    <span className="count">{items.length === 1 ? 'פריט אחד' : `${items.length} פריטים`}</span>
                    <button className="icon-btn" aria-label={`עריכת קטגוריה ${sec.name}`} onClick={() => setSheet({ kind: 'section', id: sec.id })} style={{ marginInline: -8 }}>
                      <Svg size={20}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
                    </button>
                  </>
                )}
              </div>
              {!reorder && items.map((it) => (
                <div className="row" key={it.id}>
                  <button className="rname" onClick={() => setSheet({ kind: 'item', id: it.id })}>{it.name}</button>
                  <Stepper value={it.target} min={1} label={`כמות רצויה ${it.name}`} onChange={(n) => edit((s) => S.setTarget(s, it.id, n))} />
                </div>
              ))}
              {reorder ? null : adding === sec.id ? (
                <AddItemField sectionId={sec.id} onClose={() => setAdding(null)} />
              ) : (
                <button className="add-item" onClick={() => setAdding(sec.id)}>+ הוספת פריט</button>
              )}
            </section>
          );
        })}
        {should.sections.length === 0 && (
          <div className="empty"><h2>אין עדיין קטגוריות</h2><p>הוסיפו קטגוריה כדי להתחיל.</p></div>
        )}
        {!reorder && <button className="add-section" onClick={() => setSheet({ kind: 'section', id: null })}>+ קטגוריה חדשה</button>}
        {!reorder && should.sections.length > 1 && <button className="add-section solid" onClick={() => setReorder(true)}>סידור קטגוריות בגרירה</button>}
      </div>
      <div className="cta">
        {reorder ? <button className="btn primary block big" onClick={() => setReorder(false)}>סיום</button> :
        <button className="btn primary block big" onClick={() => go('check')}>
          <span className="col">המשך לספירת המלאי<small>שלב הבא: מה יש בבית</small></span>
          <Svg size={20}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
        </button>}
      </div>
      <TabBar current="should" />
      {sheet?.kind === 'share' && <ShareSheet onClose={() => setSheet(null)} />}
      {sheet?.kind === 'section' && <SectionSheet id={sheet.id} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'item' && <ItemSheet id={sheet.id} onClose={() => setSheet(null)} />}
    </div>
  );
}

function AddItemField({ sectionId, onClose }: { sectionId: string; onClose: () => void }) {
  const { should, setShould } = useStore();
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount<HTMLInputElement>();
  const submit = () => {
    if (!val.trim()) return onClose();
    const r = S.checkItemName(should!, sectionId, val);
    if (!r.ok) return setErr(r.error);
    setShould((p) => (p ? S.addItem(p, sectionId, r.name) : p));
    setVal(''); setErr('');
    ref.current?.focus();
  };
  return (
    <div className="inline-add">
      <div className="field-wrap">
        <input
          ref={ref} className={`field${err ? ' err' : ''}`} value={val} placeholder="פריט חדש" aria-label="פריט חדש"
          onChange={(e) => { setVal(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') onClose(); }}
          onBlur={() => { if (!val.trim()) onClose(); }}
        />
        <button type="button" className="field-go" aria-label={val.trim() ? 'הוספת הפריט' : 'סגירה'}
          onMouseDown={(e) => e.preventDefault()} onClick={submit}>
          <Svg size={18} sw={2.4}>{val.trim() ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6L6 18" />}</Svg>
        </button>
      </div>
      {err && <div className="err-text" role="alert">{err}</div>}
    </div>
  );
}

function ItemSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { should, setShould, showToast } = useStore();
  const item = should!.items.find((i) => i.id === id);
  const [name, setName] = useState(item?.name ?? '');
  const [sectionId, setSectionId] = useState(item?.sectionId ?? '');
  const [err, setErr] = useState('');
  if (!item) return null;

  const save = () => {
    const r = S.checkItemName(should!, sectionId, name, id);
    if (!r.ok) return setErr(r.error);
    setShould((p) => {
      if (!p) return p;
      let n = p;
      if (r.name !== item.name) n = S.renameItem(n, id, r.name);
      if (sectionId !== item.sectionId) n = S.moveItem(n, id, sectionId);
      return n;
    });
    onClose();
  };
  const remove = () => {
    const removed: Item = item;
    setShould((p) => (p ? S.deleteItem(p, id) : p));
    onClose();
    showToast(`„${removed.name}“ נמחק`);
  };
  return (
    <Sheet title="עריכת פריט" onClose={onClose}>
      <div className="stack">
        <label className="label" htmlFor="it-name">שם</label>
        <input id="it-name" className={`field${err ? ' err' : ''}`} value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && save()} />
        {err && <div className="err-text" role="alert">{err}</div>}
      </div>
      <div className="stack">
        <label className="label" htmlFor="it-sec">קטגוריה</label>
        <select id="it-sec" className="field select" value={sectionId} onChange={(e) => { setSectionId(e.target.value); setErr(''); }}>
          {should!.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <button className="link-btn" onClick={remove}>מחיקת פריט</button>
      <div className="btn-row">
        <button className="btn primary" onClick={save}>שמירה</button>
        <button className="btn" onClick={onClose}>ביטול</button>
      </div>
    </Sheet>
  );
}

function SectionSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { should, setShould, setCounts, askConfirm } = useStore();
  const existing = id ? should!.sections.find((s) => s.id === id) : undefined;
  const create = !id;
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<IconId>(existing?.icon ?? 'other');
  const [order, setOrder] = useState(should!.sections.map((s) => s.id));
  const [err, setErr] = useState('');
  const pos = id ? order.indexOf(id) : -1;
  const count = id ? S.itemsOf(should!, id).length : 0;
  const nameRef = useRef<HTMLInputElement>(null);

  const swap = (dir: -1 | 1) => {
    const to = pos + dir;
    if (to < 0 || to >= order.length) return;
    const o = [...order];
    [o[pos], o[to]] = [o[to], o[pos]];
    setOrder(o);
  };
  const save = () => {
    const n = name.trim();
    if (!n) { setErr('נא להזין שם'); nameRef.current?.focus(); return; }
    setShould((p) => {
      if (!p) return p;
      if (create) return S.addSection(p, n, icon).list;
      const next = S.updateSection(p, id!, n, icon);
      const by = new Map(next.sections.map((s) => [s.id, s]));
      const sections = order.map((i) => by.get(i)).filter((s): s is Section => !!s);
      return { ...next, sections };
    });
    onClose();
  };
  const del = () =>
    askConfirm({
      title: `למחוק את הקטגוריה ואת ${count} הפריטים שבה?`,
      confirmLabel: 'מחיקה', destructive: true,
      onConfirm: () => {
        const gone = new Set(S.itemsOf(should!, id!).map((i) => i.id));
        setShould((p) => (p ? S.deleteSection(p, id!) : p));
        setCounts((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !gone.has(k))));
        onClose();
      },
    });

  return (
    <Sheet title={create ? 'קטגוריה חדשה' : 'עריכת קטגוריה'} onClose={onClose}>
      <div className="stack">
        <label className="label" htmlFor="sec-name">שם</label>
        <input id="sec-name" ref={nameRef} className={`field${err ? ' err' : ''}`} value={name} autoFocus={create}
          onChange={(e) => { setName(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && save()} />
        {err && <div className="err-text" role="alert">{err}</div>}
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">אייקון</span>
        <div className="icon-grid">
          {ICONS.map((ic) => {
            const [c, bg] = iconColors(ic.id);
            return (
              <button key={ic.id} type="button" aria-label={ic.label} aria-pressed={icon === ic.id} style={{ background: bg, color: c }} onClick={() => setIcon(ic.id)}>
                <Svg d={ic.d} size={22} />
              </button>
            );
          })}
        </div>
        <span className="label" style={{ fontWeight: 400 }}>הצבע נקבע לפי האייקון</span>
      </div>
      {!create && (
        <div className="btn-row">
          <button className="btn" disabled={pos <= 0} onClick={() => swap(-1)}>↑ הזזה למעלה</button>
          <button className="btn" disabled={pos >= order.length - 1} onClick={() => swap(1)}>↓ הזזה למטה</button>
        </div>
      )}
      {!create && <button className="link-btn" onClick={del}>מחיקת קטגוריה</button>}
      <div className="btn-row">
        <button className="btn primary" onClick={save}>שמירה</button>
        <button className="btn" onClick={onClose}>ביטול</button>
      </div>
    </Sheet>
  );
}
