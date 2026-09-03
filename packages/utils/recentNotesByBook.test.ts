import { describe, expect, it } from "vitest";
import {
  HOME_RECENT_NOTED_BOOKS_LIMIT,
  pickLatestNotePerBook,
  selectRecentNotedBooks,
} from "./recentNotesByBook";

describe("selectRecentNotedBooks", () => {
  it("returns at most five recently read books", () => {
    const books = Array.from({ length: 8 }, (_, index) => ({
      userBookId: `ub-${index}`,
      lastReadAt: `2026-08-0${index + 1}T12:00:00.000Z`,
      updatedAt: null,
    }));

    const selected = selectRecentNotedBooks(books);
    expect(selected).toHaveLength(HOME_RECENT_NOTED_BOOKS_LIMIT);
    expect(selected.map((book) => book.userBookId)).toEqual([
      "ub-7",
      "ub-6",
      "ub-5",
      "ub-4",
      "ub-3",
    ]);
  });

  it("shows fewer than five when that is all that exists", () => {
    expect(
      selectRecentNotedBooks([
        { userBookId: "a", lastReadAt: "2026-09-01T00:00:00.000Z", updatedAt: null },
        { userBookId: "b", lastReadAt: null, updatedAt: "2026-08-01T00:00:00.000Z" },
      ])
    ).toHaveLength(2);
  });
});

describe("pickLatestNotePerBook", () => {
  it("keeps one newest note per book in requested order", () => {
    const latest = pickLatestNotePerBook(
      [
        { id: "old", user_book_id: "ub-1", created_at: "2026-07-01T00:00:00.000Z" },
        { id: "new", user_book_id: "ub-1", created_at: "2026-08-01T00:00:00.000Z" },
        { id: "other", user_book_id: "ub-2", created_at: "2026-08-02T00:00:00.000Z" },
      ],
      ["ub-2", "ub-1"]
    );

    expect([...latest.keys()]).toEqual(["ub-2", "ub-1"]);
    expect(latest.get("ub-1")?.id).toBe("new");
  });
});
