export type TitleAuthorFilterable = {
  books?: { title?: string | null; author?: string | null } | null;
  dnf?: boolean;
};

/**
 * Client-side shelf search. Scoped to the items passed in (one shelf / collection).
 * Does not hide DNF books — the DNF shelf must keep its books visible.
 */
export function filterItemsByTitleOrAuthor<T extends TitleAuthorFilterable>(
  items: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const title = item.books?.title?.toLowerCase() ?? "";
    const author = item.books?.author?.toLowerCase() ?? "";
    return title.includes(q) || author.includes(q);
  });
}

/** DNF shelf (and every other shelf page) never applies a hide-DNF filter. */
export function shouldApplyHideDnfFilter(_shelfStatus?: string | null): false {
  return false;
}
