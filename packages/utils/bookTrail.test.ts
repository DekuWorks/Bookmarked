import { describe, expect, it } from "vitest";
import {
  applyBookTrailNoteEdit,
  bookTrailOpenAfterLoad,
  bookTrailSessionDisplay,
  bookTrailSessionDisplayText,
  BOOK_TRAIL_PREVIEW_LIMIT,
  filterBookTrailSessions,
  fullTrailBackTarget,
  initialBookTrailOpen,
  legacyTrailLocation,
  previewBookTrailSessions,
  sortBookTrailSessions,
  type BookTrailSession,
} from "./bookTrail";

function session(overrides: Partial<BookTrailSession> & Pick<BookTrailSession, "id">): BookTrailSession {
  return {
    created_at: "2026-01-01T00:00:00.000Z",
    session_date: "2026-01-01",
    user_book_id: "ub-1",
    note: null,
    mood: null,
    moods: [],
    page_start: 10,
    page_end: 20,
    pages_read: 10,
    percent_complete: 40,
    ...overrides,
  };
}

describe("book trail disclosure", () => {
  it("stays collapsed until trail=open, including after sessions load", () => {
    expect(initialBookTrailOpen(null)).toBe(false);
    expect(initialBookTrailOpen(undefined)).toBe(false);
    expect(initialBookTrailOpen("")).toBe(false);
    expect(bookTrailOpenAfterLoad(false, 12)).toBe(false);
    expect(initialBookTrailOpen("open")).toBe(true);
    expect(bookTrailOpenAfterLoad(true, 12)).toBe(true);
  });
});

describe("sortBookTrailSessions", () => {
  it("orders newest session day first and breaks timestamp ties with id", () => {
    const sorted = sortBookTrailSessions([
      session({ id: "a", created_at: "2026-01-01T00:00:00.000Z", session_date: "2026-01-01" }),
      session({ id: "c", created_at: "2026-02-01T00:00:00.000Z", session_date: "2026-01-01" }),
      session({ id: "b", created_at: "2026-01-01T00:00:00.000Z", session_date: "2026-01-01" }),
      session({ id: "d", created_at: "2026-03-01T00:00:00.000Z", session_date: "2026-03-01" }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("keeps a backdated session on its session_date", () => {
    const sorted = sortBookTrailSessions([
      session({
        id: "logged-late",
        created_at: "2026-10-01T00:00:00.000Z",
        session_date: "2026-01-02",
      }),
      session({
        id: "may-read",
        created_at: "2026-01-01T00:00:00.000Z",
        session_date: "2026-05-01",
      }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["may-read", "logged-late"]);
  });
});

describe("previewBookTrailSessions", () => {
  it("shows 5 of 12 and leaves the full list at 12", () => {
    const sessions = Array.from({ length: 12 }, (_, index) =>
      session({
        id: `s${String(index).padStart(2, "0")}`,
        created_at: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        session_date: `2026-01-${String(index + 1).padStart(2, "0")}`,
      })
    );
    const preview = previewBookTrailSessions(sessions, BOOK_TRAIL_PREVIEW_LIMIT);
    const full = sortBookTrailSessions(sessions);
    expect(preview.sessions).toHaveLength(5);
    expect(preview.total).toBe(12);
    expect(full).toHaveLength(12);
    expect(preview.sessions.map((item) => item.id)).toEqual(full.slice(0, 5).map((item) => item.id));
    expect(preview.sessions[0]?.id).toBe("s11");
  });
});

describe("book trail session display", () => {
  it("does not render a No Note or No Mood placeholder when both are empty", () => {
    const display = bookTrailSessionDisplay(
      session({ id: "empty", note: "  ", mood: null, moods: [] })
    );
    const text = bookTrailSessionDisplayText(display);
    expect(display.note).toBeNull();
    expect(display.moods).toEqual([]);
    expect(text).not.toMatch(/no note/i);
    expect(text).not.toMatch(/no mood/i);
    expect(text).toContain("Read pages 10 → 20");
  });

  it("uses listening time for an audiobook session", () => {
    const display = bookTrailSessionDisplay(
      session({
        id: "audio",
        session_format: "audiobook",
        page_start: 0,
        page_end: 0,
        pages_read: 0,
        listening_start_seconds: 6300,
        listening_end_seconds: 9000,
        listening_seconds: 2700,
      })
    );
    expect(display.summary).toBe("Listened from 1:45 to 2:30 · Listened for 45 minutes");
    expect(display.summary).not.toMatch(/page/i);
  });
});

describe("applyBookTrailNoteEdit", () => {
  it("does not change the date, progress, or session count", () => {
    const sessions = [
      session({ id: "s1", created_at: "2026-04-02T00:00:00.000Z", session_date: "2026-04-02" }),
      session({ id: "s2", created_at: "2026-04-01T00:00:00.000Z", session_date: "2026-04-01", note: "kept" }),
    ];
    const next = applyBookTrailNoteEdit(sessions, "s1", "  a note  ");
    expect(next).toHaveLength(sessions.length);
    expect(next.map((item) => item.id)).toEqual(["s1", "s2"]);
    expect(next[0]).toMatchObject({
      id: "s1",
      note: "a note",
      created_at: "2026-04-02T00:00:00.000Z",
      session_date: "2026-04-02",
      page_start: 10,
      page_end: 20,
      pages_read: 10,
      percent_complete: 40,
    });
    expect(next[1]).toEqual(sessions[1]);
    expect(sortBookTrailSessions(next).map((item) => item.id)).toEqual(
      sortBookTrailSessions(sessions).map((item) => item.id)
    );
  });
});

describe("filterBookTrailSessions", () => {
  it("keeps sessions for one user-book id", () => {
    const sessions = [
      session({ id: "mine", user_book_id: "ub-1" }),
      session({ id: "other", user_book_id: "ub-2" }),
    ];
    expect(filterBookTrailSessions(sessions, "ub-1").map((item) => item.id)).toEqual(["mine"]);
    expect(filterBookTrailSessions(sessions, "ub-2").map((item) => item.id)).toEqual(["other"]);
  });
});

describe("full trail navigation", () => {
  it("sends full-trail back to the same book with the trail expanded", () => {
    expect(fullTrailBackTarget("web", "book-1")).toEqual({
      href: "/book/?id=book-1&trail=open",
      bookId: "book-1",
      trailOpen: true,
    });
    expect(fullTrailBackTarget("mobile", "book-1")).toEqual({
      href: "/book/book-1?trail=open",
      bookId: "book-1",
      trailOpen: true,
    });
  });

  it("redirects an old trail link with a book, and falls back without one", () => {
    expect(legacyTrailLocation({ tab: "journal", bookId: "book-9", platform: "web" })).toEqual({
      href: "/book/?id=book-9&section=trail&trail=open",
      bookId: "book-9",
      trailOpen: true,
    });
    expect(legacyTrailLocation({ tab: "trail", bookId: null, platform: "mobile" })).toEqual({
      href: "/",
      bookId: null,
      trailOpen: false,
    });
    expect(legacyTrailLocation({ tab: "notes", bookId: "book-9", platform: "web" })).toBeNull();
  });
});
