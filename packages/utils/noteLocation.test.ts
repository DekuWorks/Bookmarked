import { describe, expect, it } from "vitest";
import { formatNoteLocation, HOME_NOTES_PREVIEW_LIMIT } from "./noteLocation";

describe("formatNoteLocation", () => {
  it("formats both page and chapter", () => {
    expect(
      formatNoteLocation({ pageNumber: 48, chapterNumber: 2 })
    ).toBe("Page 48 • Chapter 2");
    expect(
      formatNoteLocation({ pageNumber: 48, chapterNumber: "2" })
    ).toBe("Page 48 • Chapter 2");
  });

  it("formats page only", () => {
    expect(formatNoteLocation({ pageNumber: 48 })).toBe("Page 48");
    expect(formatNoteLocation({ pageNumber: 12, chapterNumber: null })).toBe(
      "Page 12"
    );
    expect(formatNoteLocation({ pageNumber: 12, chapterNumber: "  " })).toBe(
      "Page 12"
    );
  });

  it("formats chapter only", () => {
    expect(formatNoteLocation({ chapterNumber: 2 })).toBe("Chapter 2");
    expect(formatNoteLocation({ pageNumber: null, chapterNumber: "4" })).toBe(
      "Chapter 4"
    );
  });

  it("keeps string chapter labels", () => {
    expect(
      formatNoteLocation({ pageNumber: 1, chapterNumber: "Prologue" })
    ).toBe("Page 1 • Prologue");
    expect(formatNoteLocation({ chapterNumber: "Epilogue" })).toBe("Epilogue");
    expect(
      formatNoteLocation({ pageNumber: 10, chapterNumber: "Chapter 3" })
    ).toBe("Page 10 • Chapter 3");
  });

  it("returns null when both missing", () => {
    expect(formatNoteLocation({})).toBeNull();
    expect(formatNoteLocation({ pageNumber: null, chapterNumber: null })).toBeNull();
    expect(formatNoteLocation({ pageNumber: undefined, chapterNumber: "" })).toBeNull();
  });

  it("omits invalid page numbers", () => {
    expect(formatNoteLocation({ pageNumber: 0, chapterNumber: 2 })).toBe(
      "Chapter 2"
    );
    expect(formatNoteLocation({ pageNumber: -1 })).toBeNull();
    expect(formatNoteLocation({ pageNumber: Number.NaN, chapterNumber: "1" })).toBe(
      "Chapter 1"
    );
  });

  it("omits invalid chapter values", () => {
    expect(formatNoteLocation({ pageNumber: 5, chapterNumber: 0 })).toBe("Page 5");
    expect(formatNoteLocation({ pageNumber: 5, chapterNumber: "null" })).toBe(
      "Page 5"
    );
    expect(formatNoteLocation({ pageNumber: 5, chapterNumber: "undefined" })).toBe(
      "Page 5"
    );
    expect(formatNoteLocation({ chapterNumber: -3 })).toBeNull();
  });

  it("handles dotted chapter numbers", () => {
    expect(
      formatNoteLocation({ pageNumber: 20, chapterNumber: "2.1" })
    ).toBe("Page 20 • Chapter 2.1");
  });

  it("shows audiobook timestamps instead of a fake page or chapter", () => {
    expect(formatNoteLocation({ chapterNumber: "1:23:45" })).toBe("1:23:45");
    expect(formatNoteLocation({ chapterNumber: "12:34" })).toBe("12:34");
    expect(
      formatNoteLocation({ pageNumber: 3720, chapterNumber: "1:02:03" })
    ).toBe("1:02:03");
  });
});

describe("HOME_NOTES_PREVIEW_LIMIT", () => {
  it("is five", () => {
    expect(HOME_NOTES_PREVIEW_LIMIT).toBe(5);
  });
});
