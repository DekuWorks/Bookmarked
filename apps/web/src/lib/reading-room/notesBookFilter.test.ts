import { describe, expect, it } from "vitest";
import {
  matchNotesBookFilter,
  parseNotesBookQueryParam,
  sortNotesForBookFilter,
} from "@bookmarked/utils/notesBookFilter";

describe("web notes book query state", () => {
  it("parses book= as a stable id", () => {
    expect(parseNotesBookQueryParam("ub-123")).toBe("ub-123");
    expect(parseNotesBookQueryParam("")).toBeNull();
  });

  it("resolves catalog book_id only when unique", () => {
    const options = [
      {
        userBookId: "ub-a",
        bookId: "book-a",
        title: "A",
        author: null,
        coverUrl: null,
        noteCount: 1,
      },
      {
        userBookId: "ub-b1",
        bookId: "book-b",
        title: "B Hardcover",
        author: null,
        coverUrl: null,
        noteCount: 1,
      },
      {
        userBookId: "ub-b2",
        bookId: "book-b",
        title: "B Paperback",
        author: null,
        coverUrl: null,
        noteCount: 1,
      },
    ];
    expect(matchNotesBookFilter("book-a", options)).toBe("ub-a");
    expect(matchNotesBookFilter("book-b", options)).toBeNull();
    expect(matchNotesBookFilter("ub-b2", options)).toBe("ub-b2");
  });

  it("keeps All Books newest-first", () => {
    const sorted = sortNotesForBookFilter(
      [
        { created_at: "2026-01-01T00:00:00.000Z" },
        { created_at: "2026-01-03T00:00:00.000Z" },
      ],
      null
    );
    expect(sorted[0]?.created_at).toBe("2026-01-03T00:00:00.000Z");
  });
});
