import { useState } from 'react';
import { useStore } from '../store';
import { emptyShould, starterShould } from '../logic/starter';
import type { ShouldList } from '../logic/types';
import { go, isIOSBrowser, useRoute } from '../route';
import { ShareIcon, Svg } from '../components';
import { PasteSheet } from './Share';

export function WelcomeScreen() {
  const { should, setShould, replaceShould, defaultList, lastTab, askConfirm, showToast } = useStore();
  const [paste, setPaste] = useState(false);
  useRoute();

  const apply = (s: ShouldList, msg?: string) => {
    const run = () => { should ? replaceShould(s) : setShould(s); if (msg) showToast(msg); go('should', true); };
    if (should) {
      askConfirm({ title: 'להחליף את הרשימה הנוכחית?', body: 'השינויים ברשימה הנוכחית יימחקו.', confirmLabel: 'החלפה', onConfirm: run });
    } else run();
  };
  const fresh = (s: ShouldList): ShouldList => ({ ...s, updatedAt: new Date().toISOString() });

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
            <button className="choice primary" onClick={() => go(lastTab)}>
              <b>המשך לרשימה שלי</b><span>{should.items.length} פריטים ב־{should.sections.length} קטגוריות</span>
            </button>
          )}
          {defaultList && (
            <button className={`choice${should ? '' : ' primary'}`} onClick={() => apply(fresh(defaultList), 'נטענה ברירת המחדל')}>
              <b>להתחיל מרשימת ברירת המחדל שלי</b><span>{defaultList.items.length} פריטים ב־{defaultList.sections.length} קטגוריות, כפי ששמרתם.</span>
            </button>
          )}
          <button className={`choice${!should && !defaultList ? ' primary' : ''}`} onClick={() => apply(starterShould())}>
            <b>להתחיל מרשימה מוכנה</b><span>5 קטגוריות ו־20 פריטים בסיסיים. אפשר לערוך הכל אחר כך.</span>
          </button>
          <button className="choice" onClick={() => apply(emptyShould())}><b>רשימה ריקה</b><span>בונים הכל מאפס.</span></button>
          <button className="choice" onClick={() => setPaste(true)}><b>ייבוא מקישור</b><span>קיבלתם רשימה? העתיקו את הקישור ולחצו כאן.</span></button>
        </div>
        {isIOSBrowser() && (
          <div className="hint"><ShareIcon size={18} /><span>להוספה למסך הבית: שיתוף ← הוסף למסך הבית</span></div>
        )}
      </div>
      {paste && <PasteSheet onClose={() => setPaste(false)} />}
    </div>
  );
}
