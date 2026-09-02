import { describe, expect, it } from "vitest";
import { SECTION_CARD_HEADING_CLASS } from "./sectionHeading";

describe("Overview section heading (iOS)", () => {
  it("reuses the puce-red section title token for Recent Activity", () => {
    expect(SECTION_CARD_HEADING_CLASS).toBe(
      "flex-shrink text-base font-bold leading-tight text-puce-red"
    );
    expect(SECTION_CARD_HEADING_CLASS).not.toContain("text-ink");
  });
});
