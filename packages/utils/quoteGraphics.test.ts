import { describe, expect, it } from "vitest";
import {
  buildQuoteGraphicAttribution,
  buildQuoteGraphicBookOptions,
  isQuoteGraphicEligibleNote,
  quoteGraphicSnippet,
  quotesForSelectedBook,
} from "./quoteGraphics";

const likeness = {
  id: "note-1",
  user_book_id: "ub-1",
  quote: "I am not a girl who can be loved.",
  book: { id: "book-1", title: "The Likeness", author: "Tana French", cover_url: null },
};

describe("quoteGraphics", () => {
  it("treats any saved quote as eligible, favorite or not", () => {
    expect(isQuoteGraphicEligibleNote({ quote: "  hello  " })).toBe(true);
    expect(isQuoteGraphicEligibleNote({ quote: "   " })).toBe(false);
    expect(isQuoteGraphicEligibleNote({ quote: null })).toBe(false);
  });

  it("builds book options only from notes that have quotes", () => {
    const options = buildQuoteGraphicBookOptions([
      likeness,
      { id: "note-2", user_book_id: "ub-1", quote: "Another line", book: likeness.book },
      { id: "note-3", user_book_id: "ub-2", quote: null, book: { id: "book-2", title: "Empty" } },
    ]);
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      userBookId: "ub-1",
      bookId: "book-1",
      title: "The Likeness",
      noteCount: 2,
    });
  });

  it("loads every saved quote for the selected book", () => {
    const notes = [
      likeness,
      { ...likeness, id: "note-2", quote: "Second" },
      { id: "note-3", user_book_id: "ub-2", quote: "Other book", book: { id: "x", title: "X" } },
    ];
    expect(quotesForSelectedBook(notes, "ub-1").map((note) => note.id)).toEqual([
      "note-1",
      "note-2",
    ]);
    expect(quotesForSelectedBook(notes, null)).toEqual([]);
  });

  it("builds attribution from book title and author", () => {
    expect(buildQuoteGraphicAttribution(likeness)).toBe("The Likeness — Tana French");
  });

  it("snips long quotes for vault cards", () => {
    expect(quoteGraphicSnippet("Short")).toBe("Short");
    expect(quoteGraphicSnippet("x".repeat(100)).endsWith("…")).toBe(true);
  });
});
