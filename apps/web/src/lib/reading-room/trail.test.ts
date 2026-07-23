import { describe, expect, it } from "vitest";
import type { UserReadingSession } from "@/lib/services/readingSessions";
import {
  filterBookGroupsByQuery,
  groupSessionsByBook,
  groupSessionsByReadNumber,
  sessionSummary,
} from "./trail";

function session(
  overrides: Partial<UserReadingSession> & Pick<UserReadingSession, "id">
): UserReadingSession {
  return {
    user_id: "user-1",
    user_book_id: "ub-1",
    page_start: 0,
    page_end: 10,
    pages_read: 10,
    percent_complete: 25,
    note: null,
    mood: null,
    read_number: 1,
    created_at: "2026-01-01T12:00:00.000Z",
    bookTitle: "Dune",
    bookId: "book-1",
    ...overrides,
  };
}

describe("groupSessionsByBook", () => {
  it("groups sessions by book and sorts titles alphabetically", () => {
    const groups = groupSessionsByBook([
      session({ id: "s1", bookTitle: "Zebra", bookId: "z" }),
      session({ id: "s2", bookTitle: "Alpha", bookId: "a" }),
      session({ id: "s3", bookTitle: "Alpha", bookId: "a" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.bookTitle).toBe("Alpha");
    expect(groups[0]?.sessions).toHaveLength(2);
    expect(groups[1]?.bookTitle).toBe("Zebra");
  });
});

describe("filterBookGroupsByQuery", () => {
  it("filters book groups by case-insensitive title", () => {
    const groups = groupSessionsByBook([
      session({ id: "s1", bookTitle: "Dune", bookId: "dune" }),
      session({ id: "s2", bookTitle: "Hyperion", bookId: "hyperion" }),
    ]);

    expect(filterBookGroupsByQuery(groups, "dun")).toHaveLength(1);
    expect(filterBookGroupsByQuery(groups, "")).toHaveLength(2);
  });
});

describe("groupSessionsByReadNumber", () => {
  it("separates rereads and sorts newest read first", () => {
    const groups = groupSessionsByReadNumber([
      session({ id: "s1", read_number: 1, created_at: "2026-01-01T12:00:00.000Z" }),
      session({ id: "s2", read_number: 2, created_at: "2026-06-01T12:00:00.000Z" }),
      session({ id: "s3", read_number: 2, created_at: "2026-07-01T12:00:00.000Z" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.readNumber).toBe(2);
    expect(groups[0]?.sessions.map((s) => s.id)).toEqual(["s3", "s2"]);
    expect(groups[1]?.readNumber).toBe(1);
  });
});

describe("sessionSummary", () => {
  it("formats page ranges and single-page sessions", () => {
    expect(
      sessionSummary(
        session({ id: "s1", page_start: 40, page_end: 55, pages_read: 15, percent_complete: 50 })
      )
    ).toBe("Pages 40–55 · 15 pages");

    expect(
      sessionSummary(
        session({ id: "s2", page_start: 10, page_end: 10, pages_read: 1, percent_complete: 5 })
      )
    ).toBe("Page 10 · 5%");
  });
});
