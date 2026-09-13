import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

describe("Overview View Shelf back navigation", () => {
  it("keeps a single origin-aware header back on built-in shelves", () => {
    const source = readFileSync(resolve(root, "app/(app)/library/[shelf].tsx"), "utf8");
    expect(source).toContain("ScreenHeader");
    expect(source).toContain("originBackHref");
    expect(source).not.toContain("Back to Overview");
    expect(source).not.toContain("originBackLink");
    expect(source).not.toMatch(/\/home["'`]/);
  });
});

describe("Notes Filter by Books cover", () => {
  it("does not show the oversized saved bookmark on filter rows", () => {
    const source = readFileSync(
      resolve(root, "src/components/reading-room/NotesBookFilterSheet.tsx"),
      "utf8"
    );
    expect(source).toContain("<BookCover");
    expect(source).not.toMatch(/\bsaved\b/);
  });
});
