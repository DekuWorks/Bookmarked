import { describe, expect, it } from "vitest";
import { resolveNoteTagTone } from "./noteTag";

describe("resolveNoteTagTone", () => {
  it("prefers stored custom hex color", () => {
    const tone = resolveNoteTagTone({
      label: "Mine",
      color: "#FF0000",
      category: "favorite_quote",
      isCustom: true,
    });
    expect(tone.background.toLowerCase()).toBe("#ff0000");
    expect(tone.text).toMatch(/^#/);
  });

  it("uses category default when no stored color", () => {
    const tone = resolveNoteTagTone({
      label: "Quote",
      category: "favorite_quote",
    });
    expect(tone.background.toLowerCase()).toBe("#fef3c7");
  });

  it("falls back to Bookmarked purple", () => {
    const tone = resolveNoteTagTone({ label: "Mood" });
    expect(tone.border.toLowerCase()).toBe("#b89dbb");
  });

  it("treats custom without category as purple", () => {
    const tone = resolveNoteTagTone({ label: "Custom", isCustom: true });
    expect(tone.border.toLowerCase()).toBe("#b89dbb");
  });
});
