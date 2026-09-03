import { describe, expect, it } from "vitest";
import {
  NOTES_BOOK_FILTER_COPY,
  buildNotesBookFilterOptions,
  filterNotesByUserBookId,
  matchNotesBookFilter,
  selectNotesForBookFilter,
  sortNotesForBookFilter,
} from "../../../../packages/utils/notesBookFilter";

const notes = [
  {
    id: "newer",
    user_book_id: "ub-1",
    created_at: "2026-04-02T00:00:00.000Z",
    book: { id: "b1", title: "Circe", author: "Madeline Miller", cover_url: null },
  },
  {
    id: "older",
    user_book_id: "ub-1",
    created_at: "2026-04-01T00:00:00.000Z",
    book: { id: "b1", title: "Circe", author: "Madeline Miller", cover_url: null },
  },
  {
    id: "other",
    user_book_id: "ub-2",
    created_at: "2026-04-03T00:00:00.000Z",
    book: { id: "b2", title: "Dune", author: "Frank Herbert", cover_url: null },
  },
];

describe("iOS notes book filter", () => {
  it("filters by user_book_id and sorts a selected book oldest first", () => {
    const options = buildNotesBookFilterOptions(notes);
    expect(matchNotesBookFilter("ub-1", options)).toBe("ub-1");
    expect(matchNotesBookFilter("Circe", options)).toBeNull();
    expect(filterNotesByUserBookId(notes, "ub-1").map((note) => note.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(sortNotesForBookFilter(notes, null).map((note) => note.id)).toEqual([
      "other",
      "newer",
      "older",
    ]);
    expect(selectNotesForBookFilter(notes, "ub-1").map((note) => note.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("uses the shared empty copy", () => {
    expect(NOTES_BOOK_FILTER_COPY.emptyAll).toBe("You haven't saved any notes yet.");
    expect(NOTES_BOOK_FILTER_COPY.emptyBook).toBe("No notes saved for this book yet.");
  });
});
