/** Destinations that left the global nav and now live under Discover. Routes are unchanged. */

export const DISCOVER_DESTINATIONS = [
  {
    id: "library",
    label: "Library",
    description: "Browse your shelves",
    webHref: "/library/",
    mobileHref: "/library",
  },
  {
    id: "search",
    label: "Search",
    description: "Find books and readers",
    webHref: "/search/",
    mobileHref: "/search",
  },
  {
    id: "clubs",
    label: "Book Clubs",
    description: "Read with other people",
    webHref: "/clubs/",
    mobileHref: "/clubs",
  },
  {
    id: "events",
    label: "Events",
    description: "Upcoming reading events",
    webHref: "/events/",
    mobileHref: "/events",
  },
  {
    id: "book-map",
    label: "Book Map",
    description: "See where stories are set",
    webHref: "/book-map/",
    mobileHref: "/book-map",
  },
  {
    id: "messages",
    label: "Messages",
    description: "Your conversations",
    webHref: "/messages/",
    mobileHref: "/messages",
  },
] as const;

export type DiscoverDestinationId = (typeof DISCOVER_DESTINATIONS)[number]["id"];
