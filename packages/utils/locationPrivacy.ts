/**
 * Location privacy for Reader Map and Home meetups.
 * Business Book Map places may use precise coords.
 * Reader homes / GPS must never share that exposure path.
 */

import type { ReaderMapCoarsenessMode } from "./homeEligibility";

export const READER_MAP_DEFAULT_OPT_IN = false;

/** Precise GPS is kept only long enough for a private nearby calc, then dropped. */
export const PRECISE_LOCATION_MAX_RETENTION_MS = 15 * 60 * 1000;

export const READER_MAP_OPT_IN_COPY = {
  title: "Show me on Reader Map",
  body: "Reader Map is off by default. If you opt in, other Home members may see a coarse city, college, or area — never your exact home or live GPS. You can turn this off any time. Nearby distance is calculated privately on your device and is never shown as “X feet away.”",
  revoke: "Stop being discoverable. Your precise location is cleared.",
} as const;

const CITY_QUANTIZE_DEG = 0.08;
const NEIGHBORHOOD_QUANTIZE_DEG = 0.02;

function quantize(value: number, step: number): number {
  return Number((Math.round(value / step) * step).toFixed(4));
}

function seededJitter(userId: string, salt: string): number {
  let hash = 0;
  const key = `${userId}:${salt}`;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return (hash / 997 - 0.5) * 0.03;
}

export type CoarseLocation = {
  coarse_lat: number;
  coarse_lng: number;
  coarseness_mode: ReaderMapCoarsenessMode;
};

export function coarsenLatLng(
  lat: number,
  lng: number,
  mode: ReaderMapCoarsenessMode,
  userId = "anon"
): CoarseLocation {
  const step = mode === "neighborhood" ? NEIGHBORHOOD_QUANTIZE_DEG : CITY_QUANTIZE_DEG;
  let coarseLat = quantize(lat, step);
  let coarseLng = quantize(lng, step);
  if (mode === "randomized") {
    coarseLat = Number((coarseLat + seededJitter(userId, "lat")).toFixed(4));
    coarseLng = Number((coarseLng + seededJitter(userId, "lng")).toFixed(4));
  }
  return { coarse_lat: coarseLat, coarse_lng: coarseLng, coarseness_mode: mode };
}

export type PreciseLocationFields = {
  precise_lat?: number | null;
  precise_lng?: number | null;
  precise_captured_at?: string | null;
};

export type PublicReaderMarker = {
  user_id: string;
  coarse_lat: number;
  coarse_lng: number;
  city_label: string | null;
  college_label?: string | null;
  personality_label?: string | null;
};

/** Strip any precise GPS keys before a payload can leave the server. */
export function toPublicReaderMarker(
  row: PublicReaderMarker & PreciseLocationFields & Record<string, unknown>
): PublicReaderMarker {
  return {
    user_id: row.user_id,
    coarse_lat: row.coarse_lat,
    coarse_lng: row.coarse_lng,
    city_label: typeof row.city_label === "string" ? row.city_label : null,
    college_label: typeof row.college_label === "string" ? row.college_label : null,
    personality_label:
      typeof row.personality_label === "string" ? row.personality_label : null,
  };
}

export function publicSelectHasPreciseCoords(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return (
    "precise_lat" in record ||
    "precise_lng" in record ||
    "gps_lat" in record ||
    "gps_lng" in record ||
    "latitude" in record ||
    "longitude" in record
  );
}

export function shouldDropPreciseLocation(
  capturedAt: string | Date | null | undefined,
  now = Date.now(),
  maxMs = PRECISE_LOCATION_MAX_RETENTION_MS
): boolean {
  if (!capturedAt) return true;
  const at = typeof capturedAt === "string" ? new Date(capturedAt).getTime() : capturedAt.getTime();
  if (!Number.isFinite(at)) return true;
  return now - at >= maxMs;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Never show “214 feet away”. Public copy stays coarse. */
export function formatPublicDistanceKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 8) return "In your area";
  if (km < 40) return "Nearby city";
  return "Same region";
}

export function inViewport(
  point: { lat: number; lng: number },
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  );
}

export const READER_MAP_VIEWPORT_LIMIT = 40;
export const READER_MAP_QUERY_RATE_PER_MINUTE = 20;
