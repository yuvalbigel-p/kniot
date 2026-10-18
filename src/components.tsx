import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { IconId, Tab } from './logic/types';
import { iconColors, iconDef } from './logic/icons';
import { useStore } from './store';

export const Svg = ({ d, size = 20, sw = 1.8, children }: { d?: string; size?: number; sw?: number; children?: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

export function IconChip({ icon, small }: { icon: IconId; small?: boolean }) {
  const [c, bg] = iconColors(icon);
  return (
    <span className={`chip${small ? ' sm' : ''}`} style={{ background: bg, color: c }}>
      <Svg d={iconDef(icon).d} size={small ? 17 : 21} sw={small ? 1.9 : 1.7} />
    </span>
  );
}

export const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}><path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></Svg>
);

export function Stepper({ value, min, max = 99, onChange, label }: { value: number; min: number; max?: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label="הפחתה" disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="הוספה" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const move = (dy: number) => { if (ref.current) ref.current.style.transform = dy > 0 ? `translateY(${dy}px)` : ''; };
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={title}>
        <div
          className="grab"
          onPointerDown={(e) => { drag.current = { y: e.clientY, dy: 0 }; e.currentTarget.setPointerCapture(e.pointerId); ref.current?.classList.add('dragging'); }}
          onPointerMove={(e) => { if (!drag.current) return; drag.current.dy = e.clientY - drag.current.y; move(drag.current.dy); }}
          onPointerUp={() => {
            const dy = drag.current?.dy ?? 0;
            drag.current = null;
            ref.current?.classList.remove('dragging');
            if (dy > 90) onClose(); else move(0);
          }}
          onPointerCancel={() => { drag.current = null; move(0); }}
        ><i /></div>
        <h2>{title}</h2>
        {children}
      </div>
    </>
  );
}

export function Toast() {
  const { toast, dismissToast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.text}</span>
      {toast.action && <button onClick={() => { toast.action!.run(); dismissToast(); }}>{toast.action.label}</button>}
    </div>
  );
}

export function ConfirmDialog() {
  const { confirm, askConfirm } = useStore();
  if (!confirm) return null;
  const close = () => askConfirm(null);
  return (
    <>
      <div className="backdrop top" onClick={close} />
      <div className="dialog" role="alertdialog" aria-label={confirm.title}>
        <h2>{confirm.title}</h2>
        {confirm.body && <p>{confirm.body}</p>}
        <div className="btn-row">
          <button className="btn primary" onClick={() => { close(); confirm.onConfirm(); }}>{confirm.confirmLabel}</button>
          <button className="btn" onClick={close}>{confirm.cancelLabel ?? 'ביטול'}</button>
        </div>
      </div>
    </>
  );
}

const TABS: { id: 'check' | 'shop'; label: string; icon: ReactNode }[] = [
  { id: 'check', label: 'מה יש', icon: <Svg><circle cx="10.5" cy="10.5" r="6.5" /><path d="M19 19l-4.3-4.3" /></Svg> },
  { id: 'shop', label: 'לקנייה', icon: <Svg><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /><path d="M3 4h2l2.4 12.5a2 2 0 001.5 1.5h8.2a2 2 0 002-1.6L21 8H6" /></Svg> },
];

export function TabBar({ current }: { current: 'check' | 'shop' }) {
  return (
    <nav className="tabbar" aria-label="ניווט ראשי">
      {TABS.map((t) => (
        <a key={t.id} href={`#/${t.id}`} className="tab" aria-current={t.id === current ? 'page' : undefined}>
          {t.icon}<span>{t.label}</span>
        </a>
      ))}
    </nav>
  );
}

/** Dropdown menu that closes on outside tap. */
export function Menu({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, zIndex: 29 }} onClick={onClose} />
      <div className="menu" role="menu" onClick={onClose}>{children}</div>
    </>
  );
}

export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return ref;
}

export function useToggle(initial = false): [boolean, () => void, (v: boolean) => void] {
  const [v, set] = useState(initial);
  return [v, () => set((x) => !x), set];
}

const STEP_LABELS = ['מה יש', 'לקנייה'];
export function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="steps" role="img" aria-label={`שלב ${step} מתוך 2`}>
      {STEP_LABELS.map((l, i) => (
        <div key={l} className={`step${i + 1 < step ? ' done' : ''}${i + 1 === step ? ' now' : ''}`}>
          <i />
          <span>{i + 1}. {l}</span>
        </div>
      ))}
    </div>
  );
}

export const HomeButton = () => (
  <a className="icon-btn" href="#/welcome" aria-label="מסך הבית">
    <Svg size={20}><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></Svg>
  </a>
);

