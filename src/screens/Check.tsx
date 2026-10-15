import { useStore } from '../store';
import { gap } from '../logic/gap';
import { clampCount, itemsOf } from '../logic/should';
import { countGaps, exportList, needsExportConfirm, unchecked } from '../logic/shopping';
import { IconChip, Stepper, Svg, TabBar } from '../components';
import { go } from '../route';

export function CheckScreen() {
  const { should, counts, setCounts, shop, setShop, askConfirm } = useStore();
  if (!should) return null;
  const gaps = countGaps(should, counts);

  const setCount = (id: string, n: number) => setCounts((c) => ({ ...c, [id]: clampCount(n) }));
  const doExport = () => {
    setShop(exportList(should, counts, shop));
    go('shop');
  };
  const onExport = () => {
    if (!gaps) return;
    if (needsExportConfirm(shop)) {
      const n = unchecked(shop).length;
      askConfirm({
        title: `יש ברשימה ${n} ${n === 1 ? 'פריט' : 'פריטים'} שעוד לא נקנו. ליצור רשימה חדשה?`,
        confirmLabel: 'רשימה חדשה', onConfirm: doExport,
      });
    } else doExport();
  };
  const reset = () =>
    askConfirm({ title: 'לאפס את הספירה?', body: 'כל הכמויות יחזרו ל־0.', confirmLabel: 'איפוס', destructive: true, onConfirm: () => setCounts({}) });

  return (
    <div className="screen">
      <header className="head">
        <div className="head-top">
          <span className="eyebrow">קניות</span>
          <button className="text-btn" onClick={reset}>איפוס ספירה</button>
        </div>
        <h1 className="title">מה יש</h1>
        <p className="sub">סמנו כמה יש מכל פריט בבית עכשיו</p>
      </header>
      <div className="scroll">
        {should.sections.map((sec) => (
          <section className="card" key={sec.id} aria-label={sec.name}>
            <div className="card-head"><IconChip icon={sec.icon} /><span className="name">{sec.name}</span></div>
            {itemsOf(should, sec.id).map((it) => {
              const g = gap(it, counts);
              const have = counts[it.id] ?? 0;
              return (
                <div className="row check" key={it.id}>
                  <div className="top">
                    <span style={{ fontSize: 14.5 }}>{it.name}</span>
                    {g > 0
                      ? <button className="pill gap" aria-label={`חסר ${g} — לחיצה מסמנת שיש מספיק`} onClick={() => setCount(it.id, it.target)}>חסר {g}</button>
                      : <span className="pill ok">מספיק</span>}
                  </div>
                  <div className="bottom">
                    <span className="want">רוצים {it.target} · יש בבית</span>
                    <Stepper value={have} min={0} label={`יש בבית ${it.name}`} onChange={(n) => setCount(it.id, n)} />
                  </div>
                </div>
              );
            })}
          </section>
        ))}
        {should.items.length === 0 && <div className="empty"><h2>אין פריטים</h2><p>הוסיפו פריטים במסך ״מה צריך״.</p></div>}
      </div>
      <div className="cta">
        <button className="btn primary block" style={{ minBlockSize: 50 }} disabled={!gaps} onClick={onExport}>
          {gaps ? `ייצוא לרשימת קניות (${gaps})` : 'אין חוסרים'}
          {gaps ? <Svg size={18}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg> : null}
        </button>
      </div>
      <TabBar current="check" />
    </div>
  );
}
