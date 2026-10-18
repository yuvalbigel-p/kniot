import { describe, expect, it } from 'vitest';
import { gap } from './gap';
import { starterShould, emptyShould } from './starter';
import { addOneOff, buildLines, exportList, groupLines, progress, needsExportConfirm } from './shopping';
import { decodeShould, encodeShould, extractPayload } from './share';
import { diffShould, pruneCounts, localIsNewer } from './diff';
import { addItem, checkItemName, deleteSection, moveSection, setTarget } from './should';
import { isShouldList } from './validate';
import type { ShoppingList } from './types';

const item = { id: 'a', sectionId: 's', name: 'x', target: 4 };

describe('share link survives the hash/query round trip', () => {
  it('decodes payloads containing + after URLSearchParams and percent-encoding', () => {
    let hit = 0;
    for (let i = 0; i < 40; i++) {
      const s = starterShould();
      s.items[0].name = `פריט ${i}`;
      const d = encodeShould(s);
      const viaQuery = new URLSearchParams(`d=${d}`).get('d')!;
      expect(decodeShould(viaQuery).ok).toBe(true);
      expect(decodeShould(encodeURIComponent(d)).ok).toBe(true);
      if (d.includes('+')) hit++;
    }
    expect(hit).toBeGreaterThan(0);
  });
});

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

describe('sharing', () => {
  it('round-trips', () => {
    const s = starterShould();
    const d = decodeShould(encodeShould(s));
    expect(d.ok && d.list).toEqual(s);
  });
  it('rejects garbage and unknown schema', () => {
    expect(decodeShould('hello').ok).toBe(false);
    expect(decodeShould(encodeShould({ ...starterShould(), schema: 2 } as never)).ok).toBe(false);
  });
  it('extracts payload from a full link', () => {
    const p = encodeShould(starterShould());
    expect(extractPayload(`https://x.github.io/kniot/#/import?d=${p}`)).toBe(p);
    expect(extractPayload(p)).toBe(p);
    expect(extractPayload('')).toBeNull();
  });
});

describe('import diff', () => {
  it('reports changes', () => {
    const a = starterShould();
    const b = structuredClone(a);
    b.sections[0].name = 'ירקות';
    b.items[0].target = 9;
    b.items[1].name = 'עגבנייה';
    b.items.splice(2, 1);
    const sec = { id: 'new', name: 'חדש', icon: 'other' as const };
    b.sections.push(sec);
    b.items.push({ id: 'ni', sectionId: 'new', name: 'p', target: 1 });
    const d = diffShould(a, b);
    expect(d.renamedSections).toHaveLength(1);
    expect(d.targetChanges).toEqual([{ name: a.items[0].name, from: 4, to: 9 }]);
    expect(d.renamedItems).toHaveLength(1);
    expect(d.removedItems).toEqual([a.items[2].name]);
    expect(d.addedSections).toEqual([{ name: 'חדש', itemCount: 1 }]);
    expect(diffShould(a, a).isEmpty).toBe(true);
  });
  it('prunes counts and compares recency', () => {
    const s = starterShould();
    expect(pruneCounts({ [s.items[0].id]: 2, gone: 3 }, s)).toEqual({ [s.items[0].id]: 2 });
    expect(localIsNewer({ ...s, updatedAt: '2026-02-01T00:00:00Z' }, { ...s, updatedAt: '2026-01-01T00:00:00Z' })).toBe(true);
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