/** Press on the handle (a grip with touch-action:none) and drag the element over its `[data-drag-scope]` siblings; onOver(draggedId, targetId) fires when it crosses a neighbour's midpoint. Spread the result on the grip. */
export function dragProps(id: string, scope: string, onOver: (id: string, targetId: string) => void) {
  return {
    'data-drag-handle': '',
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const found = e.currentTarget.closest<HTMLElement>('[data-drag-id]');
      if (!found) return;
      const el: HTMLElement = found;
      const scroller = el.closest('.scroll') as HTMLElement | null;
      const x0 = e.clientX;
      let y = e.clientY;
      const y0 = y;
      let active = false;
      let raf = 0;
      let grab = 0;
      const blockTouch = (ev: TouchEvent) => { if (ev.cancelable) ev.preventDefault(); };
      const blockClick = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
      const tick = () => {
        if (scroller) {
          const r = scroller.getBoundingClientRect();
          if (y < r.top + 70) scroller.scrollTop -= 12;
          else if (y > r.bottom - 70) scroller.scrollTop += 12;
        }
        el.style.transform = 'none';
        const cur = el.getBoundingClientRect();
        el.style.transform = `translateY(${y - grab - cur.top}px) scale(1.02)`;
        for (const other of Array.from(document.querySelectorAll<HTMLElement>(`[data-drag-scope="${scope}"]`))) {
          if (other.dataset.dragId === id) continue;
          const r = other.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          if (r.top > cur.top ? y > mid : y < mid) { onOver(id, other.dataset.dragId!); break; }
        }
        raf = requestAnimationFrame(tick);
      };
      const begin = () => {
        active = true;
        grab = y0 - el.getBoundingClientRect().top;
        el.classList.add('dragging');
        document.documentElement.classList.add('drag-on');
        window.addEventListener('touchmove', blockTouch, { passive: false });
        navigator.vibrate?.(15);
        raf = requestAnimationFrame(tick);
      };
      e.preventDefault();
      begin();
      const move = (ev: PointerEvent) => {
        y = ev.clientY;
        if (!active && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) cleanup();
      };
      function cleanup() {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', cleanup);
        window.removeEventListener('pointercancel', cleanup);
        window.removeEventListener('touchmove', blockTouch);
        if (active) {
          el.classList.remove('dragging');
          el.style.transform = '';
          document.documentElement.classList.remove('drag-on');
          window.addEventListener('click', blockClick, { capture: true, once: true });
          window.setTimeout(() => window.removeEventListener('click', blockClick, { capture: true }), 250);
        }
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', cleanup);
      window.addEventListener('pointercancel', cleanup);
    },
  };
}

/** Back arrow at the start (right in RTL) of a screen header. */
export const BackButton = ({ to, label }: { to: string; label: string }) => (
  <a className="icon-btn back" href={`#/${to}`} aria-label={label}>
    <Svg size={22} sw={2}><path d="M9 6l6 6-6 6" /></Svg>
  </a>
);

const COLLAPSED_KEY = 'kaniyot.collapsed.v1';
/** Which sections are folded; a per-device convenience shared by the should and check screens. */
export function useCollapsed() {
  const [ids, setIds] = useState<string[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
  });
  const toggle = (id: string) => setIds((p) => {
    const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(n)); } catch { /* optional */ }
    return n;
  });
  const setAll = (all: string[], collapsed: boolean) => {
    const n = collapsed ? Array.from(new Set([...ids, ...all])) : ids.filter((x) => !all.includes(x));
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(n)); } catch { /* optional */ }
    setIds(n);
  };
  return { isCollapsed: (id: string) => ids.includes(id), toggle, setAll };
}

export const Chevron = ({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) => (
  <button className="icon-btn chev" aria-expanded={open} aria-label={`${open ? 'כיווץ' : 'הרחבת'} ${label}`} onClick={onClick}>
    <Svg size={20} sw={2.2}><path d={open ? 'M6 9l6 6 6-6' : 'M15 6l-6 6 6 6'} /></Svg>
  </button>
);

export function Grip({ label, ...drag }: { label: string } & ReturnType<typeof dragProps>) {
  return (
    <button className="grip" aria-label={`גרירת ${label}`} {...drag}>
      <Svg size={20} sw={2}><path d="M5 9h14M5 15h14" /></Svg>
    </button>
  );
}

/** One-tap fold/unfold of every section. */
export function CollapseAll({ ids, isCollapsed, setAll }: { ids: string[]; isCollapsed: (id: string) => boolean; setAll: (ids: string[], collapsed: boolean) => void }) {
  if (ids.length < 2) return null;
  const all = ids.every(isCollapsed);
  return (
    <button className="collapse-all" onClick={() => setAll(ids, !all)}>
      <Svg size={18} sw={2.2}><path d={all ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} /></Svg>
      {all ? 'הרחבת הכל' : 'כיווץ הכל — לסידור קטגוריות'}
    </button>
  );
}
