import { describe, expect, it } from "vitest";
import { moodLabelMatches, parseMoodSearchQuery } from "./moodDiscovery";

describe("mood discovery", () => {
  it("parses mood tag IDs and hash labels from a feed query", () => {
    const parsed = parseMoodSearchQuery("ocean mood:3f2a9c0e-1111-2222-3333-444455556666 #Cozy");
    expect(parsed.text).toBe("ocean");
    expect(parsed.moodIds).toEqual(["3f2a9c0e-1111-2222-3333-444455556666"]);
    expect(parsed.moodLabels).toEqual(["Cozy"]);
  });

  it("matches review feelings without a second taxonomy", () => {
    expect(moodLabelMatches(["Cozy", "Dark"], ["cozy"])).toBe(true);
    expect(moodLabelMatches(["Funny"], ["dark"])).toBe(false);
  });
});
