import { describe, expect, it } from "vitest";
import {
  filterFinishedHistoryBooks,
  selectRecentlyFinishedBooks,
  sortHistoryBooks,
  type HistorySortableBook,
} from "./readingRoomHistory";

function book(
  overrides: Partial<
    HistorySortableBook & { shelf_status?: string; dnf?: boolean }
  > = {}
): HistorySortableBook & { shelf_status?: string; dnf?: boolean } {
  return {
    id: "1",
    shelf_status: "read",
    created_at: "2026-01-01T00:00:00.000Z",
    finished_at: "2026-07-01T00:00:00.000Z",
    books: { title: "Alpha", author: "Zed Author" },
    ...overrides,
  };
}

describe("sortHistoryBooks", () => {
  const items = [
    book({
      id: "a",
      finished_at: "2026-06-01T00:00:00.000Z",
      books: { title: "Beta", author: "Amy" },
    }),
    book({
      id: "b",
      finished_at: "2026-08-01T00:00:00.000Z",
      books: { title: "Alpha", author: "Zed" },
    }),
    book({
      id: "c",
      finished_at: "2026-07-01T00:00:00.000Z",
      books: { title: "Gamma", author: "Amy" },
    }),
  ];

  it("sorts by finished_at newest first by default", () => {
    const sorted = sortHistoryBooks(items, "added_newest");
    expect(sorted.map((item) => item.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by finished_at oldest first", () => {
    const sorted = sortHistoryBooks(items, "added_oldest");
    expect(sorted.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by title and author", () => {
    expect(sortHistoryBooks(items, "title_asc").map((item) => item.books?.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(sortHistoryBooks(items, "author_asc")[0]?.books?.author).toBe("Amy");
    expect(sortHistoryBooks(items, "author_desc")[0]?.books?.author).toBe("Zed");
  });
});

describe("filterFinishedHistoryBooks", () => {
  it("keeps read-shelf books, including legacy rows without finished_at", () => {
    const rows = [
      book({ id: "1" }),
      book({ id: "2", shelf_status: "currently_reading" }),
      book({
        id: "3",
        finished_at: null,
        updated_at: "2026-07-15T00:00:00.000Z",
      }),
      book({ id: "4", dnf: true }),
    ];

    expect(filterFinishedHistoryBooks(rows).map((row) => row.id)).toEqual([
      "1",
      "3",
    ]);
  });
});

describe("selectRecentlyFinishedBooks", () => {
  it("returns newest finishes first with updated_at fallback and limit", () => {
    const rows = [
      book({
        id: "old",
        finished_at: "2026-05-01T00:00:00.000Z",
      }),
      book({
        id: "legacy",
        finished_at: null,
        updated_at: "2026-08-01T00:00:00.000Z",
      }),
      book({
        id: "newest",
        finished_at: "2026-07-20T00:00:00.000Z",
      }),
      book({ id: "dnf", dnf: true }),
      book({ id: "reading", shelf_status: "currently_reading" }),
    ];

    expect(selectRecentlyFinishedBooks(rows, 3).map((row) => row.id)).toEqual([
      "legacy",
      "newest",
      "old",
    ]);
  });
});
