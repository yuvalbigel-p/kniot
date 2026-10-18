import { useState } from 'react';
import { useStore } from '../store';
import { quickStartShould, starterShould } from '../logic/starter';
import type { ShouldList } from '../logic/types';
import { go, isIOSBrowser } from '../route';
import { ShareIcon, Svg } from '../components';
import { PasteSheet } from './Share';
import { THEMES, applyTheme, loadTheme, saveTheme } from '../theme';

export function WelcomeScreen() {
  const { should, setShould, replaceWithUndo, defaultList, lastTab, showToast } = useStore();
  const [paste, setPaste] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [skinsOpen, setSkinsOpen] = useState(false);

  const apply = (s: ShouldList, msg: string) => {
    if (should) replaceWithUndo(s, msg); else { setShould(s); showToast(msg); }
    go('should', true);
  };
  const fresh = (s: ShouldList): ShouldList => ({ ...s, updatedAt: new Date().toISOString() });
  const pick = (id: string) => { setTheme(applyTheme(id)); saveTheme(id); };

  return (
    <div className="screen">
      <div className="center">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16l-1.5 10a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7z" /><path d="M8 9l3-5" /><path d="M16 9l-3-5" /><path d="M9.5 13v4" /><path d="M14.5 13v4" /></svg>
          </div>
          <h1>קניות</h1>
          <p>מה צריך, מה יש, ומה לקנות.</p>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {should && (
            <a className="choice primary" href={`#/${lastTab}`}>
              <b>המשך ברשימה שלי</b>
              <span>הרשימה השמורה במכשיר: {should.items.length} פריטים ב־{should.sections.length} קטגוריות.</span>
            </a>
          )}
          <button className={`choice${should ? '' : ' primary'}`} onClick={() => apply(fresh(defaultList ?? starterShould()), 'נטענה רשימת ברירת המחדל')}>
            <b>רשימת ברירת מחדל</b>
            <span>{should ? 'מחליפה את הרשימה הנוכחית. ' : ''}{defaultList ? `הרשימה ששמרתם: ${defaultList.items.length} פריטים ב־${defaultList.sections.length} קטגוריות.` : '5 קטגוריות ו־20 פריטים בסיסיים. אפשר לערוך ולשמור כברירת מחדל.'}</span>
          </button>
          <button className="choice" onClick={() => apply(quickStartShould(), 'נפתחה רשימה ריקה')}><b>רשימה ריקה</b><span>קטגוריה אחת מוכנה, מתחילים להוסיף פריטים מיד.</span></button>
          <button className="choice" onClick={() => setPaste(true)}><b>ייבוא קישור</b><span>קיבלתם רשימה? העתיקו את הקישור ולחצו כאן.</span></button>
        </div>
        <div className="skins">
          <button className="link-btn skins-toggle" aria-expanded={skinsOpen} aria-controls="skin-grid" onClick={() => setSkinsOpen((v) => !v)}>
            <Svg size={18}><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10" r="1.2" fill="currentColor" stroke="none" /><path d="M12 21c-1.5 0-2-1.2-1.4-2.4.5-1 0-2.1-1.1-2.1H8a3 3 0 010-6" /></Svg>
            {skinsOpen ? 'הסתרת עיצובים' : 'שינוי עיצוב'}
          </button>
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
      {paste && <PasteSheet onClose={() => setPaste(false)} />}
    </div>
  );
}
