import type { LibraryBookRow } from "@/lib/services/library";

export type ShelfSortMode = "recently_added" | "title" | "author";

export const SHELF_SORT_OPTIONS: { mode: ShelfSortMode; label: string }[] = [
  { mode: "recently_added", label: "Recently added" },
  { mode: "title", label: "Title" },
  { mode: "author", label: "Author" },
];

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortShelfItems(
  items: LibraryBookRow[],
  mode: ShelfSortMode
): LibraryBookRow[] {
  const sorted = [...items];

  switch (mode) {
    case "title":
      sorted.sort((a, b) =>
        compareStrings(a.books?.title ?? "", b.books?.title ?? "")
      );
      break;
    case "author":
      sorted.sort((a, b) => {
        const authorCmp = compareStrings(
          a.books?.author ?? "",
          b.books?.author ?? ""
        );
        if (authorCmp !== 0) return authorCmp;
        return compareStrings(a.books?.title ?? "", b.books?.title ?? "");
      });
      break;
    case "recently_added":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }

  return sorted;
}
