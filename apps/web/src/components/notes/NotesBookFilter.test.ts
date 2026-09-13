import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

describe("NotesBookFilter cover presentation", () => {
  it("does not render the saved-bookmark overlay on filter rows", () => {
    const source = readFileSync(
      resolve(root, "src/components/notes/NotesBookFilter.tsx"),
      "utf8"
    );
    expect(source).toContain("<BookCover");
    expect(source).not.toContain("bookmarkBadgeSize");
    // JSX prop on its own line — package import `@bookmarked/utils` is fine.
    expect(source).not.toMatch(/^\s+bookmarked\b/m);
  });
});
