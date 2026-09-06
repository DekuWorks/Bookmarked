import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_ELIGIBILITY_FLAGS } from "./homeEligibility";
import {
  applyReaderMapFilters,
  DEFAULT_READER_MAP_SETTINGS,
  publicClubNamesOnly,
  readerMapSocialAllowed,
} from "./readerMap";

describe("readerMap", () => {
  it("defaults discoverability off", () => {
    expect(DEFAULT_READER_MAP_SETTINGS.opted_in).toBe(false);
    expect(DEFAULT_READER_MAP_SETTINGS.discoverable).toBe(false);
  });

  it("excludes private clubs from public cards", () => {
    expect(
      publicClubNamesOnly([
        { name: "Public Pages", visibility: "public" },
        { name: "Secret Circle", visibility: "private" },
      ])
    ).toEqual(["Public Pages"]);
  });

  it("filters visible fields only", () => {
    const cards = [
      {
        user_id: "a",
        username: "a",
        display_name: "Ada",
        avatar_url: null,
        city_label: "Boston",
        college_label: null,
        personality_label: "Fantasy Lover",
        favorite_genres: ["Fantasy"],
        public_club_names: ["Public Pages"],
        coarse_lat: 42.35,
        coarse_lng: -71.06,
      },
    ];
    expect(applyReaderMapFilters(cards, { city: "Boston" })).toHaveLength(1);
    expect(applyReaderMapFilters(cards, { city: "Paris" })).toHaveLength(0);
  });

  it("downgrade-style loss of Home disables social eligibility", () => {
    expect(
      readerMapSocialAllowed({
        hasHome: false,
        settings: { ...DEFAULT_READER_MAP_SETTINGS, opted_in: true, discoverable: true },
        ageStatus: "eligible",
        flags: DEFAULT_HOME_ELIGIBILITY_FLAGS,
      })
    ).toBe(false);
  });
});
