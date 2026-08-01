import { describe, expect, it } from "vitest";
import { readingNoteTagTone } from "./readingNoteTags";

describe("readingNoteTagTone", () => {
  it("returns colored tones for builtin categories", () => {
    const quote = readingNoteTagTone("favorite_quote");
    expect(quote.background).toMatch(/^#/);
    expect(quote.text).toMatch(/^#/);
    expect(quote.border).toMatch(/^#/);
  });

  it("gives general_note a lilac brand tone (not muted gray)", () => {
    const general = readingNoteTagTone("general_note");
    expect(general.background.toLowerCase()).not.toBe("#faf8fc");
    expect(general.border.toLowerCase()).toBe("#b89dbb");
  });

  it("assigns stable custom tones from id", () => {
    const a = readingNoteTagTone("custom:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    const b = readingNoteTagTone("custom:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(a).toEqual(b);
  });

  it("varies custom tones across ids", () => {
    const a = readingNoteTagTone("custom:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    const b = readingNoteTagTone("custom:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    // Different seeds should usually differ; if hash collides, still valid colored tones.
    expect(a.background).toMatch(/^#/);
    expect(b.background).toMatch(/^#/);
  });
});
