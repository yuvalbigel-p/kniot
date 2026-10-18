import { useState } from 'react';
import { useStore } from '../store';
import { buildShareUrl, decodeShould, extractPayload } from '../logic/share';
import { diffShould, localIsNewer } from '../logic/diff';
import type { Diff } from '../logic/diff';
import type { ShouldList } from '../logic/types';
import { Sheet, ShareIcon, Svg } from '../components';
import { go, isIOSBrowser, useRoute } from '../route';
import { emptyShould } from '../logic/starter';

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(+d)) return '';
  const today = new Date();
  const t = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === today.toDateString() ? `היום ${t}` : `${d.toLocaleDateString('he-IL')} ${t}`;
};

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

export function ShareSheet({ onClose }: { onClose: () => void }) {
  const { should, showToast } = useStore();
  const [paste, setPaste] = useState(false);
  if (!should) return null;
  const url = buildShareUrl(should);
  const send = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'קניות', text: 'הרשימה שלי ב״קניות״', url }); onClose(); return; }
      catch (e) { if ((e as DOMException).name === 'AbortError') return; }
    }
    showToast((await copyText(url)) ? 'הקישור הועתק' : 'לא ניתן להעתיק את הקישור');
  };
  const copy = async () => showToast((await copyText(url)) ? 'הקישור הועתק' : 'לא ניתן להעתיק את הקישור');
  if (paste) return <PasteSheet onClose={onClose} />;
  return (
    <Sheet title="שיתוף הרשימה" onClose={onClose}>
      <p className="note">שולחים קישור שכולל את כל הרשימה. מי שפותח אותו יכול לייבא אותה לאפליקציה שלו ולערוך אותה.</p>
      <div className="info-row">
        <Svg size={18}><path d="M9 6h10M9 12h10M9 18h10" /></Svg>
        <span>{should.sections.length} קטגוריות · {should.items.length} פריטים · עודכן {fmt(should.updatedAt)}</span>
      </div>
      <button className="btn primary block" style={{ minBlockSize: 50 }} onClick={send}><ShareIcon size={18} />שליחת קישור</button>
      <button className="btn block" onClick={copy}>העתקת הקישור</button>
      <div className="divider" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="stack" style={{ gap: 2 }}>
          <b style={{ fontSize: 14.5, fontWeight: 600 }}>קיבלתם קישור?</b>
          <span className="label" style={{ fontWeight: 400 }}>העתיקו אותו ולחצו ייבוא</span>
        </div>
        <button className="btn outline" style={{ minBlockSize: 44 }} onClick={() => setPaste(true)}>ייבוא</button>
      </div>
    </Sheet>
  );
}

/** Read a link from the clipboard or a paste field, then open the import screen. */
export function PasteSheet({ onClose }: { onClose: () => void }) {
  const { showToast } = useStore();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const open = (raw: string) => {
    const d = extractPayload(raw);
    if (!d || !decodeShould(d).ok) { setErr('הקישור לא תקין'); return; }
    onClose();
    location.hash = `#/import?d=${d}`;
  };
  const fromClipboard = async () => {
    try { open(await navigator.clipboard.readText()); }
    catch { showToast('אין גישה ללוח. הדביקו את הקישור בשדה'); }
  };
  return (
    <Sheet title="ייבוא מקישור" onClose={onClose}>
      <p className="note">הדביקו כאן את הקישור שקיבלתם, או קראו אותו מהלוח.</p>
      <div className="stack">
        <textarea className={`field${err ? ' err' : ''}`} aria-label="קישור לייבוא" placeholder="https://…" value={text}
          onChange={(e) => { setText(e.target.value); setErr(''); }} />
        {err && <div className="err-text" role="alert">{err}</div>}
      </div>
      <button className="btn block" onClick={fromClipboard}>הדבקה מהלוח</button>
      <div className="btn-row">
        <button className="btn primary" disabled={!text.trim()} onClick={() => open(text)}>המשך</button>
        <button className="btn" onClick={onClose}>ביטול</button>
      </div>
    </Sheet>
  );
}

