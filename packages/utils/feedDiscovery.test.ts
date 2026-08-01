import { describe, expect, it } from "vitest";
import { buildFeedDiscoveryMarkers, interleaveFeedWithDiscovery } from "./feedDiscovery";

describe("buildFeedDiscoveryMarkers", () => {
  it("places markers for an empty feed", () => {
    const markers = buildFeedDiscoveryMarkers(0);
    expect(markers.map((m) => m.id)).toEqual(["trending", "shelved", "reviewed"]);
  });

  it("spreads markers through a longer feed", () => {
    const markers = buildFeedDiscoveryMarkers(12);
    expect(markers).toHaveLength(3);
    expect(markers[0]!.afterIndex).toBeLessThan(markers[1]!.afterIndex);
  });
});

describe("interleaveFeedWithDiscovery", () => {
  it("keeps items and inserts discovery cards", () => {
    const items = ["a", "b", "c", "d", "e", "f"];
    const mixed = interleaveFeedWithDiscovery(items);
    const discoveryCount = mixed.filter((row) => row.kind === "discovery").length;
    const itemCount = mixed.filter((row) => row.kind === "item").length;
    expect(itemCount).toBe(6);
    expect(discoveryCount).toBe(3);
  });
});
