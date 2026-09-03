import { describe, expect, it } from "vitest";
import {
  archiveCustomMoodTag,
  isBuiltinMoodTag,
  mergeMoodTags,
  validateCustomMoodTagName,
} from "./customMoodTags";

describe("customMoodTags", () => {
  it("rejects blank, too-long, and built-in names", () => {
    expect(validateCustomMoodTagName("  ").ok).toBe(false);
    expect(validateCustomMoodTagName("x".repeat(33)).ok).toBe(false);
    expect(validateCustomMoodTagName("Cozy").ok).toBe(false);
    expect(validateCustomMoodTagName("Rainy day")).toEqual({ ok: true, name: "Rainy day" });
  });

  it("does not treat built-in tags as deletable custom tags", () => {
    expect(isBuiltinMoodTag("Happy")).toBe(true);
  });

  it("merges active custom tags after built-ins", () => {
    expect(
      mergeMoodTags([
        { id: "1", name: "Rainy day" },
        { id: "2", name: "Gone", archivedAt: "2026-09-01T00:00:00.000Z" },
      ]).slice(-2)
    ).toEqual(["Cozy", "Rainy day"]);
  });

  it("archives without removing other tags", () => {
    const next = archiveCustomMoodTag(
      [{ id: "1", name: "Rainy day" }, { id: "2", name: "Hopeful" }],
      "1",
      "2026-09-03T00:00:00.000Z"
    );
    expect(next[0]?.archivedAt).toBe("2026-09-03T00:00:00.000Z");
    expect(next[1]?.archivedAt).toBeUndefined();
  });
});
