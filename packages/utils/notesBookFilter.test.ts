import { describe, expect, it } from "vitest";
import { HOME_NOTES_PREVIEW_LIMIT } from "./noteLocation";
import {
  NOTES_BOOK_FILTER_COPY,
  NOTES_BOOK_QUERY_PARAM,
  buildNotesBookFilterOptions,
  filterNotesBookOptionsByQuery,
  filterNotesByUserBookId,
  formatNotesBookCount,
  matchNotesBookFilter,
  notesBookFilterLabel,
  notesEmptyMessage,
  parseNotesBookQueryParam,
  selectNotesForBookFilter,
  sortNotesForBookFilter,
  type NotesBookFilterNote,
  type NotesBookFilterOption,
} from "./notesBookFilter";

function note(
  overrides: Partial<NotesBookFilterNote> &
    Pick<NotesBookFilterNote, "id" | "user_book_id" | "created_at">
): NotesBookFilterNote {
  return {
    book: {
      id: "catalog-dune",
      title: "Dune",
      author: "Frank Herbert",
      cover_url: "https://covers.example/dune.jpg",
    },
    ...overrides,
  };
}

const duneA = note({
  id: "n1",
  user_book_id: "ub-dune",
  created_at: "2026-03-01T12:00:00.000Z",
});
const duneB = note({
  id: "n2",
  user_book_id: "ub-dune",
  created_at: "2026-03-03T12:00:00.000Z",
});
const circe = note({
  id: "n3",
  user_book_id: "ub-circe",
  created_at: "2026-03-02T12:00:00.000Z",
  book: {
    id: "catalog-circe",
    title: "Circe",
    author: "Madeline Miller",
    cover_url: null,
  },
});

describe("parseNotesBookQueryParam", () => {
  it("treats empty or whitespace as All Books", () => {
    expect(parseNotesBookQueryParam(null)).toBeNull();
    expect(parseNotesBookQueryParam(undefined)).toBeNull();
    expect(parseNotesBookQueryParam("")).toBeNull();
    expect(parseNotesBookQueryParam("   ")).toBeNull();
  });

  it("keeps a stable id string", () => {
    expect(parseNotesBookQueryParam(" ub-dune ")).toBe("ub-dune");
  });
});

describe("matchNotesBookFilter", () => {
  const options: NotesBookFilterOption[] = [
    {
      userBookId: "ub-dune",
      bookId: "catalog-dune",
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: null,
      noteCount: 2,
    },
    {
      userBookId: "ub-dune-hc",
      bookId: "catalog-dune",
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: null,
      noteCount: 1,
    },
    {
      userBookId: "ub-circe",
      bookId: "catalog-circe",
      title: "Circe",
      author: "Madeline Miller",
      coverUrl: null,
      noteCount: 1,
    },
  ];

  it("matches the user_book_id, not the title string", () => {
    expect(matchNotesBookFilter("ub-dune", options)).toBe("ub-dune");
    expect(matchNotesBookFilter("Dune", options)).toBeNull();
  });

  it("accepts a unique catalog book_id deep link", () => {
    expect(matchNotesBookFilter("catalog-circe", options)).toBe("ub-circe");
  });

  it("does not mix editions that share a catalog book_id", () => {
    expect(matchNotesBookFilter("catalog-dune", options)).toBeNull();
  });

  it("defaults to All Books when the id is unknown", () => {
    expect(matchNotesBookFilter("ub-missing", options)).toBeNull();
    expect(matchNotesBookFilter(null, options)).toBeNull();
  });
});

