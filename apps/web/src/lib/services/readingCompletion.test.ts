import { describe, expect, it } from "vitest";
import {
  buildCompletionSessionPatch,
  buildCompletionUserBookPatch,
  countResolvedPagesRead,
  resolvePageCount,
  validateManualPageCount,
} from "@/lib/utils/readingCompletion";

describe("validateManualPageCount", () => {
  it("rejects zero and negative values", () => {
    expect(validateManualPageCount(0).ok).toBe(false);
    expect(validateManualPageCount(-5).ok).toBe(false);
  });

  it("accepts positive integers", () => {
    expect(validateManualPageCount("384")).toEqual({ ok: true, value: 384 });
  });
});

describe("resolvePageCount", () => {
  it("prefers user-selected edition page count", () => {
    expect(
      resolvePageCount({
        editionSelected: true,
        editionPageCount: 320,
        catalogPageCount: 500,
      })
    ).toEqual({
      totalPages: 320,
      pageCountStatus: "known",
      pageCountSource: "edition",
    });
  });

  it("uses catalog page count when edition not selected", () => {
    expect(
      resolvePageCount({
        editionSelected: false,
        catalogPageCount: 412,
      })
    ).toEqual({
      totalPages: 412,
      pageCountStatus: "known",
      pageCountSource: "canonical_book",
    });
  });

  it("returns missing when no page metadata exists", () => {
    expect(resolvePageCount({ previousPage: 0 })).toEqual({
      totalPages: null,
      pageCountStatus: "missing",
      pageCountSource: "unavailable",
    });
  });
});

describe("completion patches", () => {
  it("does not fabricate pages for missing page count", () => {
    const resolution = resolvePageCount({ previousPage: 0 });
    const userPatch = buildCompletionUserBookPatch({
      finishedAt: "2026-07-23T12:00:00.000Z",
      previousPage: 0,
      resolution,
    });
    expect(userPatch.progress_percent).toBe(100);
    expect(userPatch.progress_pages).toBe(0);

    const sessionPatch = buildCompletionSessionPatch({
      previousPage: 0,
      resolution,
      editionId: "book-1",
      finishedAt: "2026-07-23T12:00:00.000Z",
    });
    expect(sessionPatch.pages_read).toBe(0);
    expect(sessionPatch.total_pages).toBeNull();
    expect(sessionPatch.page_count_status).toBe("missing");
  });

  it("stores resolved pages for known counts", () => {
    const resolution = resolvePageCount({ catalogPageCount: 384, previousPage: 0 });
    const sessionPatch = buildCompletionSessionPatch({
      previousPage: 0,
      resolution,
      editionId: "book-1",
      finishedAt: "2026-07-23T12:00:00.000Z",
    });
    expect(sessionPatch.pages_read).toBe(384);
    expect(sessionPatch.total_pages).toBe(384);
  });
});

describe("countResolvedPagesRead", () => {
  it("excludes read books with zero resolved pages", () => {
    expect(
      countResolvedPagesRead([
        { shelf_status: "read", progress_pages: 0 },
        { shelf_status: "read", progress_pages: 200 },
        { shelf_status: "currently_reading", progress_pages: 50 },
      ])
    ).toBe(200);
  });
});
