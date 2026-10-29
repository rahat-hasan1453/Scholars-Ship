// "Show more" for the list view: which rows of the (grouped) table are on screen.

export type PagedGroup<G, T> = { group: G | null; items: T[] };

/**
 * The first `limit` rows in table order across groups. A collapsed group shows no rows and is not counted as "left".
 * `hidden` is how many rows "Show more" would still reveal.
 */
export function pageGroups<G extends { id: string }, T>(
  groups: PagedGroup<G, T>[],
  collapsed: ReadonlySet<string>,
  limit: number,
): { visible: { group: G | null; items: T[]; shown: T[] }[]; hidden: number } {
  let budget = limit;
  let hidden = 0;
  const visible = groups.map(({ group, items }) => {
    const folded = !!group && collapsed.has(group.id);
    const take = folded ? 0 : Math.min(items.length, budget);
    budget -= take;
    if (!folded) hidden += items.length - take;
    return { group, items, shown: items.slice(0, take) };
  });
  return { visible, hidden };
}
