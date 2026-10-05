import { describe, expect, it } from "vitest";
import { DISCOVER_DESTINATIONS } from "./discoverDestinations";

describe("discover destinations", () => {
  it("keeps the routes that left the global nav", () => {
    expect(DISCOVER_DESTINATIONS.map((item) => item.label)).toEqual([
      "Library",
      "Search",
      "Book Clubs",
      "Events",
      "Book Map",
      "Messages",
    ]);
    expect(DISCOVER_DESTINATIONS.map((item) => item.webHref)).toEqual([
      "/library/",
      "/search/",
      "/clubs/",
      "/events/",
      "/book-map/",
      "/messages/",
    ]);
  });
});
