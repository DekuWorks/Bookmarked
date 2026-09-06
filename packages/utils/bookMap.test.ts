import { describe, expect, it } from "vitest";
import {
  BOOK_MAP_NAV_LABEL,
  filterBookMapPlaces,
  osMapsDirectionsUrl,
  shouldSearchOnPan,
} from "./bookMap";
import type { BookMapPlace } from "./mapProvider";

const strand: BookMapPlace = {
  id: "strand",
  name: "The Strand Bookstore",
  category: "bookstore",
  address_text: "828 Broadway",
  city: "New York",
  region: "NY",
  postal_code: "10003",
  country: "US",
  lat: 40.7332,
  lng: -73.9908,
  website: "https://www.strandbooks.com",
  phone: null,
  hours: null,
  verified: true,
  active: true,
  source: "curated",
};

describe("bookMap", () => {
  it("keeps a distinct Book Map label and does not search on every pan", () => {
    expect(BOOK_MAP_NAV_LABEL).toBe("Book Map");
    expect(shouldSearchOnPan()).toBe(false);
  });

  it("filters by category, city, and viewport", () => {
    const inactive = { ...strand, id: "closed", active: false };
    const cafe = { ...strand, id: "cafe", category: "reading_cafe" as const, city: "Portland" };
    expect(filterBookMapPlaces([strand, inactive, cafe], { category: "bookstore" })).toEqual([
      strand,
    ]);
    expect(filterBookMapPlaces([strand, cafe], { city: "portland" })).toEqual([cafe]);
    expect(
      filterBookMapPlaces([strand], {
        bounds: { minLat: 40.7, maxLat: 40.8, minLng: -74.1, maxLng: -73.9 },
      })
    ).toHaveLength(1);
  });

  it("opens OS maps for directions", () => {
    expect(osMapsDirectionsUrl(strand, "ios")).toMatch(/maps\.apple\.com/);
    expect(osMapsDirectionsUrl(strand, "web")).toMatch(/google\.com\/maps/);
  });
});
