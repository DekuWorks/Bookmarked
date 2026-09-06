import { haversineKm } from "./locationPrivacy";
import type { BookMapCategory, BookMapListQuery, BookMapPlace, GeoPoint } from "./mapProvider";

export type BookMapFilter = "all" | BookMapCategory;

export const BOOK_MAP_FILTERS: { id: BookMapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bookstore", label: "Bookstore" },
  { id: "library", label: "Library" },
  { id: "reading_cafe", label: "Café" },
];

/** Distinct from Overview/Home nav. Do not rename the primary Home tab. */
export const BOOK_MAP_NAV_LABEL = "Book Map";
export const HOME_HUB_NAV_LABEL = "Home Hub";
export const HOME_MEMBERSHIP_LABEL = "Bookmarked Home membership";

export const BOOK_MAP_EMPTY_CAFE_COPY =
  "Reading cafés appear only when a place is explicitly qualified. That definition is still an open product decision.";

export function filterBookMapPlaces(
  places: readonly BookMapPlace[],
  query: BookMapListQuery
): BookMapPlace[] {
  return places.filter((place) => {
    if (!place.active) return false;
    if (query.category && query.category !== "all" && place.category !== query.category) {
      return false;
    }
    if (query.bounds) {
      const { minLat, maxLat, minLng, maxLng } = query.bounds;
      if (place.lat < minLat || place.lat > maxLat || place.lng < minLng || place.lng > maxLng) {
        return false;
      }
    }
    if (query.city) {
      const city = place.city?.toLocaleLowerCase() ?? "";
      if (!city.includes(query.city.trim().toLocaleLowerCase())) return false;
    }
    if (query.postalCode) {
      const zip = place.postal_code?.replace(/\s+/g, "") ?? "";
      if (!zip.includes(query.postalCode.replace(/\s+/g, ""))) return false;
    }
    if (query.text) {
      const hay = `${place.name} ${place.city ?? ""} ${place.address_text ?? ""}`.toLocaleLowerCase();
      if (!hay.includes(query.text.trim().toLocaleLowerCase())) return false;
    }
    return true;
  });
}

export function sortPlacesByDistance(places: readonly BookMapPlace[], near: GeoPoint): BookMapPlace[] {
  return [...places].sort(
    (a, b) =>
      haversineKm({ lat: a.lat, lng: a.lng }, near) - haversineKm({ lat: b.lat, lng: b.lng }, near)
  );
}

export function appleMapsDirectionsUrl(place: Pick<BookMapPlace, "lat" | "lng" | "name">): string {
  const q = encodeURIComponent(place.name);
  return `https://maps.apple.com/?daddr=${place.lat},${place.lng}&q=${q}`;
}

export function googleMapsDirectionsUrl(place: Pick<BookMapPlace, "lat" | "lng" | "name">): string {
  const q = encodeURIComponent(place.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=&travelmode=walking&dir_action=navigate&q=${q}`;
}

export function osMapsDirectionsUrl(
  place: Pick<BookMapPlace, "lat" | "lng" | "name">,
  platform: "ios" | "web" | "android" = "web"
): string {
  return platform === "ios" ? appleMapsDirectionsUrl(place) : googleMapsDirectionsUrl(place);
}

export const BOOK_MAP_PLACE_REPORT_REASONS = [
  "closed",
  "wrong_info",
  "duplicate",
  "incorrect",
  "inappropriate_place",
] as const;

export type BookMapPlaceReportReason = (typeof BOOK_MAP_PLACE_REPORT_REASONS)[number];

export const BOOK_MAP_PLACE_REPORT_LABELS: Record<BookMapPlaceReportReason, string> = {
  closed: "Closed or moved",
  wrong_info: "Wrong details",
  duplicate: "Duplicate listing",
  incorrect: "Incorrect place",
  inappropriate_place: "Inappropriate",
};

/** Search This Area is explicit — do not refetch on every pan. */
export function shouldSearchOnPan(): boolean {
  return false;
}

export function placeCardFields(place: BookMapPlace): {
  name: string;
  category: BookMapCategory;
  address: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  hours: Record<string, unknown> | null;
  verified: boolean;
} {
  return {
    name: place.name,
    category: place.category,
    address: place.address_text,
    city: place.city,
    website: place.website,
    phone: place.phone,
    hours: place.hours,
    verified: place.verified,
  };
}
