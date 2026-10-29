import { describe, it, expect } from 'vitest';
import { pageGroups } from '@/lib/feedPaging';

const rows = (n: number, from = 0) => Array.from({ length: n }, (_, i) => from + i);
const none = new Set<string>();

describe('pageGroups', () => {
  it('shows the first page of an ungrouped table and counts what is left', () => {
    const { visible, hidden } = pageGroups([{ group: null, items: rows(100) }], none, 48);
    expect(visible[0].shown).toHaveLength(48);
    expect(visible[0].shown[0]).toBe(0);
    expect(hidden).toBe(52);
  });
  it('shows everything when it fits', () => {
    const { visible, hidden } = pageGroups([{ group: null, items: rows(10) }], none, 48);
    expect(visible[0].shown).toHaveLength(10);
    expect(hidden).toBe(0);
  });
  it('fills groups in order and stops when the page is full', () => {
    const groups = [
      { group: { id: 'soon' }, items: rows(30) },
      { group: { id: 'open' }, items: rows(40, 100) },
      { group: { id: 'closed' }, items: rows(20, 200) },
    ];
    const { visible, hidden } = pageGroups(groups, none, 48);
    expect(visible.map((g) => g.shown.length)).toEqual([30, 18, 0]);
    expect(hidden).toBe(22 + 20);
  });
  it('a collapsed group shows nothing, takes no room and is not counted as left', () => {
    const groups = [
      { group: { id: 'a' }, items: rows(30) },
      { group: { id: 'b' }, items: rows(30, 100) },
    ];
    const { visible, hidden } = pageGroups(groups, new Set(['a']), 48);
    expect(visible.map((g) => g.shown.length)).toEqual([0, 30]);
    expect(hidden).toBe(0);
  });
});
