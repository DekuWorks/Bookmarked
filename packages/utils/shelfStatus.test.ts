import { describe, expect, it } from "vitest";
import {
  buildUserBookShelfPatch,
  countsTowardFinishedStats,
  isBuiltInShelfStatus,
} from "./shelfStatus";

describe("buildUserBookShelfPatch", () => {
  const now = "2026-08-01T12:00:00.000Z";

  it("sets dnf true and clears finished_at when moving to DNF", () => {
    expect(
      buildUserBookShelfPatch({
        shelfStatus: "dnf",
        existingStartedAt: "2026-07-01T00:00:00.000Z",
        now,
      })
    ).toEqual({
      shelf_status: "dnf",
      dnf: true,
      updated_at: now,
      finished_at: null,
    });
  });

  it("clears dnf when moving from DNF to Currently Reading", () => {
    const patch = buildUserBookShelfPatch({
      shelfStatus: "currently_reading",
      existingStartedAt: null,
      now,
    });
    expect(patch.dnf).toBe(false);
    expect(patch.shelf_status).toBe("currently_reading");
    expect(patch.started_at).toBe(now);
    expect(patch).not.toHaveProperty("finished_at");
  });

  it("does not reset started_at when already started", () => {
    const patch = buildUserBookShelfPatch({
      shelfStatus: "currently_reading",
      existingStartedAt: "2026-06-01T00:00:00.000Z",
      now,
    });
    expect(patch.started_at).toBeUndefined();
  });

  it("preserves progress fields by omission (no progress keys in patch)", () => {
    const patch = buildUserBookShelfPatch({ shelfStatus: "dnf", now });
    expect(patch).not.toHaveProperty("progress_pages");
    expect(patch).not.toHaveProperty("progress_percent");
    expect(patch).not.toHaveProperty("completion_tags");
  });
});

describe("countsTowardFinishedStats", () => {
  it("counts Finished shelf books that are not DNF", () => {
    expect(countsTowardFinishedStats({ shelf_status: "read", dnf: false })).toBe(true);
  });

  it("excludes DNF shelf and dnf-flagged rows", () => {
    expect(countsTowardFinishedStats({ shelf_status: "dnf", dnf: true })).toBe(false);
    expect(countsTowardFinishedStats({ shelf_status: "read", dnf: true })).toBe(false);
    expect(countsTowardFinishedStats({ shelf_status: "currently_reading" })).toBe(false);
  });
});

describe("isBuiltInShelfStatus", () => {
  it("accepts the four built-in statuses including dnf", () => {
    expect(isBuiltInShelfStatus("dnf")).toBe(true);
    expect(isBuiltInShelfStatus("custom")).toBe(false);
  });
});