describe("buildNotesBookFilterOptions", () => {
  it("groups by user_book_id, counts notes, and sorts A→Z by title", () => {
    const options = buildNotesBookFilterOptions([duneA, circe, duneB]);
    expect(options.map((option) => option.userBookId)).toEqual([
      "ub-circe",
      "ub-dune",
    ]);
    expect(options[1]).toMatchObject({
      userBookId: "ub-dune",
      bookId: "catalog-dune",
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: "https://covers.example/dune.jpg",
      noteCount: 2,
    });
  });

  it("does not use title as the grouping key", () => {
    const otherDune = note({
      id: "n4",
      user_book_id: "ub-dune-other",
      created_at: "2026-03-04T12:00:00.000Z",
      book: {
        id: "catalog-dune-other",
        title: "Dune",
        author: "Frank Herbert",
        cover_url: null,
      },
    });
    const options = buildNotesBookFilterOptions([duneA, otherDune]);
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.userBookId).sort()).toEqual([
      "ub-dune",
      "ub-dune-other",
    ]);
  });
});

describe("filterNotesBookOptionsByQuery", () => {
  const options = buildNotesBookFilterOptions([duneA, circe]);

  it("matches title or author case-insensitively", () => {
    expect(filterNotesBookOptionsByQuery(options, "DUNE")).toHaveLength(1);
    expect(filterNotesBookOptionsByQuery(options, "miller")).toHaveLength(1);
    expect(filterNotesBookOptionsByQuery(options, "   ")).toHaveLength(2);
  });
});

describe("filter and sort notes", () => {
  const notes = [duneB, circe, duneA];

  it("keeps All Books newest-first and does not drop other books", () => {
    const sorted = sortNotesForBookFilter(notes, null);
    expect(sorted.map((item) => item.id)).toEqual(["n2", "n3", "n1"]);
    expect(filterNotesByUserBookId(notes, null)).toHaveLength(3);
  });

  it("filters by user_book_id and sorts that book oldest → newest", () => {
    const filtered = filterNotesByUserBookId(notes, "ub-dune");
    expect(filtered.map((item) => item.id).sort()).toEqual(["n1", "n2"]);
    expect(sortNotesForBookFilter(filtered, "ub-dune").map((item) => item.id)).toEqual([
      "n1",
      "n2",
    ]);
  });

  it("never matches a title string as a user-book id", () => {
    expect(filterNotesByUserBookId(notes, "Dune")).toEqual([]);
  });
});

describe("selectNotesForBookFilter", () => {
  it("caps All Books with the Home preview limit, newest first", () => {
    const notes = Array.from({ length: 7 }, (_, index) =>
      note({
        id: `n-${index}`,
        user_book_id: `ub-${index}`,
        created_at: `2026-03-0${index + 1}T12:00:00.000Z`,
        book: {
          id: `catalog-${index}`,
          title: `Book ${index}`,
          author: null,
          cover_url: null,
        },
      })
    );
    const selected = selectNotesForBookFilter(notes, null);
    expect(selected).toHaveLength(HOME_NOTES_PREVIEW_LIMIT);
    expect(selected[0]?.id).toBe("n-6");
  });

  it("returns every note for a selected book in chronological order", () => {
    const selected = selectNotesForBookFilter([duneB, circe, duneA], "ub-dune");
    expect(selected.map((item) => item.id)).toEqual(["n1", "n2"]);
  });
});

describe("copy and labels", () => {
  it("uses All Books vs selected-book empty copy", () => {
    expect(notesEmptyMessage(null)).toBe(NOTES_BOOK_FILTER_COPY.emptyAll);
    expect(notesEmptyMessage("ub-dune")).toBe(NOTES_BOOK_FILTER_COPY.emptyBook);
  });

  it("labels the control from the selected title", () => {
    const options = buildNotesBookFilterOptions([duneA, circe]);
    expect(notesBookFilterLabel(null, options)).toBe(NOTES_BOOK_FILTER_COPY.allBooks);
    expect(notesBookFilterLabel("ub-circe", options)).toBe("Circe");
  });

  it("formats note counts and keeps the query key stable", () => {
    expect(formatNotesBookCount(1)).toBe("1 note");
    expect(formatNotesBookCount(3)).toBe("3 notes");
    expect(NOTES_BOOK_QUERY_PARAM).toBe("book");
  });
});
