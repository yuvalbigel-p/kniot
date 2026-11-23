import { useStore } from '../store';
import { gap } from '../logic/gap';
import { clampCount, itemsOf } from '../logic/should';
import { countGaps, mergeGaps } from '../logic/shopping';
import { BackButton, HomeButton, Chevron, CollapseAll, IconChip, Stepper, useCollapsed, Svg, TabBar } from '../components';
import { go } from '../route';

export function CheckScreen() {
  const { should, counts, setCounts, setShop, setCheckMeta, askConfirm, showToast } = useStore();
  const { isCollapsed, toggle, setAll } = useCollapsed();
  if (!should) return null;
  const gaps = countGaps(should, counts);

  const setCount = (id: string, n: number) => {
    setCounts((c) => ({ ...c, [id]: clampCount(n) }));
    setCheckMeta((m) => (m.dirty ? m : { ...m, dirty: true }));
  };
  const save = () => {
    setShop((p) => mergeGaps(should, counts, p));
    setCheckMeta({ savedAt: new Date().toISOString(), dirty: false });
    showToast(gaps ? `נשמר · ${gaps === 1 ? 'פריט אחד' : `${gaps} פריטים`} ברשימת הקניות` : 'נשמר · אין חוסרים');
    go('welcome');
  };
  const reset = () =>
    askConfirm({
      title: 'לנקות את הבדיקה?', body: 'כל הכמויות יחזרו ל־0. רשימת הקניות לא משתנה.', confirmLabel: 'ניקוי', destructive: true,
      onConfirm: () => { setCounts({}); setCheckMeta((m) => ({ ...m, dirty: true })); },
    });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <div className="head-start"><BackButton to="welcome" label="חזרה למסך הבית" /><span className="eyebrow">חודשי · סופר</span></div>
          <div className="head-actions"><button className="text-btn" onClick={reset}>ניקוי</button><HomeButton /></div>
        </div>
        <h1 className="title">מה יש</h1>
        <p className="sub">סמנו כמה יש מכל פריט בבית עכשיו</p>
      </header>
      <div className="scroll">
        <CollapseAll ids={should.sections.map((x) => x.id)} isCollapsed={isCollapsed} setAll={setAll} />
        {should.sections.map((sec) => (
          <section className="card" key={sec.id} aria-label={sec.name}>
            <div className="card-head"><Chevron open={!isCollapsed(sec.id)} onClick={() => toggle(sec.id)} label={sec.name} /><IconChip icon={sec.icon} /><span className="name">{sec.name}</span></div>
            {!isCollapsed(sec.id) && itemsOf(should, sec.id).map((it) => {
              const g = gap(it, counts);
              const have = counts[it.id] ?? 0;
              return (
                <div className={`row check1${g > 0 ? '' : ' ok'}`} key={it.id}>
                  <div className="c-name">
                    <span className="iname">{it.name}</span>
                    <span className="c-sub">רוצים {it.target}{g > 0
                      ? <> · <button className="c-gap" aria-label={`חסר ${g}, לחיצה מסמנת שיש מספיק`} onClick={() => setCount(it.id, it.target)}>חסר {g}</button></>
                      : <> · <b className="c-ok">מספיק</b></>}</span>
                  </div>
                  <Stepper compact value={have} min={0} label={`יש בבית ${it.name}`} onChange={(n) => setCount(it.id, n)} />
                </div>
              );
            })}
          </section>
        ))}
        {should.items.length === 0 && <div className="empty"><h2>אין פריטים</h2><p>הוסיפו פריטים במסך ״מה צריך״.</p></div>}
      </div>
      <div className="cta">
        <button className="btn primary block big" onClick={save}>
          <span className="col">שמירה{<small>{gaps ? (gaps === 1 ? 'פריט אחד חסר' : `${gaps} פריטים חסרים`) : 'אין חוסרים'}</small>}</span>
          <Svg size={20}><path d="M5 12l5 5 9-10" /></Svg>
        </button>
      </div>
      <TabBar current="check" />
    </div>
  );
}
