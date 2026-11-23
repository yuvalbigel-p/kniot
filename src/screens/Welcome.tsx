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
        <div className="home-head">
          <h1>קניות</h1>
          <span className={`sync-dot ${sync}`} role="status">{sync === 'live' ? 'מסונכרן' : sync === 'connecting' ? 'מתחבר…' : 'לא מחובר'}</span>
        </div>
        {sync === 'offline' && <p className="offline-note">השינויים נשמרים בטלפון ויסתנכרנו כשיחזור החיבור.</p>}
        <div className="stack" style={{ gap: 14 }}>
          <a className="home-card primary" href="#/quick">
            <span className="hc-icon" aria-hidden="true"><Svg size={24}><path d="M5 10h14l-1.5 9.2a1.5 1.5 0 01-1.5 1.3H8a1.5 1.5 0 01-1.5-1.3z" /><path d="M9 10l3-6 3 6" /></Svg></span>
            <span className="hc-text"><b>שבועי · מכולת</b><span>{wk.total === 0 ? 'הרשימה ריקה' : wk.done ? `${wk.done} כבר בעגלה` : 'מה שחסר במהלך השבוע'}</span></span>
            {wk.total > 0 && <span className="hc-count"><strong>{wk.total - wk.done}</strong><small>לקנות</small></span>}
          </a>
          <div className="home-card month">
            <div className="hc-title">
              <span className="hc-icon" aria-hidden="true"><Svg size={24}><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9h16v2a2.7 2.7 0 01-5.3 0 2.7 2.7 0 01-5.4 0A2.7 2.7 0 014 11z" /><path d="M5 12.5V20h14v-7.5" /><path d="M10 20v-4h4v4" /></Svg></span>
              <b>חודשי · סופר</b>
            </div>
            {should ? (
              <>
                <div className="hc-progress" aria-hidden="true"><i className={checkMeta.savedAt || mo.total ? 'on' : ''} /><i className={mo.total && mo.done === mo.total ? 'on' : mo.done ? 'half' : ''} /></div>
                <a className="step-row" href="#/check">
                  <div><em>1. בדיקת מלאי</em><span className={step1.cls}>{step1.cls === 'st-ok' && '✓ '}{step1.text}</span></div>
                  <Chev />
                </a>
                <a className="step-row" href="#/shop">
                  <div><em>2. רשימת קניות</em><span>{step2}</span></div>
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
