import { describe, expect, it } from 'vitest';
import { gap } from './gap';
import { starterShould, emptyShould } from './starter';
import { addOneOff, buildLines, exportList, finishShop, groupLines, mergeGaps, progress, needsExportConfirm } from './shopping';
import { addItem, checkItemName, deleteSection, moveSection, setTarget } from './should';
import { isShouldList } from './validate';
import type { ShoppingList } from './types';

const item = { id: 'a', sectionId: 's', name: 'x', target: 4 };

describe('gap', () => {
  it('is target minus count, never below 0', () => {
    expect(gap(item, { a: 1 })).toBe(3);
    expect(gap(item, { a: 9 })).toBe(0);
  });
  it('treats a missing count as 0', () => expect(gap(item, {})).toBe(4));
});

describe('starter', () => {
  it('has 5 sections and 20 items and validates', () => {
    const s = starterShould();
    expect(s.sections).toHaveLength(5);
    expect(s.items).toHaveLength(20);
    expect(isShouldList(s)).toBe(true);
  });
});

describe('export', () => {
  const should = starterShould();
  it('builds one line per gap in should-list order', () => {
    const counts = { [should.items[0].id]: 4, [should.items[1].id]: 1 };
    const lines = buildLines(should, counts);
    expect(lines).toHaveLength(19);
    expect(lines[0].name).toBe(should.items[1].name);
    expect(lines[0].qty).toBe(3);
    expect(lines.every((l) => !l.checked && !l.oneOff && l.sectionId)).toBe(true);
  });
  it('carries unchecked one-offs only and drops old lines', () => {
    const old: ShoppingList = {
      createdAt: 'x',
      lines: [
        { id: '1', name: 'old', qty: 1, checked: false, oneOff: false, itemId: 'z', sectionId: 'q' },
        { id: '2', name: 'keep', qty: 1, checked: false, oneOff: true },
        { id: '3', name: 'bought', qty: 1, checked: true, oneOff: true },
      ],
    };
    const out = exportList(should, {}, old, 'now');
    expect(out.createdAt).toBe('now');
    expect(out.lines.map((l) => l.name)).toContain('keep');
    expect(out.lines.map((l) => l.name)).not.toContain('old');
    expect(out.lines.map((l) => l.name)).not.toContain('bought');
    expect(needsExportConfirm(old)).toBe(true);
    expect(needsExportConfirm({ createdAt: '', lines: [old.lines[2]] })).toBe(false);
  });
});

describe('one-offs', () => {
  const empty: ShoppingList = { createdAt: '', lines: [] };
  it('ignores empty, adds trimmed with qty 1', () => {
    expect(addOneOff(empty, '   ').outcome).toBe('ignored');
    const r = addOneOff(empty, '  קפה ');
    expect(r.list.lines[0]).toMatchObject({ name: 'קפה', qty: 1, oneOff: true, checked: false });
  });
  it('highlights an unchecked duplicate and un-checks a checked one (case-insensitive)', () => {
    const a = addOneOff(empty, 'Milk').list;
    expect(addOneOff(a, 'milk').outcome).toBe('highlight');
    const checked = { ...a, lines: a.lines.map((l) => ({ ...l, checked: true })) };
    const r = addOneOff(checked, ' MILK ');
    expect(r.outcome).toBe('unchecked');
    expect(r.list.lines[0].checked).toBe(false);
    expect(r.list.lines).toHaveLength(1);
  });
});

describe('progress and grouping', () => {
  it('progress ratio', () => {
    expect(progress({ createdAt: '', lines: [] }).ratio).toBe(0);
    const l = addOneOff(addOneOff({ createdAt: '', lines: [] }, 'a').list, 'b').list;
    l.lines[0].checked = true;
    expect(progress(l)).toMatchObject({ done: 1, total: 2, ratio: 0.5 });
  });
  it('groups orphans under אחר before one-offs', () => {
    const should = starterShould();
    const list: ShoppingList = {
      createdAt: '',
      lines: [
        { id: '1', name: 'one', qty: 1, checked: false, oneOff: true },
        { id: '2', name: 'gone', qty: 2, checked: false, oneOff: false, sectionId: 'deleted', itemId: 'q' },
        { id: '3', name: 'ok', qty: 2, checked: false, oneOff: false, sectionId: should.sections[0].id, itemId: 'w' },
      ],
    };
    expect(groupLines(list, should).map((g) => g.title)).toEqual([should.sections[0].name, 'אחר', 'תוספות לפעם הזו']);
  });
});

describe('should-list edits', () => {
  it('rejects empty and duplicate names within a section', () => {
    const s = addItem(emptyShould(), 'x', 'חלב');
    expect(checkItemName(s, 'x', ' ').ok).toBe(false);
    expect(checkItemName(s, 'x', ' חלב ')).toEqual({ ok: false, error: 'כבר קיים' });
    expect(checkItemName(s, 'y', 'חלב').ok).toBe(true);
  });
  it('clamps targets, reorders and deletes sections with items', () => {
    const s = starterShould();
    expect(setTarget(s, s.items[0].id, 500).items[0].target).toBe(99);
    expect(setTarget(s, s.items[0].id, 0).items[0].target).toBe(1);
    const m = moveSection(s, s.sections[0].id, 1);
    expect(m.sections[1].id).toBe(s.sections[0].id);
    expect(moveSection(s, s.sections[0].id, -1)).toBe(s);
    const d = deleteSection(s, s.sections[0].id);
    expect(d.sections).toHaveLength(4);
    expect(d.items).toHaveLength(15);
  });
});

describe('monthly list: save check merges, finish removes bought', () => {
  const sh = starterShould();
  const [a, b, c] = sh.items;
  it('updates qty in place, adds new gaps, drops items no longer missing, keeps one-offs and bought lines', () => {
    const first = mergeGaps(sh, {}, { createdAt: 'x', lines: [{ id: 'o', name: 'סוללות', qty: 1, checked: false, oneOff: true }] });
    expect(first.lines.filter((l) => !l.oneOff)).toHaveLength(sh.items.length);
    const la = first.lines.find((l) => l.itemId === a.id)!;
    const bought = first.lines.map((l) => (l.itemId === c.id ? { ...l, checked: true } : l));
    const counts = Object.fromEntries(sh.items.map((i) => [i.id, i.target]));
    counts[a.id] = a.target - 1; // a: still missing 1
    counts[b.id] = b.target; // b: now enough -> removed
    counts[c.id] = c.target; // c: enough, but already bought -> kept
    const next = mergeGaps(sh, counts, { ...first, lines: bought });
    const na = next.lines.find((l) => l.itemId === a.id)!;
    expect(na.id).toBe(la.id);
    expect(na.qty).toBe(1);
    expect(next.lines.some((l) => l.itemId === b.id)).toBe(false);
    expect(next.lines.find((l) => l.itemId === c.id)?.checked).toBe(true);
    expect(next.lines.some((l) => l.name === 'סוללות')).toBe(true);
    expect(next.lines.filter((l) => l.itemId === a.id)).toHaveLength(1);
  });
  it('finishShop removes only checked lines', () => {
    const l = { createdAt: 'x', lines: [
      { id: '1', name: 'a', qty: 1, checked: true, oneOff: true },
      { id: '2', name: 'b', qty: 1, checked: false, oneOff: true },
    ] };
    expect(finishShop(l).lines.map((x) => x.id)).toEqual(['2']);
  });
});
