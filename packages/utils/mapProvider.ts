/**
 * Map / place / Book Map abstractions.
 * Do not call a vendor SDK from screens — go through these interfaces.
 *
 * Repo audit (2026-09-06): no Mapbox, Apple Maps SDK, Google Maps SDK,
 * Amazon Location, Leaflet, or react-native-maps is wired.
 * Default implementation uses OSM tiles + curated place rows.
 * Product can swap ACTIVE_MAP_PROVIDER later without rewriting UI.
 */

export type MapProviderId =
  | "osm_tiles"
  | "amazon_location"
  | "mapbox"
  | "apple_maps"
  | "google";

/** Default until product picks a production vendor. Not an Amazon Location install. */
export const ACTIVE_MAP_PROVIDER: MapProviderId = "osm_tiles";

export type GeoPoint = { lat: number; lng: number };

export type MapViewport = {
  center: GeoPoint;
  zoom: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
};

export type MapMarkerKind = "bookstore" | "library" | "reading_cafe" | "reader" | "meetup";

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  point: GeoPoint;
  label: string;
};

export type TileCoord = { x: number; y: number; z: number };

export type MapProvider = {
  id: MapProviderId;
  tileUrl: (tile: TileCoord) => string;
  attribution: string;
};

export const OSM_TILE_PROVIDER: MapProvider = {
  id: "osm_tiles",
  tileUrl: ({ x, y, z }) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  attribution: "© OpenStreetMap contributors",
};

export function resolveMapProvider(id: MapProviderId = ACTIVE_MAP_PROVIDER): MapProvider {
  if (id === "osm_tiles") return OSM_TILE_PROVIDER;
  // Other vendors are not wired. Keep the OSM fallback so UI never hardcodes SDK calls.
  return OSM_TILE_PROVIDER;
}

export function latLngToTile(lat: number, lng: number, zoom: number): TileCoord {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z: zoom };
}

export function viewportFromCenter(center: GeoPoint, zoom: number, padDeg = 0.25): MapViewport {
  return {
    center,
    zoom,
    bounds: {
      minLat: center.lat - padDeg,
      maxLat: center.lat + padDeg,
      minLng: center.lng - padDeg,
      maxLng: center.lng + padDeg,
    },
  };
}

export type PlaceSearchQuery = {
  text?: string;
  city?: string;
  postalCode?: string;
  near?: GeoPoint;
  radiusKm?: number;
};

export type PlaceSearchResult = {
  label: string;
  city?: string | null;
  postalCode?: string | null;
  point?: GeoPoint | null;
};

export type PlaceSearchService = {
  search: (query: PlaceSearchQuery) => Promise<PlaceSearchResult[]>;
};

export type BookMapCategory = "bookstore" | "library" | "reading_cafe";

export type BookMapPlace = {
  id: string;
  name: string;
  category: BookMapCategory;
  address_text: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  lat: number;
  lng: number;
  website: string | null;
  phone: string | null;
  hours: Record<string, unknown> | null;
  verified: boolean;
  active: boolean;
  source: string | null;
};

export type BookMapListQuery = {
  category?: BookMapCategory | "all";
  bounds?: MapViewport["bounds"];
  city?: string;
  postalCode?: string;
  near?: GeoPoint;
  text?: string;
};

export type BookMapService = {
  listPlaces: (query: BookMapListQuery) => Promise<BookMapPlace[]>;
  getPlace: (id: string) => Promise<BookMapPlace | null>;
};
