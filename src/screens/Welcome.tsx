import { useState } from 'react';
import { useStore } from '../store';
import { quickStartShould, starterShould } from '../logic/starter';
import type { ShouldList } from '../logic/types';
import { go, isIOSBrowser } from '../route';
import { ShareIcon, Svg } from '../components';
import { PasteSheet } from './Share';
import { THEMES, applyTheme, loadTheme, saveTheme } from '../theme';

export function WelcomeScreen() {
  const { should, setShould, replaceShould, defaultList, lastTab, askConfirm, showToast } = useStore();
  const [paste, setPaste] = useState(false);
  const [theme, setTheme] = useState(loadTheme);

  const apply = (s: ShouldList, msg?: string) => {
    const run = () => { should ? replaceShould(s) : setShould(s); if (msg) showToast(msg); go('should', true); };
    if (should) {
      askConfirm({ title: 'להחליף את הרשימה הנוכחית?', body: 'השינויים ברשימה הנוכחית יימחקו.', confirmLabel: 'החלפה', onConfirm: run });
    } else run();
  };
  const fresh = (s: ShouldList): ShouldList => ({ ...s, updatedAt: new Date().toISOString() });
  const pick = (id: string) => { setTheme(applyTheme(id)); saveTheme(id); };

  return (
    <div className="screen">
      <div className="center">
        {should && (
          <div className="back-row">
            <a className="icon-btn" href={`#/${lastTab}`} aria-label="חזרה לרשימה" style={{ marginInline: -10 }}>
              <Svg size={22} sw={2}><path d="M9 6l6 6-6 6" /></Svg>
            </a>
          </div>
        )}
        <div className="brand">
          <div className="logo" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16l-1.5 10a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7z" /><path d="M8 9l3-5" /><path d="M16 9l-3-5" /><path d="M9.5 13v4" /><path d="M14.5 13v4" /></svg>
          </div>
          <h1>קניות</h1>
          <p>מה צריך, מה יש, ומה לקנות.</p>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          <button className="choice primary" onClick={() => apply(fresh(defaultList ?? starterShould()), 'נטענה רשימת ברירת המחדל')}>
            <b>רשימת ברירת מחדל</b>
            <span>{defaultList ? `הרשימה ששמרתם: ${defaultList.items.length} פריטים ב־${defaultList.sections.length} קטגוריות.` : '5 קטגוריות ו־20 פריטים בסיסיים. אפשר לערוך ולשמור כברירת מחדל.'}</span>
          </button>
          <button className="choice" onClick={() => apply(quickStartShould())}><b>רשימה ריקה</b><span>קטגוריה אחת מוכנה, מתחילים להוסיף פריטים מיד.</span></button>
          <button className="choice" onClick={() => setPaste(true)}><b>ייבוא קישור</b><span>קיבלתם רשימה? העתיקו את הקישור ולחצו כאן.</span></button>
        </div>
        <div className="skins">
          <h2>עיצוב</h2>
          <div className="skin-grid">
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
        </div>
        {isIOSBrowser() && (
          <div className="hint"><ShareIcon size={18} /><span>להוספה למסך הבית: שיתוף ← הוסף למסך הבית</span></div>
        )}
      </div>
      {paste && <PasteSheet onClose={() => setPaste(false)} />}
    </div>
  );
}
