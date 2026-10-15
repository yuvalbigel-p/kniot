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
      <Svg d={iconDef(icon).d} size={small ? 14 : 17} sw={small ? 2 : 1.8} />
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

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'should', label: 'מה צריך', icon: <Svg><path d="M9 6h10M9 12h10M9 18h10" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></Svg> },
  { id: 'check', label: 'מה יש', icon: <Svg><circle cx="10.5" cy="10.5" r="6.5" /><path d="M19 19l-4.3-4.3" /></Svg> },
  { id: 'shop', label: 'לקנייה', icon: <Svg><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /><path d="M3 4h2l2.4 12.5a2 2 0 001.5 1.5h8.2a2 2 0 002-1.6L21 8H6" /></Svg> },
];

export function TabBar({ current }: { current: Tab }) {
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

const STEP_LABELS = ['מה צריך', 'מה יש', 'לקנייה'];
export function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="steps" role="img" aria-label={`שלב ${step} מתוך 3`}>
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

export function MoveButtons({ onUp, onDown, label }: { onUp?: () => void; onDown?: () => void; label: string }) {
  return (
    <span className="move">
      <button className="icon-btn" disabled={!onUp} onClick={onUp} aria-label={`הזזת ${label} למעלה`}><Svg size={20} sw={2.2}><path d="M6 15l6-6 6 6" /></Svg></button>
      <button className="icon-btn" disabled={!onDown} onClick={onDown} aria-label={`הזזת ${label} למטה`}><Svg size={20} sw={2.2}><path d="M6 9l6 6 6-6" /></Svg></button>
    </span>
  );
}
