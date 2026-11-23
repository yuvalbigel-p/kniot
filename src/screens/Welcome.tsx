import { useState } from 'react';
import { useStore } from '../store';
import { starterShould } from '../logic/starter';
import type { ShouldList } from '../logic/types';
import { isIOSBrowser } from '../route';
import { ShareIcon, Svg } from '../components';
import { progress } from '../logic/shopping';
import { when } from '../logic/when';

const Chev = () => <Svg size={18}><path d="M15 6l-6 6 6 6" /></Svg>;
import { THEMES, applyTheme, loadTheme, saveTheme } from '../theme';

export function WelcomeScreen() {
  const { should, quick, counts, shop, checkMeta, setShould, showToast, sync } = useStore();
  const [theme, setTheme] = useState(loadTheme);
  const [skinsOpen, setSkinsOpen] = useState(false);

  const apply = (s: ShouldList, msg: string) => { setShould(s); showToast(msg); };
  const fresh = (s: ShouldList): ShouldList => ({ ...s, updatedAt: new Date().toISOString() });
  const pick = (id: string) => { setTheme(applyTheme(id)); saveTheme(id); };

  const wk = progress(quick);
  const mo = progress(shop);
  const counted = Object.keys(counts).length > 0;
  const step1 = checkMeta.dirty && counted
    ? { text: 'יש שינויים שלא נשמרו', cls: 'st-warn' }
    : checkMeta.savedAt
      ? { text: `נשמרה ${when(checkMeta.savedAt)}`, cls: 'st-ok' }
      : { text: counted ? 'בתהליך' : 'התחלת בדיקה חדשה', cls: '' };
  const step2 = mo.total === 0 ? 'אין רשימה פתוחה'
    : mo.done ? `נשארו ${mo.total - mo.done} מתוך ${mo.total}`
      : checkMeta.savedAt ? `${mo.total} לקנייה` : `${mo.total} נשארו מהפעם הקודמת`;

  return (
    <div className="screen">
      <div className="center home">
        <div className="brand small">
          <h1>קניות</h1>
        </div>
        <div className="stack" style={{ gap: 14 }}>
          <a className="home-card primary" href="#/quick">
            <div>
              <b>שבועי · מכולת</b>
              <span>{wk.total === 0 ? 'הרשימה ריקה' : `${wk.total - wk.done} לקנייה${wk.done ? ` · ${wk.done} נקנו` : ''}`}</span>
            </div>
            <Chev />
          </a>
          <div className="home-card month">
            <b>חודשי · סופר</b>
            {should ? (
              <>
                <a className="step-row" href="#/check">
                  <div><small>שלב 1</small><em>בדיקת מלאי</em><span className={step1.cls}>{step1.cls === 'st-ok' && '✓ '}{step1.text}</span></div>
                  <Chev />
                </a>
                <a className="step-row" href="#/shop">
                  <div><small>שלב 2</small><em>רשימת קניות</em><span>{step2}</span></div>
                  <Chev />
                </a>
              </>
            ) : (
              <button className="step-row" onClick={() => apply(fresh(starterShould()), 'נטענה רשימת התחלה')}>
                <div><em>להתחלה: רשימת ״מה צריך״</em><span>5 קטגוריות ו־20 פריטים בסיסיים, אפשר לערוך אחר כך</span></div>
                <Chev />
              </button>
            )}
          </div>
        </div>
        <div className="home-links">
          {should && <a className="link-btn" href="#/should">עריכת מה צריך</a>}
          <button className="link-btn" aria-expanded={skinsOpen} aria-controls="skin-grid" onClick={() => setSkinsOpen((v) => !v)}>{skinsOpen ? 'הסתרת עיצובים' : 'עיצוב'}</button>
        </div>
        <div className={`sync-badge ${sync}`} role="status">{sync === 'live' ? 'מסונכרן' : sync === 'connecting' ? 'מתחבר…' : 'לא מחובר · השינויים יישמרו ויסתנכרנו'}</div>
        <div className="skins">
          {skinsOpen && (
            <div className="skin-grid" id="skin-grid">
              {THEMES.map((t) => (
                <button key={t.id} className="skin" aria-pressed={theme === t.id} onClick={() => pick(t.id)}>
                  <span className="swatch" style={{ background: t.bg }} aria-hidden="true">
                    <i style={{ background: t.card, border: `1px solid ${t.ink}33` }} />
                    <i style={{ background: t.accent }} />
                    <i className="bar" style={{ background: t.ink }} />
                  </span>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {isIOSBrowser() && (
          <div className="hint"><ShareIcon size={18} /><span>להוספה למסך הבית: שיתוף ← הוסף למסך הבית</span></div>
        )}
      </div>
    </div>
  );
}
