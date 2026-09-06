import { describe, expect, it } from "vitest";
import {
  coarsenLatLng,
  formatPublicDistanceKm,
  publicSelectHasPreciseCoords,
  READER_MAP_DEFAULT_OPT_IN,
  shouldDropPreciseLocation,
  toPublicReaderMarker,
} from "./locationPrivacy";

describe("locationPrivacy", () => {
  it("defaults Reader Map opt-in to off", () => {
    expect(READER_MAP_DEFAULT_OPT_IN).toBe(false);
  });

  it("coarsens precise coords so a home cannot be inferred", () => {
    const home = coarsenLatLng(40.733182, -73.990837, "city", "user-1");
    expect(Math.abs(home.coarse_lat - 40.733182)).toBeGreaterThan(0.001);
    expect(publicSelectHasPreciseCoords(home)).toBe(false);

    const publicMarker = toPublicReaderMarker({
      user_id: "user-1",
      coarse_lat: home.coarse_lat,
      coarse_lng: home.coarse_lng,
      city_label: "New York",
      precise_lat: 40.733182,
      precise_lng: -73.990837,
    });
    expect(publicMarker).not.toHaveProperty("precise_lat");
    expect(publicSelectHasPreciseCoords(publicMarker)).toBe(false);
  });

  it("never formats public distance in feet", () => {
    expect(formatPublicDistanceKm(0.04)).toBe("In your area");
    expect(formatPublicDistanceKm(12)).toBe("Nearby city");
    expect(JSON.stringify(formatPublicDistanceKm(0.04))).not.toMatch(/feet|ft\b/i);
  });

  it("drops precise GPS after the short retention window", () => {
    const captured = new Date("2026-09-06T12:00:00.000Z");
    expect(
      shouldDropPreciseLocation(captured, captured.getTime() + 16 * 60 * 1000)
    ).toBe(true);
    expect(
      shouldDropPreciseLocation(captured, captured.getTime() + 2 * 60 * 1000)
    ).toBe(false);
  });
});
