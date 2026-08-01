import { describe, expect, it } from "vitest";
import { formatNoteChapter, formatNoteLocation } from "./readingNotes";

describe("formatNoteChapter", () => {
  it("labels numeric chapters", () => {
    expect(formatNoteChapter("36")).toBe("Chapter 36");
  });

  it("does not duplicate existing chapter labels", () => {
    expect(formatNoteChapter("Chapter 36")).toBe("Chapter 36");
    expect(formatNoteChapter("Ch. 36")).toBe("Ch. 36");
  });

  it("trims and hides empty chapter values", () => {
    expect(formatNoteChapter("  Part II  ")).toBe("Chapter Part II");
    expect(formatNoteChapter("   ")).toBeNull();
    expect(formatNoteChapter(null)).toBeNull();
  });
});

describe("formatNoteLocation", () => {
  it("formats page and chapter with labels", () => {
    expect(formatNoteLocation({ pageNumber: 366, chapter: "36" })).toBe(
      "Page 366 • Chapter 36"
    );
  });

  it("supports database-shaped page_number input", () => {
    expect(formatNoteLocation({ page_number: 12, chapter: "Chapter 4" })).toBe(
      "Page 12 • Chapter 4"
    );
  });

  it("formats page-only locations", () => {
    expect(formatNoteLocation({ pageNumber: 366 })).toBe("Page 366");
  });

  it("formats chapter-only locations", () => {
    expect(formatNoteLocation({ chapter: "36" })).toBe("Chapter 36");
  });

  it("hides empty locations and separators", () => {
    expect(formatNoteLocation({ pageNumber: null, chapter: null })).toBeNull();
    expect(formatNoteLocation({ chapter: "" })).toBeNull();
  });

  it("preserves page zero when present", () => {
    expect(formatNoteLocation({ pageNumber: 0, chapter: "1" })).toBe(
      "Page 0 • Chapter 1"
    );
  });
});