function DiffRows({ d }: { d: Diff }) {
  const rows: { sign: 'plus' | 'minus' | 'tilde'; title: string; detail: string }[] = [];
  for (const s of d.addedSections) rows.push({ sign: 'plus', title: `קטגוריה חדשה: ${s.name}`, detail: s.itemCount === 1 ? 'פריט אחד' : `${s.itemCount} פריטים` });
  if (d.addedItems.length) rows.push({ sign: 'plus', title: 'פריטים חדשים', detail: d.addedItems.join(', ') });
  for (const n of d.removedSections) rows.push({ sign: 'minus', title: `קטגוריה תוסר: ${n}`, detail: 'עם כל הפריטים שבה' });
  if (d.removedItems.length) rows.push({ sign: 'minus', title: 'יוסרו', detail: d.removedItems.join(', ') });
  if (d.targetChanges.length) rows.push({ sign: 'tilde', title: 'כמות השתנתה', detail: d.targetChanges.map((t) => `${t.name} ${t.from} ← ${t.to}`).join(', ') });
  if (d.renamedItems.length) rows.push({ sign: 'tilde', title: 'שם פריט שונה', detail: d.renamedItems.map((t) => `${t.from} ← ${t.to}`).join(', ') });
  if (d.renamedSections.length) rows.push({ sign: 'tilde', title: 'שם קטגוריה שונה', detail: d.renamedSections.map((t) => `${t.from} ← ${t.to}`).join(', ') });
  if (d.movedItems.length) rows.push({ sign: 'tilde', title: 'הועברו בין קטגוריות', detail: d.movedItems.join(', ') });
  return (
    <>
      {rows.map((r, i) => (
        <div className="diff-row" key={i}>
          <span className={`sign ${r.sign}`} aria-hidden="true">{r.sign === 'plus' ? '+' : r.sign === 'minus' ? '−' : '~'}</span>
          <div><b>{r.title}</b><span>{r.detail}</span></div>
        </div>
      ))}
    </>
  );
}

export function ImportScreen() {
  const { should, replaceShould, showToast } = useStore();
  const route = useRoute();
  const d = route.query.get('d') ?? '';
  const dec = decodeShould(d);
  const exit = () => go('welcome', true);

  if (!dec.ok) {
    return (
      <div className="screen">
        <div className="center" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 className="title">הקישור לא תקין</h1>
          <p className="sub">לא שינינו כלום ברשימה שלך.</p>
          <button className="btn primary" onClick={exit}>חזרה</button>
        </div>
      </div>
    );
  }
  const incoming: ShouldList = dec.list;

  // iOS: a tapped link opens in Safari, which does not share storage with the installed app.
  if (isIOSBrowser()) {
    const url = location.href;
    return (
      <div className="screen">
        <div className="center">
          <div className="brand"><h1>קניות</h1></div>
          <div className="diff" style={{ padding: 16 }}>
            <p className="note"><b>הקישור נפתח בספארי, לא באפליקציה.</b></p>
            <p className="note" style={{ marginBlockStart: 8 }}>העתיקו את הקישור, פתחו את <b>קניות</b> ממסך הבית ולחצו <b>ייבוא</b>.</p>
          </div>
          <button className="btn primary block" onClick={async () => showToast((await copyText(url)) ? 'הקישור הועתק' : 'לא ניתן להעתיק')}>העתקת הקישור</button>
        </div>
      </div>
    );
  }

  const base = should ?? emptyShould();
  const diff = diffShould(base, incoming);
  const newer = !!should && localIsNewer(should, incoming);
  const apply = () => {
    replaceShould(incoming);
    showToast('הרשימה יובאה');
    go('welcome', true);
  };

  return (
    <div className="screen">
      <header className="head">
        <span className="eyebrow">קניות</span>
        <h1 className="title">ייבוא רשימה</h1>
        <p className="sub">התקבלה רשימה שעודכנה {fmt(incoming.updatedAt)}</p>
      </header>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="diff">
          <div className="diff-title">מה ישתנה</div>
          {diff.isEmpty ? <div className="diff-row"><div><b>אין שינויים</b><span>הרשימה זהה לרשימה שלך</span></div></div> : <DiffRows d={diff} />}
        </div>
        {newer && (
          <div className="warn" role="alert">
            <Svg size={18}><path d="M12 3l10 18H2z" /><path d="M12 10v4" /><path d="M12 17v.01" /></Svg>
            <span>הרשימה אצלך עודכנה מאוחר יותר ({fmt(should!.updatedAt)}). הייבוא יחליף את השינויים האלה.</span>
          </div>
        )}
        <p className="fine">רשימת הקניות והספירה של ״מה יש״ לא ישתנו.</p>
      </div>
      <div className="cta btn-row" style={{ paddingBlockStart: 8, paddingBlockEnd: 'calc(16px + var(--safe-b))' }}>
        <button className="btn primary" onClick={apply}>ייבוא והחלפה</button>
        <button className="btn" onClick={exit}>ביטול</button>
      </div>
    </div>
  );
}
