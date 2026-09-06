import { describe, expect, it } from "vitest";
import { isQuoteTitleRequired, noteContentIsValid } from "./quoteTitle";

describe("quote title", () => {
  it("is not required for create or edit", () => {
    expect(isQuoteTitleRequired()).toBe(false);
    expect(noteContentIsValid({ quote: "A line", title: "" })).toBe(true);
    expect(noteContentIsValid({ note: "A thought", title: null })).toBe(true);
    expect(noteContentIsValid({ title: "Only a title" })).toBe(false);
  });
});
